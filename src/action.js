/**
 * @filename action.js
 * @author Jan Biniok <jan@biniok.net>
 * @licence GPL v3
 */

const V = false;

(function () {
  Registry.require("pingpong");
  Registry.require("crcrc");
  Registry.require("htmlutil");
  Registry.require("i18n");

  const cr = Registry.get("crcrc").cr;
  const crc = Registry.get("crcrc").crc;
  const HtmlUtil = Registry.get("htmlutil");
  const pp = Registry.get("pingpong");
  const I18N = Registry.get("i18n");

  const createActionsMenu = function (items) {
    let action = document.getElementById("action");
    const p = action.parentNode;
    p.removeChild(action);
    action = cr("span");
    action.setAttribute("id", "action");
    p.appendChild(action);

    const table = crc("table", "actiontable", "actiontable");

    for (const k in items) {
      var i = items[k];
      const tr = crc("tr", "actiontr");
      var span;
      var image;

      if (i.divider) {
        const t = crc("tr", "filler");
        const d = crc("td", "filler ");
        d.setAttribute("colspan", "3");
        const s = crc("div", "actiondivider", "divider", k.toString());
        d.appendChild(s);
        t.appendChild(d);
        table.appendChild(t);
      } else {
        var td1 = crc("td", "imagetd actionimagetd");
        var td2 = crc("td", "actiontd");
        const ai2 = crc("div", "actionitem", i.name, i.id, "ai", true);
        td2.appendChild(ai2);

        if (i.image) {
          image = HtmlUtil.createImage(i.image, i.name, i.id, null, "");
          td1.appendChild(image);
        }

        if (i.checkbox) {
          const input = document.createElement("input");
          input.type = "checkbox";
          input.name = i.name;
          input.id = "enabled";
          input.checked = i.enabled;
          var oc = function () {
            modifyScriptOptions(this.name, this.id, this.checked);
          };
          input.addEventListener("click", oc);
          span = document.createElement("span");
          span.textContent = i.name;
          ai2.appendChild(input);
          ai2.appendChild(span);
        } else if (i.url || i.urls) {
          const rs = i.urls || [i];
          td2.setAttribute("colspan", "2");
          for (let f = 0; f < rs.length; f++) {
            const j = rs[f];
            span = document.createElement("a");
            span.href = "javascript://nop/";
            span.url = j.url;
            span.newtab = j.newtab;
            const loc = function () {
              loadUrl(this.url, this.newtab);
            };
            span.addEventListener("click", loc);
            span.setAttribute(
              "class",
              td2.setAttribute("class") + " clickable",
            );
            span.textContent = j.name;
            ai2.appendChild(span);
            if (f < rs.length - 1) {
              const sep = document.createElement("span");
              sep.textContent = " | ";
              ai2.appendChild(sep);
            }
          }
        } else if (i.menucmd) {
          var a = document.createElement("a");
          a.href = "javascript://nop/";
          td2.id = i.id;
          var oc = function () {
            execMenuCmd(this.id);
          };
          td2.addEventListener("click", oc);
          td2.setAttribute("class", td2.setAttribute("class") + " clickable");
          a.textContent = i.name;
          td2.setAttribute("colspan", "2");
          ai2.appendChild(a);
        } else if (i.runUpdate) {
          var a = document.createElement("a");
          a.href = "javascript://nop/";
          td2.id = i.id;
          const uoc = function () {
            runScriptUpdates(this.id);
          };
          td2.addEventListener("click", uoc);
          td2.setAttribute("class", td2.setAttribute("class") + " clickable");
          a.textContent = i.name;
          td2.setAttribute("colspan", "2");
          ai2.appendChild(a);
        } else if (i.userscript || i.user_agent) {
          if (i.id) {
            const img = i.enabled
              ? chrome.extension.getURL("images/greenled.png")
              : chrome.extension.getURL("images/redled.png");

            const el = function (event) {
              if (
                (event && event.button & 2) ||
                event.button & 1 ||
                event.ctrlKey
              ) {
                // TODO: replace this by a call to bg, bg needs to observe option pages
                window.open(
                  chrome.extension.getURL("options.html") + "?open=" + this.key,
                );
                event.stopPropagation();
              } else {
                modifyScriptOptions(this.name, "enabled", !this.oldvalue);
              }
            };

            const pt =
              i.position > 0
                ? i.position < 10
                  ? " " + i.position
                  : i.position
                : null;
            const g = HtmlUtil.createImageText(
              img,
              i.name,
              "enabled",
              "enabled",
              i.enabled
                ? I18N.getMessage("Enabled")
                : I18N.getMessage("Disabled"),
              el,
              pt,
            );
            g.oldvalue = i.enabled;
            td1.appendChild(g);

            ai2.name = i.name;
            ai2.oldvalue = i.enabled;
            ai2.key = i.id;
            ai2.addEventListener("click", el);
          }
          span = document.createElement("span");
          span.textContent = i.name;
          td2.setAttribute("colspan", "2");
          ai2.appendChild(span);
        } else {
          span = document.createElement("span");
          span.textContent = i.name;
          td2.setAttribute("colspan", "2");
          ai2.appendChild(span);
        }
        if (i.tamperfire) {
          const process = function () {
            const elem = span;
            const img = image;
            const nImg = i.doneImage;
            const done = function (cnt, update) {
              if (elem) {
                if (update) {
                  elem.textContent = update;
                } else {
                  elem.textContent = elem.textContent.replace("?", Number(cnt));
                }
              }
              if (img) img.setAttribute("src", nImg);
            };
            if (i.tabid) {
              getFireItems(i.tabid, done);
            } else {
              td1 = null;
              td2 = null;
            }
          };
          process();
        }
        if (td1) tr.appendChild(td1);
        if (td2) tr.appendChild(td2);
      }
      table.appendChild(tr);
    }

    action.appendChild(table);
  };

  var loadUrl = function (url, newtab) {
    try {
      const resp = function (tab) {
        chrome.tabs.sendMessage(
          tab.id,
          { method: "loadUrl", url, newtab },
          function (response) {},
        );
      };
      if (newtab) {
        chrome.extension.sendMessage(
          { method: "openInTab", url },
          function (response) {},
        );
      } else {
        chrome.tabs.getSelected(null, resp);
      }
    } catch (e) {
      console.log(e);
    }
  };

  var runScriptUpdates = function () {
    try {
      chrome.extension.sendMessage(
        { method: "runScriptUpdates" },
        function (response) {},
      );
    } catch (e) {
      console.log(e);
    }
  };

  var execMenuCmd = function (id) {
    try {
      chrome.extension.sendMessage(
        { method: "execMenuCmd", id },
        function (response) {},
      );
    } catch (e) {
      console.log(e);
    }
  };

  var getFireItems = function (tabid, cb) {
    try {
      const fiResp = function (response) {
        let c = null;
        if (response.progress) {
          let a = response.progress.action + "... ";
          if (!a || a == "") a = "";
          let p = "";
          if (response.progress.state && response.progress.state.of) {
            p =
              " " +
              Math.round(
                (response.progress.state.n * 100) / response.progress.state.of,
              ) +
              "%";
          }
          c = a != "" || p != "" ? a + p : null;
        }
        cb(response.cnt, c);
      };

      chrome.extension.sendMessage(
        { method: "getFireItems", countonly: true, tabid },
        fiResp,
      );
    } catch (e) {
      console.log(e);
    }
  };

  var modifyScriptOptions = function (name, id, value) {
    try {
      const s = { method: "modifyScriptOptions", name };
      if (id && id != "") s[id] = value;
      chrome.extension.sendMessage(s, function (response) {
        if (response) {
          if (response.i18n) {
            I18N.setLocale(response.i18n);
          }
          if (response.items) {
            createActionsMenu(response.items);
          }
        }
      });
      document.getElementById("action").innerHTML =
        I18N.getMessage("Please_ wait___");
    } catch (e) {
      console.log("mSo: " + e.message);
    }
  };

  chrome.extension.onMessage.addListener(
    function (request, sender, sendResponse) {
      if (V) console.log("a: method " + request.method);
      // TODO: action page pops up, no need to update?
      if (false && request.method == "updateActions") {
        createActionsMenu(request.items);
        sendResponse({});
      } else {
        if (V) {
          console.log(
            "a: " + I18N.getMessage("Unknown_method_0name0", request.method),
          );
        }
      }
    },
  );

  const domListener = function () {
    window.removeEventListener("DOMContentLoaded", domListener, false);
    window.removeEventListener("load", domListener, false);

    let _loading = null;
    let _img = null;

    const clear = function () {
      if (_loading) window.clearTimeout(_loading);
      _loading = null;
      if (_img) _img.parentNode.remove(_img);
      _img = null;
    };

    const addWait = function () {
      _img = document.createElement("img");
      _img.setAttribute("src", "images/large-loading.gif");
      document.getElementById("action").appendChild(_img);
    };

    const suc = function () {
      clear();
      modifyScriptOptions(null, false);
    };

    const fail = function () {
      clear();
      if (
        confirm(
          I18N.getMessage(
            "An_internal_error_occured_Do_you_want_to_visit_the_forum_",
          ),
        )
      ) {
        window.open("http://tampermonkey.net/bug");
      }
    };

    _loading = window.setTimeout(addWait, 500);
    pp.ping(suc, fail);
  };

  window.addEventListener("DOMContentLoaded", domListener, false);
  window.addEventListener("load", domListener, false);
})();
