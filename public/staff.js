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

  // DOM refs set up after render
  var elHeader = null;
  var elWaiting = null;
  var elCalled = null;
  var elLastAction = null;
  var elCallBtn = null;
  var elDoneBtn = null;
  var elMsg = null;

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

    // message line (errors, feedback)
    elMsg = document.createElement('p');
    elMsg.className = 'msg';
    app.appendChild(elMsg);

    // last action line
    elLastAction = document.createElement('p');
    elLastAction.className = 'last-action';
    app.appendChild(elLastAction);

    // buttons
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
    h1.textContent = stallName ? stallId + ' — ' + stallName : stallId;
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
  // Button state
  // ---------------------------------------------------------------------------
  function syncButtons() {
    // Call next: enabled when no ticket is called and no request is in flight
    elCallBtn.disabled = inflight || calledTicket !== null;
    // Mark done: enabled only when a ticket is called and nothing is in flight
    elDoneBtn.disabled = inflight || calledTicket === null;
  }

  // ---------------------------------------------------------------------------
  // Queue poll callback
  // ---------------------------------------------------------------------------
  function onQueueData(data) {
    if (!Array.isArray(data)) {
      // error body from poll — keep last count, show error text
      if (data && data.error) {
        elMsg.textContent = 'Queue error: ' + data.error;
        msgFromPoll = true;
      }
      return;
    }
    // only clear the message line if the poll itself put it there
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
    elLastAction.textContent = '';
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
          renderCalledPanel();
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

    fetch('/api/tickets/' + encodeURIComponent(ticketId) + '/done', { method: 'POST' })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (r) {
        if (r.ok) {
          elLastAction.textContent = ticketCode + ' done';
          calledTicket = null;
          lsRemove(lsKey);
          renderCalledPanel();
        } else if (r.status === 400 && r.body.error === 'already at final station') {
          // treat as done
          elLastAction.textContent = ticketCode + ' done';
          calledTicket = null;
          lsRemove(lsKey);
          renderCalledPanel();
        } else if (r.status === 404) {
          msgFromPoll = false;
          elMsg.textContent = 'Ticket no longer exists on the hub.';
          calledTicket = null;
          lsRemove(lsKey);
          renderCalledPanel();
        } else {
          msgFromPoll = false;
          elMsg.textContent = 'Error: ' + (r.body.error || r.status);
        }
      })
      .catch(function () {
        // network failure — keep the ticket, show error
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
          // 404 or any other state — clear
          lsRemove(lsKey);
          calledTicket = null;
        }
        onDone();
      })
      .catch(function () {
        // hub unreachable — keep showing saved ticket
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
        // hub unreachable — show retrying message and retry in 2 s
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
        syncButtons();
        // Start queue poll
        window.IsQolar.poll('/api/stalls/' + encodeURIComponent(stallId) + '/queue', onQueueData);
      });

    }, function () {
      // onUnknown (answered but not an array) — should not happen normally
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
