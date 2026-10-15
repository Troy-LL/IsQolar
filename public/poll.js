/**
 * poll.js — shared poller for IsQolar browser pages.
 * No build step, no dependencies.
 * Exported via window.IsQolar = { poll, lastUpdated, online }.
 *
 * State (readable by all three pages):
 *   window.IsQolar.online      {boolean|null}  true = server reachable, false = offline, null = not yet known
 *   window.IsQolar.lastUpdated {Date|null}      time of the last successful response, null until first success
 */

(function () {
  // Shared state — pages read these directly.
  var state = {
    online: null,
    lastUpdated: null,
  };

  /**
   * Start polling a URL at a fixed interval.
   *
   * @param {string} url       - Endpoint to fetch (GET, JSON).
   * @param {function} onData  - Called with the parsed JSON on each successful response.
   * @param {number} [ms=2000] - Poll interval in milliseconds.
   * @returns {{ stop: function }} - Call stop() to cancel polling.
   */
  function poll(url, onData, ms) {
    if (ms === undefined) ms = 2000;

    var running = true;
    var inflight = false;

    function tick() {
      if (!running) return;
      if (inflight) return; // skip overlapping requests

      inflight = true;
      fetch(url)
        .then(function (res) {
          return res.json();
        })
        .then(function (json) {
          if (!running) return;
          state.online = true;
          state.lastUpdated = new Date();
          document.body.dataset.online = "true";
          onData(json);
        })
        .catch(function () {
          if (!running) return;
          state.online = false;
          // lastUpdated keeps the time of the last *successful* response.
          document.body.dataset.online = "false";
        })
        .finally(function () {
          inflight = false;
        });
    }

    tick(); // fire immediately
    var timer = setInterval(tick, ms);

    return {
      stop: function () {
        running = false;
        clearInterval(timer);
      },
    };
  }

  var IsQolar = window.IsQolar || {};
  IsQolar.poll = poll;
  // Expose shared state as direct properties so pages can read them at any time.
  Object.defineProperty(IsQolar, "online", {
    get: function () { return state.online; },
    enumerable: true,
  });
  Object.defineProperty(IsQolar, "lastUpdated", {
    get: function () { return state.lastUpdated; },
    enumerable: true,
  });
  window.IsQolar = IsQolar;
})();
