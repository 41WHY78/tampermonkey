/**
 * @filename syncinfo.js
 * @author Jan Biniok <jan@biniok.net>
 * @licence GPL v3
 */

(function () {
  Registry.require("xmlhttprequest");
  const xmlhttpRequest = Registry.get("xmlhttprequest").run;
  const V = true;
  const scriptAppendix = "@us";

  let _registered = false;
  var _retries = 1;
  let _id = null;
  let _type = 0;
  let _url = null;
  const _etype = {
    ePASTEBIN: 1,
    eCHROMESYNC: 2,
  };
  const _urls = {};
  let _listeners = [];
  var _retries = 3;
  const _syncwait = 60 * 1000;
  let _lock = false;
  let _timeoffset = null;
  const _timeservers = [
    {
      method: "HEAD",
      url: "http://www.google.com",
      extract: function (text, headers) {
        try {
          const rh = headers ? headers.split("\n") : null;
          for (const k in rh) {
            const parts = rh[k].split(":");
            const h = parts.shift() || "";
            const field = parts.join(":") || "";

            if (h.trim().toLowerCase() == "date" && field) {
              const tt = new Date(field);
              if (tt) {
                return tt.getTime() - new Date().getTime();
              }
            }
          }
        } catch (e) {}
        return null;
      },
    },
    {
      method: "GET",
      url: "http://json-time.appspot.com/time.json",
      extract: function (text, headers) {
        try {
          const t = JSON.parse(text);
          if (!t.error && t.datetime) {
            const tt = new Date(t.datetime);
            if (tt) {
              return tt.getTime() - new Date().getTime();
            }
          }
        } catch (e) {}
        return null;
      },
    },
  ];

  _urls[_etype.ePASTEBIN] = "http://pastebin.com/raw.php?i=%s";
  _urls[_etype.eCHROMESYNC] = "";

  const init = function (type, id) {
    _listeners = [];

    let r = false;
    _id = id;
    _type = type;

    if (type == _etype.eCHROMESYNC) {
      registerOnChange();
      r = true;
    } else if (_urls[_type] && _id) {
      _url = _urls[_type].replace("%s", id);
      r = true;
    }

    return r;
  };

  const getTime = function () {
    return new Date().getTime() + _timeoffset;
  };

  const syncTime = function (callback) {
    let srv = 0;
    const next = function () {
      srv++;
      window.setTimeout(run, 1);
    };

    const error = function () {
      _timeoffset = 0;
      console.log("si: time offset  detection failed!");
      if (callback) callback(false);
    };

    const succ = function (t) {
      _timeoffset = t;
      console.log("si: detected a time offset of " + t + " ms");
      if (callback) callback(true);
    };

    var run = function () {
      if (srv < _timeservers.length) {
        const o = _timeservers[srv];

        const details = {
          method: o.method,
          url: o.url,
        };

        const got = function (req) {
          if (req.readyState == 4) {
            if (req.status == 200) {
              const t = o.extract(req.responseText, req.responseHeaders);
              if (t === null) {
                next();
              } else {
                succ(t);
              }
            } else {
              next();
            }
          }
        };

        if (V) console.log("si: determine time offset with server " + o.url);
        xmlhttpRequest(details, got);
      } else {
        error();
      }
    };

    run();
  };

  var registerOnChange = function () {
    if (_registered) return;
    _registered = true;
    chrome.storage.onChanged.addListener(handleChange);
  };

  var handleChange = function (changes, ns) {
    if (_type == _etype.eCHROMESYNC && ns == "sync") {
      if (_timeoffset === null) {
        const done = function () {
          handleChange(changes, ns);
        };
        syncTime(done);
        return;
      }

      const re = new RegExp(scriptAppendix + "$");
      for (const key in changes) {
        const storageChange = changes[key];
        if (V) {
          console.log(
            'si: storage key "%s" in namespace "%s" changed. Old value was "%s", new value is "%s".',
            key,
            ns,
            storageChange.oldValue,
            storageChange.newValue,
          );
        }

        if (key.search(re) == -1) {
          if (V) console.log("si:   ^^ ignore cause it is not a script!");
          continue;
        }

        for (let i = 0; i < _listeners.length; i++) {
          if (_syncObjects[key]) {
            if (V) {
              console.log(
                "si:   ^^ ignore cause object is going to be changed right now or was changed by me!",
              );
            }
          } else {
            _listeners[i](key, storageChange.oldValue, storageChange.newValue);
          }
        }
      }
    }
  };

  const parseUrlData = function (data, cb) {
    const ret = [];

    try {
      data = data.replace(/\t/g, "    ");
      data = data.replace(/\r/g, "\n");
      data = data.replace(/\n\n+/g, "\n");

      const lines = data.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const tags = l.split("|");
        if (tags.length > 3) {
          console.log("si: can't handle line: " + l);
          continue;
        }
        const url = tags[tags.length - 1];
        let options = null;
        let name = null;
        if (tags.length > 1) {
          for (let j = tags.length - 2; j >= 0; j--) {
            try {
              options = JSON.parse(tags[j]);
            } catch (e) {
              name = tags[j];
            }
          }
        }

        ret.push({ name, url, options: options || {} });
      }
    } catch (e) {
      console.log("si: unable to parse data: " + data);
    }
    if (cb) cb(ret);
  };

  const listFromUrl = function (callback) {
    if (!_url) {
      if (callback) callback([]);
      return;
    }

    const details = {
      method: "GET",
      retries: _retries,
      url: _url,
    };

    const got = function (req) {
      if (req.readyState == 4) {
        if (req.status == 200) {
          parseUrlData(req.responseText, callback);
        } else {
          if (callback) callback([]);
        }
      }
    };
    xmlhttpRequest(details, got);
  };

  const listFromChromeSync = function (callback) {
    const selfargs = arguments;
    const again = function () {
      selfargs.callee.apply(this, selfargs);
    };
    if (_lock) {
      window.setTimeout(again, 500);
      return;
    }

    const re = new RegExp(scriptAppendix + "$");
    const gotValues = function (items) {
      const ret = [];

      for (const k in items) {
        if (k.search(re) == -1) continue;
        const id = k.replace(re, "");

        let j = null;
        try {
          if (_syncObjects[k]) {
            j = JSON.parse(_syncObjects[k]);
          } else {
            j = JSON.parse(items[k]);
          }
        } catch (e) {}
        if (!j || !j.url) {
          if (V) console.log("si: unable to parse extended info of " + k);
          continue;
        }
        ret.push({
          id,
          name: id.replace(/20/g, " "),
          url: j.url,
          options: j.options ? j.options : {},
        });
      }

      _lock = false;

      if (callback) callback(ret);
    };

    _lock = true;
    chrome.storage.sync.get(null, gotValues);
    return null;
  };

  let _syncTimeout = null;
  var _syncObjects = {};
  const add = function (script, cb) {
    _syncObjects[script.id + scriptAppendix] = JSON.stringify({
      url: script.url,
    });
    if (_syncTimeout) {
      window.clearTimeout(_syncTimeout);
    }

    _syncTimeout = window.setTimeout(write, 3000);
    if (cb) cb();
  };

  const remove = function (script, cb) {
    _syncObjects[script.id + scriptAppendix] = JSON.stringify({
      url: script.url,
      options: { removed: getTime() },
    });
    if (_syncTimeout) {
      window.clearTimeout(_syncTimeout);
    }

    _syncTimeout = window.setTimeout(write, 3000);
    if (cb) cb();
  };

  const reset = function (cb) {
    const selfargs = arguments;
    const again = function () {
      selfargs.callee.apply(this, selfargs);
    };
    if (_lock) {
      window.setTimeout(again, 500);
      return;
    }
    _lock = true;

    const done = function () {
      _syncObjects = {};
      _lock = false;
      if (cb) cb();
    };

    chrome.storage.sync.clear(done);
  };

  var write = function (callback, retry) {
    const selfargs = arguments;
    const again = function () {
      selfargs.callee.apply(this, selfargs);
    };
    if (_lock) {
      window.setTimeout(again, 500);
      return;
    }

    if (retry === undefined) retry = _retries;
    const cb = function (f) {
      const e = chrome.runtime ? chrome.runtime.lastError : f;
      if (e) {
        console.log("si: error on write " + e.message);
        if (--retry > 0) window.setTimeout(again, _syncwait);
      } else {
        _syncObjects = {};
      }
      _lock = false;
    };
    _lock = true;

    try {
      chrome.storage.sync.set(_syncObjects, cb);
    } catch (e) {
      cb(e);
    }
  };

  const list = function (callback) {
    if (_timeoffset === null) {
      const done = function () {
        list(callback);
      };
      syncTime(done);
      return;
    }

    if (_type == _etype.eCHROMESYNC) {
      return listFromChromeSync(callback);
    } else {
      return listFromUrl(callback);
    }
  };

  const addChangeListener = function (cb) {
    _listeners.push(cb);
  };

  Registry.register("syncinfo", {
    init,
    list,
    add,
    reset,
    getTime,
    remove,
    addChangeListener,
    types: _etype,
  });
})();
