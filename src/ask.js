/**
 * @filename ask.js
 * @author Jan Biniok <jan@biniok.net>
 * @licence GPL v3
 */

const V = false;
const D = false;
const UV = false;

// help scrambling...
(function () {
  let initialized = false;
  const allItems = null;
  const version = "0.0.0";
  const gNoWarn = false;

  let gArgs = null;
  let gTabName = "???";

  if (!window.requestFileSystem) {
    window.requestFileSystem = window.webkitRequestFileSystem;
  }
  if (!window.BlobBuilder) window.BlobBuilder = window.WebKitBlobBuilder;

  /* ########### include ############## */
  Registry.require("convert");
  Registry.require("xmlhttprequest");
  Registry.require("compat");
  Registry.require("parser");
  Registry.require("crcrc");
  Registry.require("helper");
  Registry.require("i18n");
  Registry.require("curtain");
  Registry.require("tabview");

  const cr = Registry.get("crcrc").cr;
  const crc = Registry.get("crcrc").crc;
  const Converter = Registry.get("convert");
  const I18N = Registry.get("i18n");
  const Please = Registry.get("curtain");
  const Helper = Registry.get("helper");
  const TabView = Registry.get("tabview");
  const xmlhttpRequest = Registry.get("xmlhttprequest").run;

  /* ########### main ############## */

  const createPage = function () {
    let ret;
    const o = document.getElementById("ask");
    const main = crc("div", "main_container p100100", "ask", "main");

    if (o) {
      const p = o.parentNode;
      p.removeChild(o);
      p.appendChild(main);
      document.body.setAttribute("class", "main");
    }

    if (V) console.log("ask: head");

    const head = crc("div", "head_container", "ask", "head_container");
    const tv = crc("div", "tv_container", "ask", "tv_container");

    const heada = cr("a", "head_link", "ask", "head_link");
    heada.href = "http://tampermonkey.net";
    heada.target = "_blank";

    const head1 = crc("div", "float margin4", "ask", "head1");
    const image = crc("img", "banner", "ask");
    image.src = chrome.extension.getURL("images/icon128.png");

    const head2 = crc("div", "float head margin4", "ask", "head2");
    const heading = cr("div", "fire");

    const ver = crc("div", "version", "version", "version");
    ver.textContent = " by Jan Biniok";

    const search = cr("div", "search", "box", "");

    heading.textContent = "T" + "amper" + "m" + "onkey";

    head1.appendChild(image);
    head2.appendChild(heading);
    head2.appendChild(ver);

    heada.appendChild(head1);
    heada.appendChild(head2);

    head.appendChild(heada);
    head.appendChild(search);

    main.appendChild(head);
    main.appendChild(tv);

    const tabv = TabView.create("_main", tv);
    ret = createMainTab(tabv);

    initialized = true;
    Please.hide();

    return ret;
  };

  var createMainTab = function (tabv) {
    const i = { name: "main", id: "main" };
    const h = cr("div", i.name, i.id, "tab_content_h");
    h.textContent = gTabName;
    const util = cr("div", i.name, i.id, "tab_content");
    const tab = tabv.appendTab(Helper.createUniqueId(i.name, i.id), h, util);
    return util;
  };

  /** **** main ********/
  const main = function () {
    gArgs = Helper.getUrlArgs();

    const installNatively = function (url) {
      window.location = url + "#" + "bypass=true";
    };

    if (gArgs.i18n) {
      I18N.setLocale(gArgs.i18n);
    }

    if (gArgs.script) {
      gArgs.script = Converter.Base64.decode(gArgs.script);

      gTabName = I18N.getMessage("Install");
      const url = gArgs.script;
      let content;

      Please.wait(I18N.getMessage("Please_wait___"));

      const createSource = function (req) {
        const heading = crc("div", "heading", "indzsll", "heading");
        const heading_name = crc(
          "div",
          "nameNname64",
          "install",
          "heading_name",
        );
        heading_name.textContent = gArgs.script;
        heading.appendChild(heading_name);
        content.appendChild(heading);

        const outer = crc("div", "editor_outer", "", "");
        const editor = crc("div", "editor", "", "");

        const textarea = crc("textarea", "editorta", "", "");
        textarea.setAttribute("wrap", "off");
        textarea.value = req.responseText;

        content.appendChild(outer);
        outer.appendChild(editor);
        editor.appendChild(textarea);

        if (!gArgs.nocm) {
          const edit = textarea.parentNode;
          edit.removeChild(textarea);
          content.editor = new MirrorFrame(edit, {
            value: req.responseText,
            noButtons: true,
            matchBrackets: true,
          });
        }
      };

      const showNask = function (req) {
        if (req.readyState == 4) {
          Please.hide();

          if (req.status == 200 || req.status == 0) {
            const script = Registry.get("parser").createScriptFromSrc(
              req.responseText,
            );
            if (
              !script.name ||
              script.name == "" ||
              script.version == undefined
            ) {
              window.close();
              return;
            }

            content = createPage();
            createSource(req);

            const ask = function () {
              if (
                confirm(
                  I18N.getMessage(
                    "Do_you_want_to_install_this_userscript_in_Tampermonkey_or_Chrome",
                  ),
                )
              ) {
                Please.wait(I18N.getMessage("Please_wait___"));
                chrome.extension.sendMessage(
                  { method: "scriptClick", url, id: 0 },
                  function (response) {
                    Please.hide();
                  },
                );
              } else {
                installNatively(url);
              }
            };

            window.setTimeout(ask, 500);
          } else {
            Helper.alert(
              I18N.getMessage("Unable_to_load_script_from_url_0url0", url),
            );
            installNatively();
          }
        }
      };

      const details = {
        method: "GET",
        url,
        retries: 3,
        overrideMimeType: "text/plain; charset=x-user-defined",
      };

      xmlhttpRequest(details, showNask);
    } else {
      createPage();
    }
  };

  /** **** init ********/
  chrome.extension.onMessage.addListener(
    function (request, sender, sendResponse) {
      if (V) console.log("a: method " + request.method);
      if (request.method == "confirm") {
        const resp = function (c) {
          sendResponse({ confirm: c });
        };
        Helper.confirm(request.msg, resp);
      } else if (request.method == "showMsg") {
        Helper.alert(request.msg);
        sendResponse({});
      } else {
        if (V) {
          console.log(
            "a: " + I18N.getMessage("Unknown_method_0name0", request.method),
          );
        }
        return false;
      }

      return true;
    },
  );

  if (V) console.log("Register request listener (ask)");

  const listener = function () {
    window.removeEventListener("DOMContentLoaded", listener, false);
    window.removeEventListener("load", listener, false);

    main();
  };

  window.addEventListener("DOMContentLoaded", listener, false);
  window.addEventListener("load", listener, false);
})();
