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
  // State
  // ---------------------------------------------------------------------------
  var stallId = null;        // stall id from ?stall=
  var stallName = '';        // display name
  var lsKey = null;          // isqolar.staff.called.STALL
  var calledTicket = null;   // {id, code, name, course} or null
  var inflight = false;      // true while any POST is in flight
  var waitingCount = 0;      // last known queue length
  var msgFromPoll = false;   // true when elMsg was last set by the queue poll

  // D3: last undoable action — not persisted, cleared on reload
  // {type: 'call'|'done', id, code, name, course} or null
  var lastAction = null;

  // DOM refs set up after render
  var elHeader = null;
  var elWaiting = null;
  var elCalled = null;
  var elMsg = null;
  var elLastAction = null;
  var elUndoBtn = null;      // Undo button inside the last-action line
  var elCallBtn = null;
  var elDoneBtn = null;

  // D3: lookup section refs
  var elLookupInput = null;
  var elLookupMsg = null;
  var elLookupResult = null;
  var elLookupUndoBtn = null;  // the current "Undo last move" button, or null

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

    // waiting count
    elWaiting = document.createElement('p');
    elWaiting.className = 'waiting';
    app.appendChild(elWaiting);

    // called ticket panel
    elCalled = document.createElement('div');
    elCalled.className = 'called-panel';
    app.appendChild(elCalled);

    // message line (errors, feedback from main actions)
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

    btnRow.appendChild(elCallBtn);
    btnRow.appendChild(elDoneBtn);
    app.appendChild(btnRow);

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
    h1.textContent = stallName ? stallId + ' \u2014 ' + stallName : stallId;
    elHeader.appendChild(h1);
  }

  // ---------------------------------------------------------------------------
  // Called-ticket panel
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
      : lastAction.code + ' done';
    elLastAction.textContent = label + '\u00a0';
    elUndoBtn.style.display = '';
  }

  // Called after 400 already at final station: keep the text, hide Undo.
  function renderLastActionNoUndo() {
    elUndoBtn.style.display = 'none';
  }

  // ---------------------------------------------------------------------------
  // Button state — covers Call next, Mark done, Undo, and lookup Undo
  // ---------------------------------------------------------------------------
  function syncButtons() {
    elCallBtn.disabled = inflight || calledTicket !== null;
    elDoneBtn.disabled = inflight || calledTicket === null;
    // Undo button visibility is governed by renderLastAction; just handle disabled.
    elUndoBtn.disabled = inflight;
    // Lookup Undo last move button — visual disable while any POST is in flight.
    if (elLookupUndoBtn) elLookupUndoBtn.disabled = inflight;
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
    if (msgFromPoll) {
      elMsg.textContent = '';
      msgFromPoll = false;
    }
    waitingCount = data.length;
    elWaiting.textContent = 'Waiting: ' + waitingCount;
  }

  // ---------------------------------------------------------------------------
  // Call next
  // ---------------------------------------------------------------------------
  function onCallNext() {
    if (inflight || calledTicket !== null) return;
    inflight = true;
    msgFromPoll = false;
    elMsg.textContent = '';
    syncButtons();

    fetch('/api/stalls/' + encodeURIComponent(stallId) + '/next', { method: 'POST' })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (r) {
        if (r.ok) {
          calledTicket = { id: r.body.id, code: r.body.code, name: r.body.name, course: r.body.course };
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
        msgFromPoll = false;
        elMsg.textContent = 'Cannot reach the hub. Try again.';
      })
      .finally(function () {
        inflight = false;
        syncButtons();
      });
  }

  // ---------------------------------------------------------------------------
  // Mark done
  // ---------------------------------------------------------------------------
  function onMarkDone() {
    if (inflight || calledTicket === null) return;
    inflight = true;
    msgFromPoll = false;
    elMsg.textContent = '';
    syncButtons();

    var ticketId = calledTicket.id;
    var ticketCode = calledTicket.code;
    var ticketName = calledTicket.name;
    var ticketCourse = calledTicket.course;

    fetch('/api/tickets/' + encodeURIComponent(ticketId) + '/done', { method: 'POST' })
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
          // Someone else made this move — treat as done but no Undo
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
        msgFromPoll = false;
        elMsg.textContent = 'Cannot reach the hub. Try again.';
        renderCalledPanel();
      })
      .finally(function () {
        inflight = false;
        syncButtons();
      });
  }

  // ---------------------------------------------------------------------------
  // Undo last action (Part A)
  // ---------------------------------------------------------------------------
  function onUndoLastAction() {
    if (inflight || !lastAction) return;

    var action = lastAction;

    // Guard: undo of a call requires calledTicket to still be that ticket.
    if (action.type === 'call' && (!calledTicket || calledTicket.id !== action.id)) return;
    // Guard: undo of a done requires no ticket to be currently called.
    if (action.type === 'done' && calledTicket !== null) return;

    inflight = true;
    msgFromPoll = false;
    elMsg.textContent = '';
    syncButtons();

    fetch('/api/tickets/' + encodeURIComponent(action.id) + '/undo', { method: 'POST' })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (r) {
        if (r.ok) {
          lastAction = null;
          if (action.type === 'call') {
            // Ticket is back in line (waiting at stall)
            calledTicket = null;
            lsRemove(lsKey);
            renderCalledPanel();
            renderLastAction();
            msgFromPoll = false;
            elMsg.textContent = action.code + ' is back in line.';
          } else {
            // action.type === 'done'
            renderLastAction();
            if (r.body.station === 'stall' && r.body.status === 'called') {
              calledTicket = { id: r.body.id, code: r.body.code, name: r.body.name, course: r.body.course };
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
      })
      .finally(function () {
        inflight = false;
        syncButtons();
      });
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
  // Lookup — Find button (Part B)
  // ---------------------------------------------------------------------------
  function onLookup() {
    var raw = elLookupInput.value;
    var code = normalizeCode(raw);

    elLookupMsg.textContent = '';
    elLookupResult.textContent = '';

    if (!code) {
      elLookupMsg.textContent = 'Type a ticket code.';
      return;
    }

    // Fetch a fresh copy of the queue — not the poll's stale data.
    fetch('/api/stalls/' + encodeURIComponent(stallId) + '/queue')
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
        for (var i = 0; i < queue.length; i++) {
          if (queue[i].code === code) {
            found = queue[i];
            break;
          }
        }
        if (found) {
          renderLookupResult(found, i + 1);
        } else if (calledTicket && calledTicket.code === code) {
          elLookupMsg.textContent = code + ' is your called ticket. Use Undo above.';
        } else {
          elLookupMsg.textContent = code + ' is not waiting at ' + stallId + '.';
        }
      })
      .catch(function () {
        elLookupMsg.textContent = 'Cannot reach the hub. Try again.';
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
  // Lookup — Undo last move (Part B item 10)
  // ---------------------------------------------------------------------------
  function onLookupUndo(ticketId, ticketCode, btn) {
    if (inflight) return;
    inflight = true;
    elLookupMsg.textContent = '';
    syncButtons();

    // First verify the ticket is still waiting at this stall before posting undo.
    fetch('/api/tickets/' + encodeURIComponent(ticketId))
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (r) {
        if (!r.ok) {
          // 404 or other error
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
        // Ticket confirmed still waiting here — post undo.
        fetch('/api/tickets/' + encodeURIComponent(ticketId) + '/undo', { method: 'POST' })
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
          })
          .finally(function () {
            inflight = false;
            syncButtons();
          });
      })
      .catch(function () {
        elLookupMsg.textContent = 'Cannot reach the hub. Try again.';
        inflight = false;
        syncButtons();
      });
  }

  // ---------------------------------------------------------------------------
  // Restore saved ticket on load
  // ---------------------------------------------------------------------------
  function restoreSavedTicket(onDone) {
    var saved = lsGet(lsKey);
    if (!saved || !saved.id) {
      onDone();
      return;
    }
    fetch('/api/tickets/' + encodeURIComponent(saved.id))
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
    fetch('/api/stalls')
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

      buildPage();
      renderHeader();
      syncButtons();

      restoreSavedTicket(function () {
        renderCalledPanel();
        renderLastAction();
        syncButtons();
        window.IsQolar.poll('/api/stalls/' + encodeURIComponent(stallId) + '/queue', onQueueData);
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
