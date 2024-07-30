/**
 * @filename i18n.js
 * @author Jan Biniok <jan@biniok.net>
 * @licence GPL v3
 */

(function () {
  Registry.require("helper");
  Registry.require("xmlhttprequest");

  let locale_data = {};
  let locale = null;
  const Helper = Registry.get("helper");

  const fallback = function (s) {
    let v = s;
    let a = Array.prototype.slice.call(arguments, 1);
    if (a.length == 1 && Helper.toType(a[0] === "Array")) {
      a = a[0];
    }

    const r = new RegExp("_0[a-zA-Z].*0");

    for (let i = 0; i < a.length; a++) {
      if (v.search(r) == -1) {
        console.log("getMessage(): wrong argument count!!!");
        break;
      }
      v = v.replace(r, " " + a[i]);
    }

    return v.replace(/_/g, " ");
  };

  const prepare = function (o, args) {
    let m = o.message;

    if (args.length == 1 && Helper.toType(args[0] === "Array")) {
      args = args[0];
    }

    for (const k in o.placeholders) {
      try {
        const c = Number(o.placeholders[k].content.replace(/^\$/, "")) - 1;
        var d;
        if (c < args.length) {
          d = args[c];
          m = m.replace("$" + k + "$", d);
        } else {
          console.log(
            "i18n: invalid argument count on processing '" +
              m +
              "' with args " +
              JSON.stringify(args),
          );
        }
      } catch (e) {
        console.log(
          "i18n: error processing '" +
            m +
            "' with args " +
            JSON.stringify(args),
        );
      }
    }

    return m;
  };

  const getMessageOrig = function (s) {
    // default locale...
    const o = chrome.i18n.getMessage.apply(this, arguments);
    if (o) {
      // everything is ok, return original translation
      return o;
    } else {
      // fallback, replace _ and insert arguments
      return fallback.apply(this, arguments);
    }
  };

  const getMessageEx = function (s) {
    return getMessageInternal.apply(this, arguments);
  };

  var getMessageInternal = function (s) {
    if (!locale) {
      return getMessageOrig.apply(this, arguments);
    } else {
      // a locale is set
      const o = locale_data[s];
      if (o) {
        return prepare(o, Array.prototype.slice.call(arguments, 1));
      } else {
        return fallback.apply(this, arguments);
      }
    }
  };

  const getLocale = function () {
    return locale;
  };

  const setLocale = function (_locale) {
    if (_locale === "null") _locale = null;
    if (locale == _locale) return true;

    if (_locale) {
      const u = "_locales/" + _locale + "/messages.json";
      const c = Registry.getRaw(u);

      if (c) {
        try {
          locale_data = JSON.parse(c);
          locale = _locale;

          return true;
        } catch (e) {
          console.log("i18n: parsing locale " + _locale + " failed!");
        }
      } else {
        console.log("i18n: retrieving locale " + _locale + " failed!");
      }

      return false;
    } else {
      locale_data = {};
      locale = null;

      return true;
    }
  };

  const askForLocale = function (cb) {
    const resp = function (response) {
      if (cb) cb(response.i18n);
    };

    chrome.extension.sendMessage({ method: "getLocale" }, resp);
  };

  Registry.register("i18n", {
    getMessage: getMessageEx,
    getOriginalMessage: getMessageOrig,
    askForLocale,
    getLocale,
    setLocale,
  });
})();
