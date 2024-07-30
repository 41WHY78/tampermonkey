/**
 * @filename pingpong.js
 * @author Jan Biniok <jan@biniok.net>
 * @licence GPL v3
 */

(function () {
  const V = false;
  const D = true;
  const timeout = 1000;
  let _to = null;
  let _retries = 5;

  const ping = function (suc, fail) {
    const clear = function () {
      if (_to != null) {
        window.clearTimeout(_to);
      }
      _to = null;
    };

    const timedout = function () {
      clear();
      if (_retries-- > 0) {
        if (V) console.log("pp: ping timed out! retries: " + _retries);
        ping(suc, fail);
        return;
      }
      if (fail) fail();
    };

    const response = function (r) {
      if (!r) {
        if (D || V) console.log("pp: Warn: got pseudo response!");
        return;
      }

      if (V) console.log("pp: ping succed! @" + r.instanceID);
      clear();
      suc();
    };

    const req = { method: "ping" };
    try {
      chrome.extension.sendMessage(req, response);
    } catch (e) {}

    _to = window.setTimeout(timedout, timeout);
  };

  Registry.register("pingpong", { ping });
})();
