/**
 * @filename htmlutil.js
 * @author Jan Biniok <jan@biniok.net>
 * @licence GPL v3
 */

(function () {
  Registry.require("crcrc");
  Registry.require("helper");

  const cr = Registry.get("crcrc").cr;
  const crc = Registry.get("crcrc").crc;
  const Helper = Registry.get("helper");

  const createImageText = function (src, name, id, append, title, oc, text) {
    const wrap = cr("div", name, id, append, "wrap", true);
    const image = cr("image", name, id, append, true);
    let spos;

    image.setAttribute("width", "16px");
    image.setAttribute("height", "16px");
    image.setAttribute("src", src);
    wrap.setAttribute("style", "cursor: pointer;");
    if (title) wrap.title = title;
    wrap.key = id;
    wrap.name = name;
    wrap.alt = " ?";

    wrap.appendChild(image);
    spos = crc("span", "scriptpos", name, id, "spos");
    spos.textContent = text;
    wrap.appendChild(spos);

    if (oc && !wrap.inserted) {
      const oco = function (evt) {
        oc.apply(wrap, [evt]);
      };
      wrap.addEventListener("click", oco);
    }
    image.href = "javascript://nop/";

    return wrap;
  };

  const createFavicon = function (srcs, name, id, title) {
    const image = cr("image", name, id, title.match(/[a-zA-Z0-9]/g).join(""));
    if (image.inserted) return image;

    image.setAttribute("width", "16px");
    image.setAttribute("height", "16px");

    const t = Helper.toType(srcs);
    if (t !== "Array") {
      srcs = [srcs];
    }

    const load = function () {
      if (srcs.length == 0) return;
      const src = srcs.splice(0, 1);

      image.setAttribute("src", src);
    };

    image.addEventListener("error", load);
    load();

    if (title) image.title = title;
    image.alt = " ?";

    return image;
  };

  const createImage = function (src, name, id, append, title, oc) {
    const image = cr("image", name, id, append, true);

    image.setAttribute("width", "16px");
    image.setAttribute("height", "16px");
    image.setAttribute("src", src);
    if (oc) image.setAttribute("style", "cursor: pointer;");
    if (title) image.title = title;
    image.key = id;
    image.name = name;
    image.alt = " ?";

    if (oc && !image.inserted) {
      image.addEventListener("click", oc);
      image.href = "javascript://nop/";
    }

    return image;
  };

  const createFileInput = function (name, id, oc) {
    const input = crc("input", "import", "file", null, null, true);
    if (!input.inserted) {
      input.type = "file";
      if (oc) input.addEventListener("change", oc);
    }
    return input;
  };

  const createTextarea = function (title, i, oc) {
    const s = cr("div", i.name, i.id, "textarea");
    s.key = i.id;
    const input = crc("textarea", "settingsta", i.name, i.id, "textarea", true);
    input.name = i.name;
    input.key = i.id;
    input.array = i.array;
    input.oldvalue = i.value;
    input.value =
      i.value != undefined ? (i.array ? i.value.join("\n") : i.value) : "";
    if (oc && !input.inserted) input.addEventListener("change", oc);
    const span1 = cr("span", i.name, i.id, "s1");
    if (title) span1.textContent = title + ":";
    s.appendChild(span1);
    s.appendChild(input);

    return { elem: s, textarea: input };
  };

  const createPassword = function (name, i, oc) {
    const o = createInput(name, i, oc);
    o.input.setAttribute("type", "password");

    return o;
  };

  var createInput = function (name, i, oc) {
    const s = cr("div", i.name, i.id, "input");
    s.key = i.id;
    const input = cr("input", i.name, i.id, "input", true);
    const n = name.split("##");
    input.name = i.name;
    input.key = i.id;
    input.oldvalue = i.value;
    input.value = i.value != undefined ? i.value : "";
    input.type = "text";
    if (oc && !input.inserted) input.addEventListener("change", oc);
    const span1 = crc("span", "optiondesc", i.name, i.id, "s1");
    const span2 = cr("span", i.name, i.id, "s2");
    span1.textContent = n[0] + ":";
    if (n.length > 1) span2.textContent = n[1];
    s.appendChild(span1);
    s.appendChild(input);
    s.appendChild(span2);
    if (i.enabledBy) s.setAttribute("name", "enabled_by_" + i.enabledBy);

    return { elem: s, input };
  };

  const createCheckbox = function (name, i, oc) {
    const s = crc("div", "checkbox", i.name, i.id, "cb1");
    s.key = i.id;
    const input = cr("input", i.name, i.id, "cb", true);
    input.title = i.desc ? i.desc : "";
    input.name = i.name;
    input.key = i.id;
    input.reload = i.reload;
    input.warning = i.warning;
    input.oldvalue = i.enabled;
    input.checked = i.enabled;
    input.type = "checkbox";

    if (oc && !input.inserted) input.addEventListener("click", oc);
    const span = crc("span", "checkbox_desc", i.name, i.id, "cb2");
    span.textContent = name;
    s.title = i.desc ? i.desc : "";
    s.appendChild(input);
    s.appendChild(span);

    return { elem: s, input };
  };

  const createDropDown = function (name, e, values, oc) {
    const s = cr("div", e.name, e.id, "outer_dd");
    s.key = e.id;
    const b = cr("select", e.name, e.id, "dd", true);

    for (const k in values) {
      const o1 = cr("option", values[k].name, values[k].name, "dd" + name);
      o1.textContent = Helper.decodeHtml(values[k].name);
      o1.value = values[k].value;
      if (values[k].enabledBy) {
        o1.setAttribute("name", "enabled_by_" + values[k].enabledBy);
      }
      if (e.enabler && values[k].enable) {
        o1.setAttribute("enables", JSON.stringify(values[k].enable));
      }
      if (values[k].value == e.value) o1.selected = true;
      b.appendChild(o1);
    }

    b.key = e.id;
    b.name = e.name;
    b.reload = e.reload;
    b.warning = e.warning;
    b.oldvalue = e.value;

    if (oc && !b.inserted) b.addEventListener("change", oc);

    const span = crc("span", "optiondesc", e.name, e.id, "inner_dd");
    span.textContent = name + ": ";
    s.appendChild(span);
    s.appendChild(b);
    s.title = e.desc ? e.desc : "";
    if (e.enabledBy) s.setAttribute("name", "enabled_by_" + e.enabledBy);

    return { elem: s, select: b };
  };

  const createScriptStartDropDown = function (name, e, oc) {
    const s = cr("div", e.name, e.id, "outer_dd");
    const b = cr("select", e.name, e.id, "dd", true);

    const o1 = cr("option", e.name, e.id, "dd1");
    const i1 = "document-start";
    o1.textContent = i1;
    if (i1 == e.value) o1.selected = true;

    const o2 = cr("option", e.name, e.id, "dd2");
    const i2 = "document-body";
    o2.textContent = i2;
    if (i2 == e.value) o2.selected = true;

    const o3 = cr("option", e.name, e.id, "dd3");
    const i3 = "document-end";
    o3.textContent = i3;
    if (i3 == e.value || (!o1.selected && !o2.selected)) o3.selected = true;

    b.appendChild(o1);
    b.appendChild(o2);
    b.appendChild(o3);

    b.key = e.id;
    b.name = e.name;
    if (oc && !b.inserted) b.addEventListener("change", oc);

    const span = cr("span", e.name, e.id, "inner_dd");
    span.textContent = name;
    s.appendChild(span);
    s.appendChild(b);
    return s;
  };

  const createImageButton = function (name, id, text, img, oc) {
    let b = null;
    let c = null;
    let i = null;

    b = crc("input", "imgbutton button", name, id, "bu", true);
    c = crc("div", "imgbutton_container", name, id, "bu_container");
    c.appendChild(b);

    b.name = name;
    b.key = id;
    b.type = "button";

    i = crc("img", "imgbutton_image", name, id, "bu_img", true);
    i.src = img;
    c.appendChild(i);
    b.setAttribute("title", text);
    i.setAttribute("title", text);

    if (!b.inserted && oc) {
      b.addEventListener("click", oc);
      i.addEventListener("click", oc);
    }

    return c;
  };

  const createItemButton = function (name, i, oc) {
    let b = null;

    b = crc("input", "button", name, i.id, "bu", true);
    b.name = i.name;
    b.key = i.id;
    b.type = "button";
    b.value = i.name;
    b.reload = i.reload;
    b.ignore = i.ignore || i.reload;
    b.warning = i.warning;
    if (i.enabledBy) b.setAttribute("name", "enabled_by_" + i.enabledBy);

    if (!b.inserted && oc) {
      b.addEventListener("click", oc);
    }

    return b;
  };

  const createSimpleButton = function (name, id, text, oc) {
    let b = null;
    const i = null;

    b = crc("input", "button", name, id, "bu", true);
    b.name = name;
    b.key = id;
    b.type = "button";
    b.value = text;

    if (!b.inserted && oc) {
      b.addEventListener("click", oc);
    }

    return b;
  };

  const createButton = function (name, id, text, oc) {
    if (Helper.toType(id) === "Object") {
      return createItemButton.apply(this, arguments);
    } else {
      return createSimpleButton.apply(this, arguments);
    }
  };

  const createPosition = function (name, e, oc) {
    const s = cr("div", e.name, e.id, "pos1");
    const b = cr("select", e.name, e.id, "pos", true);
    for (let i = 1; i <= e.posof; i++) {
      const o = cr("option", e.name, e.id, "opt" + i);
      o.textContent = i;
      if (i == e.pos) o.selected = true;
      b.appendChild(o);
    }
    b.key = e.id;
    b.name = e.name;
    if (oc && !b.inserted) b.addEventListener("change", oc);

    const span = cr("span", e.name, e.id, "pos2");
    span.textContent = name;
    s.appendChild(span);
    s.appendChild(b);
    return s;
  };

  const createSearchBox = function (tabURL) {
    const search = crc("div", "searchbox", "search_inner");
    const search_mv = crc("div", "searchbox_mv tv_tab", "search_inner_mv");
    const search_input = crc("input", "searchbox_input", "search_input");
    const search_button = crc("input", "searchbox_button", "search_button");

    search_input.type = "text";
    search_input.value = tabURL;
    search_button.type = "button";
    search_button.value = "Go";

    const onC = function () {
      const v = search_input.value;
      // if (v.split('/').length < 4) v += '/';
      window.location =
        window.location.origin +
        window.location.pathname +
        "?url=" +
        encodeURI(v);
    };

    const onK = function (e) {
      if (e && e.keyCode == 13) {
        onC();
      }
    };

    search_button.addEventListener("click", onC);
    search_input.addEventListener("keyup", onK);

    search_mv.appendChild(search_input);
    search_mv.appendChild(search_button);

    search.appendChild(search_mv);
    return search;
  };

  Registry.register("htmlutil", {
    createImageText,
    createImage,
    createFavicon,
    createFileInput,
    createTextarea,
    createInput,
    createPassword,
    createCheckbox,
    createDropDown,
    createScriptStartDropDown,
    createImageButton,
    createButton,
    createPosition,
    createSearchBox,
  });
})();
