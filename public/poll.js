/**
 * poll.js — shared poller for IsQolar browser pages.
 * No build step, no dependencies.
 * Exported via window.IsQolar = { poll }.
 */

(function () {
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
          document.body.dataset.online = "true";
          onData(json);
        })
        .catch(function () {
          if (!running) return;
          // Keep the last good data in place; just mark offline.
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
  window.IsQolar = IsQolar;
})();
