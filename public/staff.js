/**
 * staff.js — Staff tablet page logic for IsQolar.
 * No build step, no dependencies, no imports/exports.
 * Classic IIFE script loaded after poll.js.
 */
(function () {
  // ---------------------------------------------------------------------------
  // localStorage helpers — wrapped so the page works even when storage throws
  // ---------------------------------------------------------------------------
  function lsGet(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // storage unavailable — ignore
    }
  }

  function lsRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // storage unavailable — ignore
    }
  }

  // ---------------------------------------------------------------------------
  // fetchT — fetch with AbortController timeout (ms).
  // A rejected promise (network error or timeout) means hub unreachable.
  // Any HTTP response means hub reachable.
  // ---------------------------------------------------------------------------
  function fetchT(url, options, ms) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms);
    var opts = Object.assign({}, options || {}, { signal: ctrl.signal });
    return fetch(url, opts).finally(function () { clearTimeout(timer); });
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var stallId = null;        // stall id from ?stall=
  var stallName = '';        // display name
  var lsKey = null;          // isqolar.staff.called.STALL
  var lsSyncKey = null;      // isqolar.staff.sync.STALL

  // calledTicket: {id, code, name, course[, sync:'waiting'|'synced']} or null
  var calledTicket = null;
  var inflight = false;      // true while any POST is in flight (or replay)
  var waitingCount = 0;      // last known queue length
  var msgFromPoll = false;   // true when elMsg was last set by the queue poll

  // D3: last undoable action — not persisted, cleared on reload
  var lastAction = null;

  // H2 state
  var hubDown = false;       // true when hub is unreachable
  var lastQueue = [];        // copy of most recent queue array from onQueueData
  var replayRunning = false; // true while replay() is executing

  // DOM refs set up after render
  var elHeader = null;
  var elSyncLine = null;     // H2: sync status line under the header
  var elWaiting = null;
  var elCalled = null;
  var elMsg = null;
  var elLastAction = null;
  var elUndoBtn = null;
  var elCallBtn = null;
  var elDoneBtn = null;
  var elSkipBtn = null;
  var elSavedSection = null; // H2: saved-actions section
  var elSavedList = null;

  // D3: lookup section refs
  var elLookupInput = null;
  var elLookupMsg = null;
  var elLookupResult = null;
  var elLookupUndoBtn = null;

  // ---------------------------------------------------------------------------
  // Sync list helpers
  // ---------------------------------------------------------------------------
  function loadSyncList() {
    return lsGet(lsSyncKey) || [];
  }

  function saveSyncList(list) {
    lsSet(lsSyncKey, list);
  }

  function makeSyncId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function unsyncedItems(list) {
    return list.filter(function (i) { return !i.syncedLater; });
  }

  function hasUnsynced(list) {
    return unsyncedItems(list).length > 0;
  }

  // After replay: keep every unsynced item and the newest 10 synced items,
  // without changing order (oldest first throughout).
  function trimSyncList(list) {
    // Count synced items from the end; mark the ones to keep.
    var syncedKept = 0;
    var keepIds = {};
    for (var k = list.length - 1; k >= 0; k--) {
      if (!list[k].syncedLater) {
        keepIds[list[k].id] = true;
      } else if (syncedKept < 10) {
        keepIds[list[k].id] = true;
        syncedKept++;
      }
    }
    return list.filter(function (i) { return keepIds[i.id]; });
  }

  // The consumed ticket ids: ticketId of every done item + calledTicket.id
  function consumedIds(list) {
    var ids = [];
    list.forEach(function (item) {
      if (item.action === 'done' && item.ticketId) ids.push(item.ticketId);
    });
    if (calledTicket) ids.push(calledTicket.id);
    return ids;
  }

  // Save mode: on while hub is down OR any item is unsynced.
  function inSaveMode() {
    return hubDown || hasUnsynced(loadSyncList());
  }

  // ---------------------------------------------------------------------------
  // Render: build the page skeleton
  // ---------------------------------------------------------------------------
  function buildPage() {
    var app = document.getElementById('app');
    app.innerHTML = '';

    // header
    elHeader = document.createElement('div');
    elHeader.className = 'header';
    app.appendChild(elHeader);

    // H2: sync status line
    elSyncLine = document.createElement('div');
    elSyncLine.className = 'sync-line';
    app.appendChild(elSyncLine);

    // waiting count
    elWaiting = document.createElement('p');
    elWaiting.className = 'waiting';
    app.appendChild(elWaiting);

    // called ticket panel
    elCalled = document.createElement('div');
    elCalled.className = 'called-panel';
    app.appendChild(elCalled);

    // message line
    elMsg = document.createElement('p');
    elMsg.className = 'msg';
    app.appendChild(elMsg);

    // last-action line with inline Undo button
    var laRow = document.createElement('div');
    laRow.className = 'last-action-row';

    elLastAction = document.createElement('span');
    elLastAction.className = 'last-action-text';

    elUndoBtn = document.createElement('button');
    elUndoBtn.className = 'btn btn-undo';
    elUndoBtn.textContent = 'Undo';
    elUndoBtn.addEventListener('click', onUndoLastAction);
    elUndoBtn.style.display = 'none';

    laRow.appendChild(elLastAction);
    laRow.appendChild(elUndoBtn);
    app.appendChild(laRow);

    // main buttons
    var btnRow = document.createElement('div');
    btnRow.className = 'btn-row';

    elCallBtn = document.createElement('button');
    elCallBtn.className = 'btn btn-call';
    elCallBtn.textContent = 'Call next';
    elCallBtn.addEventListener('click', onCallNext);

    elDoneBtn = document.createElement('button');
    elDoneBtn.className = 'btn btn-done';
    elDoneBtn.textContent = 'Mark done';
    elDoneBtn.addEventListener('click', onMarkDone);

    elSkipBtn = document.createElement('button');
    elSkipBtn.className = 'btn btn-skip';
    elSkipBtn.textContent = 'Skip';
    elSkipBtn.addEventListener('click', onSkip);

    btnRow.appendChild(elCallBtn);
    btnRow.appendChild(elDoneBtn);
    btnRow.appendChild(elSkipBtn);
    app.appendChild(btnRow);

    // H2: saved-actions section (hidden when empty)
    elSavedSection = document.createElement('div');
    elSavedSection.className = 'saved-section';
    elSavedSection.style.display = 'none';

    var savedTitle = document.createElement('h2');
    savedTitle.className = 'saved-title';
    savedTitle.textContent = 'Saved on this tablet';
    elSavedSection.appendChild(savedTitle);

    elSavedList = document.createElement('ul');
    elSavedList.className = 'saved-list';
    elSavedSection.appendChild(elSavedList);

    app.appendChild(elSavedSection);

    // D3: lookup section
    var lookupSection = document.createElement('div');
    lookupSection.className = 'lookup-section';

    var lookupTitle = document.createElement('h2');
    lookupTitle.className = 'lookup-title';
    lookupTitle.textContent = 'Find a ticket';
    lookupSection.appendChild(lookupTitle);

    var lookupForm = document.createElement('form');
    lookupForm.className = 'lookup-form';
    lookupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      onLookup();
    });

    elLookupInput = document.createElement('input');
    elLookupInput.type = 'text';
    elLookupInput.className = 'lookup-input';
    elLookupInput.setAttribute('inputmode', 'numeric');
    elLookupInput.setAttribute('autocomplete', 'off');
    elLookupInput.setAttribute('placeholder', 'Ticket code');

    var findBtn = document.createElement('button');
    findBtn.type = 'submit';
    findBtn.className = 'btn btn-find';
    findBtn.textContent = 'Find';

    lookupForm.appendChild(elLookupInput);
    lookupForm.appendChild(findBtn);
    lookupSection.appendChild(lookupForm);

    elLookupMsg = document.createElement('p');
    elLookupMsg.className = 'lookup-msg';
    lookupSection.appendChild(elLookupMsg);

    elLookupResult = document.createElement('div');
    elLookupResult.className = 'lookup-result';
    lookupSection.appendChild(elLookupResult);

    app.appendChild(lookupSection);
  }

  function showErrorPage(msg) {
    var app = document.getElementById('app');
    app.textContent = '';
    var p = document.createElement('p');
    p.className = 'error-page';
    p.textContent = msg;
    app.appendChild(p);
  }

  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------
  function renderHeader() {
    elHeader.textContent = '';
    var h1 = document.createElement('h1');
    h1.textContent = stallName ? stallId + ' - ' + stallName : stallId;
    elHeader.appendChild(h1);
  }

  // ---------------------------------------------------------------------------
  // H2: sync status line
  // ---------------------------------------------------------------------------
  function renderSyncLine() {
    var list = loadSyncList();
    var nUnsynced = unsyncedItems(list).length;

    if (hubDown) {
      var text = 'Offline. Call next and Mark done are saved on this tablet.';
      if (nUnsynced > 0) text += ' ' + nUnsynced + ' waiting to sync.';
      elSyncLine.textContent = text;
      elSyncLine.style.display = '';
    } else if (replayRunning) {
      elSyncLine.textContent = 'Back online. Syncing ' + nUnsynced + ' saved action' + (nUnsynced === 1 ? '' : 's') + '\u2026';
      elSyncLine.style.display = '';
    } else if (nUnsynced > 0) {
      elSyncLine.textContent = nUnsynced + ' waiting to sync.';
      elSyncLine.style.display = '';
    } else {
      elSyncLine.textContent = '';
      elSyncLine.style.display = 'none';
    }
  }

  // ---------------------------------------------------------------------------
  // H2: waiting line (shows "(last known)" when hub is down)
  // ---------------------------------------------------------------------------
  function renderWaiting() {
    var list = loadSyncList();
    var consumed = consumedIds(list);
    if (hubDown) {
      var avail = lastQueue.filter(function (t) {
        return consumed.indexOf(t.id) === -1;
      }).length;
      elWaiting.textContent = 'Waiting: ' + avail + ' (last known)';
    } else {
      elWaiting.textContent = 'Waiting: ' + waitingCount;
    }
  }

  // ---------------------------------------------------------------------------
  // H2: saved-actions section
  // ---------------------------------------------------------------------------
  function renderSavedSection() {
    var list = loadSyncList();
    // Show newest 10 items, newest first.
    var display = list.slice(-10).reverse();
    if (display.length === 0) {
      elSavedSection.style.display = 'none';
      return;
    }
    elSavedSection.style.display = '';
    elSavedList.textContent = '';
    display.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'saved-item';
      var label = item.action === 'next' ? 'Call next' : 'Mark done';
      var time = '';
      try {
        time = new Date(item.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        time = item.savedAt || '';
      }
      var status = item.syncedLater ? 'synced later' : 'waiting to sync';
      li.textContent = label + ' \u00b7 ' + time + ' \u00b7 ' + status;
      elSavedList.appendChild(li);
    });
  }

  // ---------------------------------------------------------------------------
  // Called-ticket panel (shows sync mark when calledTicket.sync is set)
  // ---------------------------------------------------------------------------
  function renderCalledPanel() {
    elCalled.textContent = '';
    if (!calledTicket) return;
    var big = document.createElement('div');
    big.className = 'ticket-code';
    big.textContent = calledTicket.code;
    var nameEl = document.createElement('div');
    nameEl.className = 'ticket-name';
    nameEl.textContent = calledTicket.name;
    var courseEl = document.createElement('div');
    courseEl.className = 'ticket-course';
    courseEl.textContent = calledTicket.course;
    elCalled.appendChild(big);
    elCalled.appendChild(nameEl);
    elCalled.appendChild(courseEl);
    if (calledTicket.sync) {
      var syncMark = document.createElement('div');
      syncMark.className = 'ticket-sync-mark';
      if (calledTicket.sync === 'waiting') {
        syncMark.textContent = 'Saved on this tablet, waiting to sync';
      } else {
        syncMark.textContent = 'Synced later';
      }
      elCalled.appendChild(syncMark);
    }
  }

  // ---------------------------------------------------------------------------
  // Last-action line
  // ---------------------------------------------------------------------------
  function renderLastAction() {
    if (!lastAction) {
      elLastAction.textContent = '';
      elUndoBtn.style.display = 'none';
      return;
    }
    var label = lastAction.type === 'call'
      ? lastAction.code + ' called'
      : lastAction.type === 'skip'
        ? lastAction.code + ' skipped'
        : lastAction.code + ' done';
    elLastAction.textContent = label + '\u00a0';
    elUndoBtn.style.display = '';
  }

  function renderLastActionNoUndo() {
    elUndoBtn.style.display = 'none';
  }

  // ---------------------------------------------------------------------------
  // Button state
  // ---------------------------------------------------------------------------
  function syncButtons() {
    elCallBtn.disabled = inflight || calledTicket !== null;
    elDoneBtn.disabled = inflight || calledTicket === null;
    elSkipBtn.disabled = inflight || calledTicket === null;
    elUndoBtn.disabled = inflight;
    if (elLookupUndoBtn) elLookupUndoBtn.disabled = inflight;
  }

  // Render all dynamic UI in one call — used after state changes.
  function renderAll() {
    renderSyncLine();
    renderWaiting();
    renderCalledPanel();
    renderSavedSection();
    syncButtons();
  }

  // ---------------------------------------------------------------------------
  // Queue poll callback
  // ---------------------------------------------------------------------------
  function onQueueData(data) {
    if (!Array.isArray(data)) {
      if (data && data.error) {
        elMsg.textContent = 'Queue error: ' + data.error;
        msgFromPoll = true;
      }
      return;
    }
    // A good poll response means the hub is reachable.
    hubDown = false;
    if (hasUnsynced(loadSyncList())) replay();
    renderAll();
    if (msgFromPoll) {
      elMsg.textContent = '';
      msgFromPoll = false;
    }
    lastQueue = data.slice();
    waitingCount = data.length;
    renderWaiting();
    renderSyncLine();
  }

  // ---------------------------------------------------------------------------
  // H2: health probe every 3 s
  // ---------------------------------------------------------------------------
  var probeRunning = false;

  function startProbe() {
    setInterval(function () {
      if (probeRunning) return;
      probeRunning = true;
      fetchT('/health', null, 3000)
        .then(function (res) {
          return res.json().then(function (body) { return { ok: res.ok, body: body }; });
        })
        .then(function (r) {
          if (r.ok && r.body && r.body.ok) {
            hubDown = false;
            if (hasUnsynced(loadSyncList())) replay();
            renderAll();
          } else {
            if (!hubDown) { hubDown = true; renderAll(); }
          }
        })
        .catch(function () {
          if (!hubDown) { hubDown = true; renderAll(); }
        })
        .finally(function () { probeRunning = false; });
    }, 3000);
  }

  // ---------------------------------------------------------------------------
  // H2: Save mode — Call next path
  // ---------------------------------------------------------------------------
  function saveCallNext(predicted) {
    var list = loadSyncList();
    var next = predicted || null;
    if (!next) {
      var consumed = consumedIds(list);
      for (var i = 0; i < lastQueue.length; i++) {
        if (consumed.indexOf(lastQueue[i].id) === -1) {
          next = lastQueue[i];
          break;
        }
      }
    }
    if (!next) {
      msgFromPoll = false;
      elMsg.textContent = 'No one is waiting in the last known queue.';
      return;
    }
    calledTicket = { id: next.id, code: next.code, name: next.name, course: next.course, sync: 'waiting' };
    if (next.skippedAt) calledTicket.skippedAt = next.skippedAt;
    lsSet(lsKey, calledTicket);
    var item = { id: makeSyncId(), action: 'next', stall: stallId, ticketId: null, savedAt: new Date().toISOString(), syncedLater: false };
    list.push(item);
    saveSyncList(list);
    lastAction = null;
    elLastAction.textContent = next.code + ' called';
    elUndoBtn.style.display = 'none';
    msgFromPoll = false;
    elMsg.textContent = 'Saved on this tablet. It will sync when the hub is back.';
    renderAll();
  }

  // ---------------------------------------------------------------------------
  // H2: Save mode — Mark done path
  // ---------------------------------------------------------------------------
  function saveMarkDone() {
    var ticketCode = calledTicket.code;
    var ticketId = calledTicket.id;
    var list = loadSyncList();
    var item = { id: makeSyncId(), action: 'done', stall: stallId, ticketId: ticketId, savedAt: new Date().toISOString(), syncedLater: false };
    list.push(item);
    saveSyncList(list);
    lastAction = null;
    elLastAction.textContent = ticketCode + ' done';
    elUndoBtn.style.display = 'none';
    calledTicket = null;
    lsRemove(lsKey);
    msgFromPoll = false;
    elMsg.textContent = 'Saved on this tablet. It will sync when the hub is back.';
    renderAll();
  }

  // ---------------------------------------------------------------------------
  // Call next
  // ---------------------------------------------------------------------------
  function onCallNext() {
    if (inflight || calledTicket !== null) return;

    if (inSaveMode()) {
      saveCallNext();
      return;
    }

    var consumed = consumedIds(loadSyncList());
    var predicted = null;
    for (var i = 0; i < lastQueue.length; i++) {
      if (consumed.indexOf(lastQueue[i].id) === -1) {
        predicted = lastQueue[i];
        break;
      }
    }

    inflight = true;
    msgFromPoll = false;
    elMsg.textContent = '';
    syncButtons();

    fetchT('/api/stalls/' + encodeURIComponent(stallId) + '/next', { method: 'POST' }, 4000)
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (r) {
        if (r.ok) {
          calledTicket = { id: r.body.id, code: r.body.code, name: r.body.name, course: r.body.course };
          if (r.body.skippedAt) calledTicket.skippedAt = r.body.skippedAt;
          lsSet(lsKey, calledTicket);
          lastAction = { type: 'call', id: r.body.id, code: r.body.code, name: r.body.name, course: r.body.course };
          renderCalledPanel();
          renderLastAction();
        } else if (r.status === 404 && r.body.error === 'queue is empty') {
          msgFromPoll = false;
          elMsg.textContent = 'No one is waiting.';
        } else {
          msgFromPoll = false;
          elMsg.textContent = 'Error: ' + (r.body.error || r.status);
        }
      })
      .catch(function () {
        // Network failure — switch to save mode and run the saved path.
        hubDown = true;
        inflight = false;
        syncButtons();
        saveCallNext(predicted);
        return; // skip finally's syncButtons
      })
      .finally(function () {
        // Only reached when .catch did not return early via the save path.
        // Guard: if inflight was already cleared in .catch, do not double-clear.
        if (inflight) {
          inflight = false;
          syncButtons();
        }
      });
  }

  // ---------------------------------------------------------------------------
  // Mark done
  // ---------------------------------------------------------------------------
  function onMarkDone() {
    if (inflight || calledTicket === null) return;

    if (inSaveMode()) {
      saveMarkDone();
      return;
    }

    inflight = true;
    msgFromPoll = false;
    elMsg.textContent = '';
    syncButtons();

    var ticketId = calledTicket.id;
    var ticketCode = calledTicket.code;
    var ticketName = calledTicket.name;
    var ticketCourse = calledTicket.course;

    fetchT('/api/tickets/' + encodeURIComponent(ticketId) + '/done', { method: 'POST' }, 4000)
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (r) {
        if (r.ok) {
          lastAction = { type: 'done', id: ticketId, code: ticketCode, name: ticketName, course: ticketCourse };
          calledTicket = null;
          lsRemove(lsKey);
          renderCalledPanel();
          renderLastAction();
        } else if (r.status === 400 && r.body.error === 'already at final station') {
          lastAction = null;
          elLastAction.textContent = ticketCode + ' done';
          calledTicket = null;
          lsRemove(lsKey);
          renderCalledPanel();
          renderLastActionNoUndo();
        } else if (r.status === 404) {
          msgFromPoll = false;
          lastAction = null;
          elMsg.textContent = 'Ticket no longer exists on the hub.';
          calledTicket = null;
          lsRemove(lsKey);
          renderCalledPanel();
          renderLastAction();
        } else {
          msgFromPoll = false;
          elMsg.textContent = 'Error: ' + (r.body.error || r.status);
        }
      })
      .catch(function () {
        hubDown = true;
        inflight = false;
        syncButtons();
        saveMarkDone();
        return;
      })
      .finally(function () {
        if (inflight) {
          inflight = false;
          renderCalledPanel();
          syncButtons();
        }
      });
  }

  // ---------------------------------------------------------------------------
  // Skip (same timeout and undo pattern as Mark done)
  // ---------------------------------------------------------------------------
  function onSkip() {
    if (inflight || calledTicket === null) return;

    if (inSaveMode()) {
      msgFromPoll = false;
      elMsg.textContent = 'Cannot reach the hub. Try again.';
      return;
    }

    if (calledTicket.skippedAt) {
      var ok = window.confirm(
        'This ticket was already skipped once. Skip again to cancel ' + calledTicket.code + '?'
      );
      if (!ok) return;
    }

    inflight = true;
    msgFromPoll = false;
    elMsg.textContent = '';
    syncButtons();

    var ticketId = calledTicket.id;
    var ticketCode = calledTicket.code;
    var ticketName = calledTicket.name;
    var ticketCourse = calledTicket.course;

    fetchT('/api/tickets/' + encodeURIComponent(ticketId) + '/skip', { method: 'POST' }, 4000)
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (r) {
        if (r.ok) {
          lastAction = { type: 'skip', id: ticketId, code: ticketCode, name: ticketName, course: ticketCourse };
          calledTicket = null;
          lsRemove(lsKey);
          renderCalledPanel();
          renderLastAction();
        } else if (r.status === 404) {
          msgFromPoll = false;
          lastAction = null;
          elMsg.textContent = 'Ticket no longer exists on the hub.';
          calledTicket = null;
          lsRemove(lsKey);
          renderCalledPanel();
          renderLastAction();
        } else {
          msgFromPoll = false;
          elMsg.textContent = 'Error: ' + (r.body.error || r.status);
        }
      })
      .catch(function () {
        msgFromPoll = false;
        elMsg.textContent = 'Cannot reach the hub. Try again.';
        if (!hubDown) { hubDown = true; renderAll(); }
      })
      .finally(function () {
        if (inflight) {
          inflight = false;
          renderCalledPanel();
          syncButtons();
        }
      });
  }

  // ---------------------------------------------------------------------------
  // Undo last action (D3 Part A — online only)
  // ---------------------------------------------------------------------------
  function onUndoLastAction() {
    if (inflight || !lastAction) return;

    var action = lastAction;
    if (action.type === 'call' && (!calledTicket || calledTicket.id !== action.id)) return;
    if ((action.type === 'done' || action.type === 'skip') && calledTicket !== null) return;

    inflight = true;
    msgFromPoll = false;
    elMsg.textContent = '';
    syncButtons();

    fetchT('/api/tickets/' + encodeURIComponent(action.id) + '/undo', { method: 'POST' }, 4000)
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (r) {
        if (r.ok) {
          lastAction = null;
          if (action.type === 'call') {
            calledTicket = null;
            lsRemove(lsKey);
            renderCalledPanel();
            renderLastAction();
            msgFromPoll = false;
            elMsg.textContent = action.code + ' is back in line.';
          } else {
            renderLastAction();
            if (r.body.station === 'stall' && r.body.status === 'called') {
              calledTicket = { id: r.body.id, code: r.body.code, name: r.body.name, course: r.body.course };
              if (r.body.skippedAt) calledTicket.skippedAt = r.body.skippedAt;
              lsSet(lsKey, calledTicket);
              renderCalledPanel();
              msgFromPoll = false;
              elMsg.textContent = action.code + ' is called again.';
            } else {
              msgFromPoll = false;
              elMsg.textContent = action.code + ' is now at ' + r.body.station + '.';
            }
          }
        } else if (r.status === 400 && r.body.error === 'nothing to undo') {
          lastAction = null;
          renderLastAction();
          msgFromPoll = false;
          elMsg.textContent = 'Nothing to undo.';
        } else if (r.status === 404) {
          lastAction = null;
          renderLastAction();
          msgFromPoll = false;
          if (calledTicket && calledTicket.id === action.id) {
            calledTicket = null;
            lsRemove(lsKey);
            renderCalledPanel();
          }
          elMsg.textContent = 'Ticket no longer exists on the hub.';
        } else {
          msgFromPoll = false;
          elMsg.textContent = 'Error: ' + (r.body.error || r.status);
        }
      })
      .catch(function () {
        msgFromPoll = false;
        elMsg.textContent = 'Cannot reach the hub. Try again.';
        if (!hubDown) { hubDown = true; renderAll(); }
      })
      .finally(function () {
        inflight = false;
        syncButtons();
      });
  }

  // ---------------------------------------------------------------------------
  // H2: replay
  // ---------------------------------------------------------------------------
  function replay() {
    if (replayRunning || inflight || hubDown) return;
    var list = loadSyncList();
    if (!hasUnsynced(list)) return;

    replayRunning = true;
    inflight = true;
    var notes = [];
    var syncedThisRun = 0;
    renderSyncLine();
    syncButtons();

    // Process items sequentially via a recursive step function.
    function step(items) {
      if (items.length === 0) {
        finish(notes);
        return;
      }
      var item = items[0];
      var rest = items.slice(1);

      if (item.action === 'next') {
        replayNext(item, rest, notes);
      } else {
        replayDone(item, rest, notes);
      }
    }

    // Replay a 'next' item.
    function replayNext(item, rest, notes) {
      // E = ticketId of first done after this item, or calledTicket.id.
      var listNow = loadSyncList();
      var myIdx = -1;
      for (var i = 0; i < listNow.length; i++) {
        if (listNow[i].id === item.id) { myIdx = i; break; }
      }
      var E = null;
      if (myIdx !== -1) {
        for (var j = myIdx + 1; j < listNow.length; j++) {
          if (listNow[j].action === 'done' && listNow[j].ticketId) {
            E = listNow[j].ticketId;
            break;
          }
        }
      }
      if (!E && calledTicket) E = calledTicket.id;
      if (!E) {
        // No expected ticket — drop this item.
        dropItem(item, 'Saved Call next dropped: no expected ticket.');
        notes.push('Saved Call next dropped: no expected ticket.');
        step(rest);
        return;
      }
      // GET the expected ticket.
      fetchT('/api/tickets/' + encodeURIComponent(E), null, 4000)
        .then(function (res) {
          return res.json().then(function (body) { return { ok: res.ok, body: body }; });
        })
        .then(function (r) {
          if (!r.ok) {
            // 404 — drop
            if (calledTicket && calledTicket.id === E) {
              calledTicket = null;
              lsRemove(lsKey);
            }
            dropItem(item, 'Saved Call next dropped: ticket no longer exists on the hub.');
            notes.push('Saved Call next dropped: ticket no longer exists on the hub.');
            step(rest);
            return;
          }
          var t = r.body;
          if (t.station === 'stall' && t.stall === stallId && t.status === 'called') {
            // Already called on the hub — mark synced without posting.
            markSynced(item);
            if (calledTicket && calledTicket.id === E) {
              calledTicket = Object.assign({}, calledTicket, { sync: 'synced' });
              if (t.skippedAt) calledTicket.skippedAt = t.skippedAt; else delete calledTicket.skippedAt;
              lsSet(lsKey, calledTicket);
            }
            step(rest);
            return;
          }
          if (t.station === 'stall' && t.stall === stallId && t.status === 'waiting') {
            // Post next.
            fetchT('/api/stalls/' + encodeURIComponent(stallId) + '/next', { method: 'POST' }, 4000)
              .then(function (res2) {
                return res2.json().then(function (body2) { return { ok: res2.ok, body: body2 }; });
              })
              .then(function (r2) {
                if (r2.ok && r2.body.id === E) {
                  markSynced(item);
                  if (calledTicket && calledTicket.id === E) {
                    calledTicket = Object.assign({}, calledTicket, { sync: 'synced' });
                    if (r2.body.skippedAt) calledTicket.skippedAt = r2.body.skippedAt; else delete calledTicket.skippedAt;
                    lsSet(lsKey, calledTicket);
                  }
                  step(rest);
                } else if (r2.ok) {
                  var wrongCode = r2.body.code;
                  fetchT('/api/tickets/' + encodeURIComponent(r2.body.id) + '/undo', { method: 'POST' }, 4000)
                    .then(function (undoRes) {
                      return undoRes.json().then(function () {
                        return { ok: undoRes.ok };
                      });
                    })
                    .then(function (ur) {
                      if (ur.ok) {
                        if (calledTicket && calledTicket.id === E) {
                          calledTicket = null;
                          lsRemove(lsKey);
                        }
                        dropItem(item, 'Saved Call next dropped: the line changed.');
                        notes.push('The hub had ' + wrongCode + ' first in line, so ' + wrongCode + ' went back in line. ' + (t.code || E) + ' was not called.');
                      } else {
                        notes.push('Could not put ' + wrongCode + ' back in line.');
                        hubDown = true;
                        finish(notes);
                      }
                    })
                    .catch(function () {
                      notes.push('Could not put ' + wrongCode + ' back in line.');
                      hubDown = true;
                      finish(notes);
                      return;
                    })
                    .then(function () {
                      if (!hubDown) step(rest);
                    });
                } else {
                  // Non-200 from next — drop.
                  if (calledTicket && calledTicket.id === E) {
                    calledTicket = null;
                    lsRemove(lsKey);
                  }
                  dropItem(item, 'Saved Call next dropped: unexpected response from hub.');
                  notes.push('Saved Call next dropped: unexpected response from hub.');
                  step(rest);
                }
              })
              .catch(function () {
                hubDown = true;
                finish(notes);
              });
            return;
          }
          // Any other state — drop.
          if (calledTicket && calledTicket.id === E) {
            calledTicket = null;
            lsRemove(lsKey);
          }
          var dropMsg = 'Saved Call next dropped: ' + (t.code || E) + ' is no longer at ' + stallId + '.';
          dropItem(item, dropMsg);
          notes.push(dropMsg);
          step(rest);
        })
        .catch(function () {
          hubDown = true;
          finish(notes);
        });
    }

    // Replay a 'done' item.
    function replayDone(item, rest, notes) {
      var T = item.ticketId;
      if (!T) {
        dropItem(item, 'Saved Mark done dropped: no ticket id.');
        notes.push('Saved Mark done dropped: no ticket id.');
        step(rest);
        return;
      }
      fetchT('/api/tickets/' + encodeURIComponent(T), null, 4000)
        .then(function (res) {
          return res.json().then(function (body) { return { ok: res.ok, body: body }; });
        })
        .then(function (r) {
          if (!r.ok) {
            dropItem(item, 'Saved Mark done dropped: ticket no longer exists on the hub.');
            notes.push('Saved Mark done dropped: ticket no longer exists on the hub.');
            step(rest);
            return;
          }
          var t = r.body;
          if (t.station === 'enrolled') {
            // Already done — mark synced.
            markSynced(item);
            step(rest);
            return;
          }
          if (t.station === 'stall' && t.stall === stallId) {
            // Post done.
            fetchT('/api/tickets/' + encodeURIComponent(T) + '/done', { method: 'POST' }, 4000)
              .then(function (res2) {
                return res2.json().then(function (body2) { return { ok: res2.ok, status: res2.status, body: body2 }; });
              })
              .then(function (r2) {
                if (r2.ok || (r2.status === 400 && r2.body.error === 'already at final station')) {
                  markSynced(item);
                  step(rest);
                } else if (r2.status === 404) {
                  dropItem(item, 'Saved Mark done dropped: ticket no longer exists on the hub.');
                  notes.push('Saved Mark done dropped: ticket no longer exists on the hub.');
                  step(rest);
                } else {
                  dropItem(item, 'Saved Mark done dropped: unexpected response from hub.');
                  notes.push('Saved Mark done dropped: unexpected response from hub.');
                  step(rest);
                }
              })
              .catch(function () {
                hubDown = true;
                finish(notes);
              });
            return;
          }
          // Any other state — drop.
          var dropMsg = 'Saved Mark done for ' + (t.code || T) + ' dropped: ' + (t.code || T) + ' is no longer at ' + stallId + '.';
          dropItem(item, dropMsg);
          notes.push(dropMsg);
          step(rest);
        })
        .catch(function () {
          hubDown = true;
          finish(notes);
        });
    }

    function markSynced(item) {
      syncedThisRun++;
      var list = loadSyncList();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === item.id) { list[i].syncedLater = true; break; }
      }
      saveSyncList(list);
      renderSavedSection();
    }

    function dropItem(item, msg) {
      var list = loadSyncList();
      saveSyncList(list.filter(function (i) { return i.id !== item.id; }));
      renderSavedSection();
    }

    function finish(notes) {
      var list = trimSyncList(loadSyncList());
      saveSyncList(list);
      replayRunning = false;
      inflight = false;
      syncButtons();

      // Show "Synced later: N saved actions." + any notes.
      var msg = '';
      if (syncedThisRun > 0) {
        msg = 'Synced later: ' + syncedThisRun + ' saved action' + (syncedThisRun === 1 ? '' : 's') + '.';
      }
      if (notes.length > 0) {
        msg = (msg ? msg + ' ' : '') + notes.join(' ');
      }
      if (msg) {
        msgFromPoll = false;
        elMsg.textContent = msg;
      }

      renderAll();

      // Refresh queue count and lastQueue.
      fetchT('/api/stalls/' + encodeURIComponent(stallId) + '/queue', null, 4000)
        .then(function (res) { return res.json(); })
        .then(function (data) { if (Array.isArray(data)) { onQueueData(data); } })
        .catch(function () { /* ignore — probe will pick it up */ });
    }

    // Kick off with the unsynced items.
    step(unsyncedItems(loadSyncList()));
  }

  // ---------------------------------------------------------------------------
  // Lookup — normalize code
  // ---------------------------------------------------------------------------
  function normalizeCode(raw) {
    var trimmed = raw.trim();
    if (/^\d{1,3}$/.test(trimmed)) {
      return trimmed.padStart(4, '0');
    }
    return trimmed;
  }

  // ---------------------------------------------------------------------------
  // Lookup — Find button (D3 Part B)
  // ---------------------------------------------------------------------------
  function onLookup() {
    var raw = elLookupInput.value;
    var code = normalizeCode(raw);

    elLookupMsg.textContent = '';
    elLookupResult.textContent = '';
    elLookupUndoBtn = null;

    if (!code) {
      elLookupMsg.textContent = 'Type a ticket code.';
      return;
    }

    fetchT('/api/stalls/' + encodeURIComponent(stallId) + '/queue', null, 4000)
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (r) {
        if (!r.ok || !Array.isArray(r.body)) {
          elLookupMsg.textContent = 'Cannot reach the hub. Try again.';
          return;
        }
        var queue = r.body;
        var found = null;
        var foundIdx = 0;
        for (var i = 0; i < queue.length; i++) {
          if (queue[i].code === code) {
            found = queue[i];
            foundIdx = i;
            break;
          }
        }
        if (found) {
          renderLookupResult(found, foundIdx + 1);
        } else if (calledTicket && calledTicket.code === code) {
          elLookupMsg.textContent = code + ' is your called ticket. Use Undo above.';
        } else {
          elLookupMsg.textContent = code + ' is not waiting at ' + stallId + '.';
        }
      })
      .catch(function () {
        elLookupMsg.textContent = 'Cannot reach the hub. Try again.';
        if (!hubDown) { hubDown = true; renderAll(); }
      });
  }

  // ---------------------------------------------------------------------------
  // Lookup — render a found ticket
  // ---------------------------------------------------------------------------
  function renderLookupResult(ticket, position) {
    elLookupResult.textContent = '';
    elLookupUndoBtn = null;

    var codeEl = document.createElement('div');
    codeEl.className = 'lookup-code';
    codeEl.textContent = ticket.code;

    var nameEl = document.createElement('div');
    nameEl.className = 'lookup-name';
    nameEl.textContent = ticket.name;

    var courseEl = document.createElement('div');
    courseEl.className = 'lookup-course';
    courseEl.textContent = ticket.course;

    var posEl = document.createElement('div');
    posEl.className = 'lookup-pos';
    posEl.textContent = 'Position ' + position + ' in line';

    var undoBtn = document.createElement('button');
    undoBtn.className = 'btn btn-undo';
    undoBtn.textContent = 'Undo last move';
    undoBtn.addEventListener('click', function () {
      onLookupUndo(ticket.id, ticket.code, undoBtn);
    });

    elLookupResult.appendChild(codeEl);
    elLookupResult.appendChild(nameEl);
    elLookupResult.appendChild(courseEl);
    elLookupResult.appendChild(posEl);
    elLookupResult.appendChild(undoBtn);

    elLookupUndoBtn = undoBtn;
  }

  // ---------------------------------------------------------------------------
  // Lookup — Undo last move (D3 Part B item 10, online only)
  // ---------------------------------------------------------------------------
  function onLookupUndo(ticketId, ticketCode, btn) {
    if (inflight) return;
    inflight = true;
    elLookupMsg.textContent = '';
    syncButtons();

    fetchT('/api/tickets/' + encodeURIComponent(ticketId), null, 4000)
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (r) {
        if (!r.ok) {
          elLookupResult.textContent = '';
          elLookupUndoBtn = null;
          elLookupMsg.textContent = 'Ticket no longer exists on the hub.';
          inflight = false;
          syncButtons();
          return;
        }
        var t = r.body;
        if (t.station !== 'stall' || t.status !== 'waiting' || t.stall !== stallId) {
          elLookupResult.textContent = '';
          elLookupUndoBtn = null;
          elLookupMsg.textContent = ticketCode + ' is no longer waiting at ' + stallId + '. Find it again.';
          inflight = false;
          syncButtons();
          return;
        }
        fetchT('/api/tickets/' + encodeURIComponent(ticketId) + '/undo', { method: 'POST' }, 4000)
          .then(function (res2) {
            return res2.json().then(function (body2) {
              return { ok: res2.ok, status: res2.status, body: body2 };
            });
          })
          .then(function (r2) {
            if (r2.ok) {
              elLookupResult.textContent = '';
              elLookupUndoBtn = null;
              elLookupMsg.textContent = ticketCode + ' moved back to ' + r2.body.station + '.';
            } else if (r2.status === 400 && r2.body.error === 'nothing to undo') {
              elLookupMsg.textContent = 'Nothing to undo for ' + ticketCode + '.';
            } else if (r2.status === 404) {
              elLookupResult.textContent = '';
              elLookupUndoBtn = null;
              elLookupMsg.textContent = 'Ticket no longer exists on the hub.';
            } else {
              elLookupMsg.textContent = 'Error: ' + (r2.body.error || r2.status);
            }
          })
          .catch(function () {
            elLookupMsg.textContent = 'Cannot reach the hub. Try again.';
            if (!hubDown) { hubDown = true; renderAll(); }
          })
          .finally(function () {
            inflight = false;
            syncButtons();
          });
      })
      .catch(function () {
        elLookupMsg.textContent = 'Cannot reach the hub. Try again.';
        if (!hubDown) { hubDown = true; renderAll(); }
        inflight = false;
        syncButtons();
      });
  }

  // ---------------------------------------------------------------------------
  // Restore saved ticket on load (H2 modified)
  // ---------------------------------------------------------------------------
  function restoreSavedTicket(onDone) {
    var saved = lsGet(lsKey);
    var list = loadSyncList();

    // If unsynced items exist, keep the saved ticket as-is without a server check.
    if (saved && saved.id && hasUnsynced(list)) {
      calledTicket = saved;
      onDone();
      return;
    }

    if (!saved || !saved.id) {
      onDone();
      return;
    }

    fetchT('/api/tickets/' + encodeURIComponent(saved.id), null, 4000)
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (r) {
        if (r.ok && r.body.station === 'stall' && r.body.status === 'called') {
          calledTicket = saved;
        } else {
          lsRemove(lsKey);
          calledTicket = null;
        }
        onDone();
      })
      .catch(function () {
        calledTicket = saved;
        onDone();
      });
  }

  // ---------------------------------------------------------------------------
  // Load stall list with retry on network failure
  // ---------------------------------------------------------------------------
  function loadStalls(onSuccess, onUnknown) {
    fetchT('/api/stalls', null, 4000)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) {
          onUnknown([]);
          return;
        }
        onSuccess(data);
      })
      .catch(function () {
        var app = document.getElementById('app');
        app.textContent = '';
        var p = document.createElement('p');
        p.className = 'error-page';
        p.textContent = 'Cannot reach the hub. Retrying\u2026';
        app.appendChild(p);
        setTimeout(function () {
          loadStalls(onSuccess, onUnknown);
        }, 2000);
      });
  }

  // ---------------------------------------------------------------------------
  // Entry point
  // ---------------------------------------------------------------------------
  function init() {
    var params = new URLSearchParams(window.location.search);
    var rawStall = params.get('stall');

    loadStalls(function (stalls) {
      if (!rawStall) {
        var ids = stalls.map(function (s) { return s.id; }).join(', ');
        showErrorPage('Open this page with ?stall=  Valid stalls: ' + (ids || '(none)'));
        return;
      }

      var found = null;
      for (var i = 0; i < stalls.length; i++) {
        if (stalls[i].id === rawStall) {
          found = stalls[i];
          break;
        }
      }

      if (!found) {
        var ids2 = stalls.map(function (s) { return s.id; }).join(', ');
        showErrorPage('Unknown stall "' + rawStall + '". Valid stalls: ' + (ids2 || '(none)'));
        return;
      }

      stallId = found.id;
      stallName = found.name || '';
      lsKey = 'isqolar.staff.called.' + stallId;
      lsSyncKey = 'isqolar.staff.sync.' + stallId;

      buildPage();
      renderHeader();
      syncButtons();

      restoreSavedTicket(function () {
        renderCalledPanel();
        renderLastAction();
        renderAll();
        startProbe();
        window.IsQolar.poll('/api/stalls/' + encodeURIComponent(stallId) + '/queue', onQueueData);
        if (hasUnsynced(loadSyncList())) replay();
      });

    }, function () {
      showErrorPage('Unexpected response from server. Check the hub.');
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
