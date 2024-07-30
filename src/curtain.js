/**
 * @filename curtain.js
 * @author Jan Biniok <jan@biniok.net>
 * @licence GPL v3
 */

(function () {
  let curtain = null;

  Registry.require("crcrc");
  const CRC = Registry.get("crcrc");
  const cr = CRC.cr;
  const crc = CRC.crc;
  let type = 0;

  const createCenterTable = function (elem, name, id, app, clas) {
    if (!app) app = "";

    const t = crc(
      "table",
      "curtable" + (clas ? " " + clas : ""),
      name,
      id,
      "table" + app,
    );

    // var tr1 = cr('tr', name, id, 'tr1' + app);
    const tr2 = crc("tr", clas ? " " + clas : "", name, id, "tr2" + app);
    // var tr3 = cr('tr', name, id, 'tr3' + app);
    const td1 = crc("td", "curtableoutertd", name, id, "td1" + app);
    const td2 = crc("td", "curtableinner", name, id, "td2" + app);
    const td3 = crc("td", "curtableoutertd", name, id, "td3" + app);

    tr2.appendChild(td1);
    tr2.appendChild(td2);
    tr2.appendChild(td3);
    // t.appendChild(tr1);
    t.appendChild(tr2);
    // t.appendChild(tr3);

    if (elem) td2.appendChild(elem);
    return t;
  };

  const createCurtain = function (childnode, name, id, app, clas) {
    const p = cr("div", name, id, "p" + app);
    const c = crc("div", "curbg", name, id, "c" + app);
    const d = crc("div", "curmiddle", name, id, "d" + app);
    if (!p.inserted) {
      p.setAttribute("class", "curouter hide");
      p.setAttribute("style", "z-index: " + (name ? "10000" : "20000"));
    }
    const t = createCenterTable(childnode, name, id, app, clas);

    d.appendChild(t);
    p.appendChild(d);
    p.appendChild(c);

    p.show = function () {
      p.setAttribute("class", "curouter block");
    };
    p.hide = function () {
      p.setAttribute("class", "curouter hide");
    };
    p.remove = function () {
      if (p.parentNode) {
        p.parentNode.removeChild(p);
      }
    };
    p.setText = function (elem) {
      p.text = elem;
    };
    p.print = function (msg) {
      if (p.text) p.text.textContent = msg;
    };

    const bs = document.getElementsByTagName("body");
    if (!bs.length) {
      console.log("Err: Body not found!");
    } else {
      bs[0].appendChild(p);
    }
    return p;
  };

  const hideWait = function () {
    if (curtain) {
      window.setTimeout(function () {
        curtain.hide();
      }, 1);
    }
  };

  const pleaseWait = function (msg) {
    if (curtain && type != 0) {
      curtain.remove();
      curtain = null;
    }

    if (msg == undefined) msg = chrome.i18n.getMessage("Please_wait___");
    if (curtain) {
      curtain.print(msg);
      curtain.show();
      return;
    }
    const createCurtainWaitMsg = function (text) {
      const outer = document.createElement("div");
      outer.setAttribute("class", "curcontainer");

      const head = document.createElement("div");
      head.setAttribute("class", "curwaithead");
      const msg = document.createElement("div");
      msg.setAttribute("class", "curwaitmsg");

      const dimg = document.createElement("div");
      const t = document.createElement("div");
      t.textContent = text;
      t.setAttribute("class", "curtext");

      const a = document.createElement("div");
      a.innerHTML = "<br>";

      const img = document.createElement("img");
      img.src = chrome.extension.getURL("images/large-loading.gif");
      dimg.appendChild(img);

      msg.appendChild(dimg);
      msg.appendChild(a);
      msg.appendChild(t);

      outer.appendChild(head);
      outer.appendChild(msg);

      return { all: outer, text: t };
    };

    type = 0;
    const m = createCurtainWaitMsg(msg);
    curtain = createCurtain(m.all);
    // setTextNode
    curtain.setText(m.text);
    curtain.show();
  };

  const pleaseLogin = function (callback, info) {
    if (curtain) {
      curtain.remove();
      curtain = null;
    }

    const createCurtainLoging = function (info) {
      const outer = document.createElement("div");
      outer.setAttribute("class", "curcontainer");

      const head = document.createElement("div");
      head.setAttribute("class", "curwaithead");
      const msg = document.createElement("div");
      msg.setAttribute("class", "curwaitmsg");
      const f = document.createElement("form");
      f.setAttribute("action", "#login");

      const t = document.createElement("table");
      const tr0 = document.createElement("tr");

      const tr1 = document.createElement("tr");
      const tr2 = document.createElement("tr");
      const tr3 = document.createElement("tr");

      const td0 = document.createElement("td");
      td0.setAttribute("colspan", "2");
      td0.setAttribute("class", "login_hint");

      const td11 = document.createElement("td");
      const td12 = document.createElement("td");
      const td21 = document.createElement("td");
      const td22 = document.createElement("td");
      const td3 = document.createElement("td");
      td3.setAttribute("colspan", "2");

      const msg_t = document.createElement("span");
      const login_t = document.createElement("span");
      const pass_t = document.createElement("span");
      const login = document.createElement("input");
      const pass = document.createElement("input");
      const button = document.createElement("input");

      if (info) t.appendChild(tr0);
      t.appendChild(tr1);
      t.appendChild(tr2);
      t.appendChild(tr3);

      tr0.appendChild(td0);
      tr1.appendChild(td11);
      tr1.appendChild(td12);

      tr2.appendChild(td21);
      tr2.appendChild(td22);

      tr3.appendChild(td3);

      td11.appendChild(login_t);
      td12.appendChild(login);

      td21.appendChild(pass_t);
      td22.appendChild(pass);

      td3.appendChild(button);

      f.appendChild(t);
      msg.appendChild(f);

      outer.appendChild(head);
      outer.appendChild(msg);

      if (info) td0.textContent = info;
      login_t.textContent = chrome.i18n.getMessage("Username");
      pass_t.textContent = chrome.i18n.getMessage("Password");
      button.value = chrome.i18n.getMessage("Login");

      login.setAttribute("type", "text");
      login.setAttribute("label", "username");
      pass.setAttribute("type", "password");
      pass.setAttribute("label", "password");
      button.setAttribute("type", "submit");

      button.addEventListener("click", function () {
        if (callback) callback(login.value, pass.value);
      });

      return { all: outer, text: t };
    };

    type = 1;
    const m = createCurtainLoging(info);
    curtain = createCurtain(m.all);
    curtain.show();
  };

  const wait = { wait: pleaseWait, hide: hideWait, login: pleaseLogin };

  Registry.register("curtain", wait);
})();
