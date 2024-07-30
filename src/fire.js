/**
 * @filename fire.js
 * @author Jan Biniok <jan@biniok.net>
 * @licence GPL v3
 */

// help scrambling...
(function () {
  const V = false;

  let initialized = false;
  let allItems = null;
  let scriptItems = null;
  let scriptTable = null;
  let scriptOrderDown = true;
  let scriptOrder = "rank";
  const gOptions = {};

  let tabID = 0;
  let tabURL = "http://...";
  let versionDB = new Date();

  if (!window.requestFileSystem) {
    window.requestFileSystem = window.webkitRequestFileSystem;
  }
  if (!window.BlobBuilder) window.BlobBuilder = window.WebKitBlobBuilder;

  /* ########### include ############## */
  Registry.require("pingpong");
  Registry.require("crcrc");
  Registry.require("curtain");
  Registry.require("helper");
  Registry.require("tabview");
  Registry.require("convert");
  Registry.require("htmlutil");
  Registry.require("i18n");

  const cr = Registry.get("crcrc").cr;
  const crc = Registry.get("crcrc").crc;
  const Please = Registry.get("curtain");
  const Helper = Registry.get("helper");
  const TabView = Registry.get("tabview");
  const Converter = Registry.get("convert");
  const HtmlUtil = Registry.get("htmlutil");
  const pp = Registry.get("pingpong");
  const I18N = Registry.get("i18n");

  /* ########### main ############## */
  const gArgs = Helper.getUrlArgs();

  const setVisible = function (elem, vis) {
    if (vis) {
      elem.setAttribute("style", Helper.staticVars.visible);
      elem.vis = true;
    } else {
      elem.setAttribute("style", Helper.staticVars.invisible);
      elem.vis = false;
    }
  };

  const determineTabID = function (d) {
    return gArgs.tab ? gArgs.tab : d;
  };

  const determineTabURL = function (d) {
    return gArgs.url ? gArgs.url : d;
  };

  const cacluateRank = function (i) {
    let rt = 0.0;
    let ri = 0.0;
    let rf = 0.0;
    let rr = 0.0;

    const n = new Date().getTime();

    const d = 24 * 60 * 60 * 1000;
    const w = 7 * d;
    const m = 30 * d;

    if (i["uso:timestamp"]) {
      const t = i["uso:timestamp"];
      if (n - w < t) {
        rt = 1;
      } else if (n - m < t) {
        rt = 0.96;
      } else if (n - 6 * m < t) {
        rt = 0.9;
      } else if (n - 24 * m < t) {
        rt = 0.7;
      } else {
        rt = 0;
      }
    }

    const s = i["uso:installs"];
    if (s > 500000) {
      ri = 1;
    } else if (s > 100000) {
      ri = 0.95;
    } else if (s > 50000) {
      ri = 0.9;
    } else if (s > 10000) {
      ri = 0.88;
    } else if (s > 1000) {
      ri = 0.8;
    } else {
      ri = 0.5 * (s / 1000);
    }

    const fa = i["uso:fans"];
    if (fa > 5 && s > 333) {
      const f = s / fa;
      if (f < 333) {
        rf = 1;
      } else if (f < 1000) {
        rf = 0.9;
      } else if (f < 3000) {
        rf = 0.85;
      } else if (f < 10000) {
        rf = 0.8;
      } else {
        rf = 0.5 * (10000 / f);
      }
    }

    const a = Number(i["uso:rating"]);
    rr = a > 4 ? 1 : a / 5;

    const r = 0.25 * rt + 0.35 * ri + 0.15 * rf + 0.25 * rr;

    return r;
  };

  const round = function (n, dec) {
    n = parseFloat(n);
    if (!isNaN(n)) {
      if (!dec) var dec = 0;
      const factor = Math.pow(10, dec);
      return (
        Math.floor(n * factor + ((n * factor * 10) % 10 >= 5 ? 1 : 0)) / factor
      );
    } else {
      return n;
    }
  };

  const createScriptTable = function (ts) {
    if (ts == undefined) ts = "";
    const i = { id: "new", name: ts };
    let r = [];

    const createSortable = function (i, ext, text, cmp, dflt) {
      const t = crc("div", "settingsth", i.name, i.id, ext);

      const markSort = function (a, a_up, a_down) {
        const mu = document.getElementsByName("settingsth_a_up" + i.name);
        const md = document.getElementsByName("settingsth_a_down" + i.name);
        let mh;
        let ms;
        for (var e = 0; e < mu.length; e++) {
          mu[e].style.display = "none";
        }
        for (var e = 0; e < md.length; e++) {
          md[e].style.display = "none";
        }
        if (scriptOrderDown) {
          a_up.style.display = "";
        } else {
          a_down.style.display = "";
        }
      };

      const a = crc("a", "settingsth_a", i.name, i.id, ext + "_a");
      a.setAttribute("name", "settingsth_a" + i.name);
      const a_up = crc("a", "settingsth_a_up", i.name, i.id, ext + "_a_up");
      a_up.setAttribute("name", "settingsth_a_up" + i.name);
      const a_down = crc(
        "a",
        "settingsth_a_down",
        i.name,
        i.id,
        ext + "_a_down",
      );
      a_down.setAttribute("name", "settingsth_a_down" + i.name);

      a_up.style.display = "none";
      a_down.style.display = "none";

      const mS = function () {
        markSort(a, a_up, a_down);
      };
      const cb = function () {
        mS();
        Please.hide();
      };
      const sort = function () {
        const run = function () {
          scriptOrder = cmp;
          sortScripts(scriptItems, scriptOrder, scriptOrderDown, cb);
        };
        Please.wait(I18N.getMessage("Please_wait___"));
        window.setTimeout(run, 1);
      };
      const sortUp = function () {
        const run = function () {
          scriptOrderDown = false;
          scriptOrder = cmp;
          sortScripts(scriptItems, scriptOrder, scriptOrderDown, cb);
        };
        Please.wait(I18N.getMessage("Please_wait___"));
        window.setTimeout(run, 1);
      };
      const sortDown = function () {
        const run = function () {
          scriptOrderDown = true;
          scriptOrder = cmp;
          sortScripts(scriptItems, scriptOrder, scriptOrderDown, cb);
        };
        Please.wait(I18N.getMessage("Please_wait___"));
        window.setTimeout(run, 1);
      };

      if (!t.inserted) {
        t.appendChild(a);
        t.appendChild(a_down);
        t.appendChild(a_up);

        a.addEventListener("click", sort);
        a_up.addEventListener("click", sortUp);
        a_down.addEventListener("click", sortDown);
        a.textContent = text + " ";
        a.href = "javascript://nop/";

        a_up.innerHTML = "&#x25BE;";
        a_up.href = "javascript://nop/";

        a_down.innerHTML = "&#x25B4;";
        a_down.href = "javascript://nop/";
      }

      if ((dflt && !scriptOrder) || cmp == scriptOrder) {
        window.setTimeout(mS, 1);
      } // set initial sort state

      return t;
    };

    const t = crc("div", "scripttable", i.name, i.id, "main");
    const t1 = crc("div", "settingsth_fill", i.name, i.id, "thead_en");
    const tf1 = crc("div", "settingsth_fill", i.name, i.id, "thead_fill1");
    const t2 = createSortable(i, "thead_name", I18N.getMessage("Name"), "name");
    const tf2 = crc("div", "settingsth_fill", i.name, i.id, "thead_fill");
    const t3 = createSortable(
      i,
      "thead_score",
      I18N.getMessage("Rank"),
      "rank",
      true,
    );
    const t4 = crc("div", "settingsth", i.name, i.id, "thead_sites");
    t4.width = "25%";
    t4.textContent = I18N.getMessage("Sites");
    const t5 = createSortable(
      i,
      "thead_installs",
      I18N.getMessage("Installs"),
      "installs",
    );
    const t6 = createSortable(
      i,
      "thead_rating",
      I18N.getMessage("Rating"),
      "rating",
    );
    const t7 = createSortable(i, "thead_fans", I18N.getMessage("Fans"), "fans");
    const t8 = createSortable(
      i,
      "thead_timestamp",
      I18N.getMessage("Last_Changed"),
      "timestamp",
    );
    const t9 = crc("div", "settingsth", i.name, i.id, "thead_homepage");
    t9.textContent = I18N.getMessage("Homepage");

    if (!t.inserted) {
      r = r.concat([t1, tf1, tf2, t2, t3, t4, t5, t6, t7, t8]);

      const tr = crc("div", "settingstr filler", i.name, i.id, "filler");
      for (let o = 0; o < r.length; o++) {
        tr.appendChild(r[o]);
      }

      t.appendChild(tr);
    }

    return t;
  };

  const itemsToMenu = function (items, tabv, cb) {
    let table = null;
    let current_elem = null;
    const scripts = [];

    const getTable = function (i) {
      let t = null;

      if (i.scriptTab) {
        t = createScriptTable();
        scriptTable = t;
      } else {
        t = crc("table", "settingstable", i.name, i.id, "main");
        const tr = crc("tr", "settingstr filler", i.name, i.id, "filler");
        t.appendChild(tr);
      }

      return t;
    };

    let section = null;
    let section_root = null;

    for (const k in items) {
      const i = items[k];
      if (i.id === undefined) i.id = "item" + k;

      if (V) console.log("fire: process Item " + i.name);

      let tr = crc("tr", "settingstr", i.name, i.id, "outer");

      if (i.divider) {
        /* var td = cr('td', 'divider', k);
            td.setAttribute("colspan", "3");
            td.style.height = "15px";
            tr.appendChild(td); */
        tr = null;
      } else {
        const dummy = cr("td", i.name, i.id, "0");
        tr.appendChild(dummy);
        let td1 = cr("td", i.name, i.id, "1");
        const ic = i.icon || i.icon64 || i.image;
        if (ic) {
          td1.setAttribute("class", "imagetd");
          if (i.id && i.userscript) {
            const g = HtmlUtil.createImage(ic, i.name, i.id);
            g.oldvalue = i.enabled;
            td1.appendChild(g);
          } else {
            td1.appendChild(HtmlUtil.createImage(ic, i.name, i.id));
          }
        }
        if (i.option) {
          gOptions[i.id] = i.checkbox ? i.enabled : i.value;
        }
        const td2 = crc("td", "settingstd", i.name, i.id, "2");
        tr.appendChild(td2);
        if (i.heading) {
          var h = cr("span", i.name, i.id, "heading");
          if (!h.inserted) {
            h.textContent = i.name;
            const t = getTable(i);
            table = crc("tbody", "settingstbody", i.name, i.id, "tbody");
            t.appendChild(table);
            current_elem = cr("div", i.name, i.id, "tab_content");
            current_elem.appendChild(t);
            tabv.appendTab(
              Helper.createUniqueId(i.name, i.id),
              h,
              current_elem,
            );
          }
          tr = null;
        } else if (i.section) {
          if (i.endsection) continue;

          const s = crc(
            "div",
            "section" + (i.width ? " section_width" + i.width : ""),
            i.name,
            i.id,
          );
          var h = crc("b", "section_head", i.name, i.id, "head");
          const c = crc("div", "section_content", i.name, i.id, "content");
          h.textContent = i.name;
          s.appendChild(h);
          s.appendChild(c);
          if (section_root == null) {
            section_root = crc("div", "section_table", "", "");
            td2.appendChild(section_root);
            td2.setAttribute("class", "section_td");
          }
          section_root.appendChild(s);
          section = c;
          td1 = null;
        } else if (i.userscript) {
          scripts.push({ item: i, tabv });
          tr = null;
        } else if (i.fireInfo) {
          const info = crc("span", i.name, i.id);
          info.innerHTML = i.value;
          versionDB = new Date(i.versionDB);

          if (section) {
            section.appendChild(info);
            tr = null;
          } else {
            td2.appendChild(info);
          }
        } else if (i.fireUpdate) {
          const oc = function () {
            startFireUpdate(false);
          };
          const ocf = function () {
            startFireUpdate(true);
          };

          const input = HtmlUtil.createButton(i.name, i.id, i.name, oc);
          const inputf = HtmlUtil.createButton(i.fname, i.id, i.fname, ocf);

          if (section) {
            section.appendChild(input);
            section.appendChild(inputf);
            tr = null;
          } else {
            td2.appendChild(input);
            td2.appendChild(inputf);
          }
        } else if (i.search) {
          tabURL = i.value;
          const search = cr("div", "search", "box", "");
          search.appendChild(HtmlUtil.createSearchBox(tabURL));
          tr = null;
        } else if (i.version) {
          version = i.value;
          tr = null;
          const ver = crc("div", "version", "version", "version");
          ver.textContent = "v" + version + " by Jan Biniok";
        } else {
          const span = cr("span", i.name, i.id);
          span.textContent = i.name;
          td2.setAttribute("colspan", "2");
          td2.appendChild(span);
        }
        if (tr) {
          if (td1) tr.insertBefore(td1, dummy);
          if (td2) tr.appendChild(td2, dummy);
          tr.removeChild(dummy);
        }
      }
      if (table && tr) table.appendChild(tr);
    }

    scriptItems = scripts;

    const run = function () {
      sortScripts(scriptItems, null, null, cb);
    };

    window.setTimeout(run, 1);

    if (V) console.log("sort done!");
  };

  const createFireMenu = function (items, use_curtain) {
    if (!items) {
      console.log("fire: items is empty!");
      return;
    }
    allItems = items;

    const o = document.getElementById("fire");
    const main = crc("div", "", "fire", "main");

    if (o) {
      const p = o.parentNode;
      p.removeChild(o);
      p.appendChild(main);
      document.body.setAttribute("class", "main");
    }

    if (V) console.log("fire: head");

    const head = crc("div", "head_container", "fire", "head_container");
    const tv = crc("div", "tv_container", "fire", "tv_container");

    const heada = cr("a", "head_link", "fire", "head_link");
    heada.href = "http://tampermonkey.net";
    heada.target = "_blank";

    const head1 = crc("div", "float margin4", "fire", "head1");
    const image = crc("img", "banner", "fire");
    image.src = chrome.extension.getURL("images/icon128.png");

    const head2 = crc("div", "float head margin4", "fire", "head2");
    const heading = cr("div", "fire");

    const ver = crc("div", "version", "version", "version");
    ver.textContent = " by Jan Biniok";

    const search = cr("div", "search", "box", "");

    heading.textContent = "T" + "amper" + "F" + "ire";

    head1.appendChild(image);
    head2.appendChild(heading);
    head2.appendChild(ver);

    heada.appendChild(head1);
    heada.appendChild(head2);

    head.appendChild(heada);
    head.appendChild(search);

    main.appendChild(head);
    main.appendChild(tv);

    if (V) console.log("fire: tabView");
    const tabv = TabView.create("_main", tv);

    if (V) console.log("fire: itemsToMenu");
    const run = function () {
      const cb = function () {
        if (use_curtain) {
          console.log("fire: done! :)");
          Please.hide();
        }

        initialized = true;
      };

      itemsToMenu(items, tabv, cb);
    };

    window.setTimeout(run, 10);
  };

  const sortFn = {
    name: function (a, b) {
      return a;
    },
    rank: function (a, b) {
      return a.rank - b.rank;
    },
    installs: function (a, b) {
      return a.installs - b.installs;
    },
    fans: function (a, b) {
      return a.fans - b.fans;
    },
    timestamp: function (b, a) {
      return a.timestamp - b.timestamp;
    },
    rating: function (a, b) {
      return a.rating - b.rating;
    },
  };

  var sortScripts = function (scripts, cmp, down, cb) {
    if (V) console.log("sortScripts: start");

    if (cmp === undefined || cmp === null) cmp = "rank";
    if (down === undefined || down === null) down = true;

    const id = gOptions.fire_sort_cache_enabled
      ? scriptOrder + "_" + scriptOrderDown.toString()
      : "";
    let sort = [];
    let index = 0;
    const newTable = gOptions.fire_sort_cache_enabled
      ? createScriptTable(id)
      : null;
    const cached = gOptions.fire_sort_cache_enabled ? newTable.inserted : false;
    let tr, i, td1, td2, ic, tabv;
    let delay0, delay1, delay2;
    const oldTable = scriptTable;

    if (gOptions.fire_sort_cache_enabled) {
      if (cached && V) {
        console.log("use cached table " + id);
      }
      scriptTable.setAttribute("style", Helper.staticVars.invisible_move);
    }

    /* var delayedRemove = function() {
        if (V) console.log("old table removement started");
        oldTable.setAttribute('class', '');
        if (V) console.log("old table removement started 2");

        oldTable.parentNode = null;
        if (V) console.log("old table removement ended");
    }; */

    if (gOptions.fire_sort_cache_enabled) {
      scriptTable.parentNode.insertBefore(newTable, scriptTable);
      scriptTable = newTable;
      scriptTable.setAttribute("style", Helper.staticVars.visible_move);
    }

    let parent = null;

    if (!cached) {
      parent = crc("div", "scripttbody", "new", id, "tbody");
      if (scriptTable) scriptTable.appendChild(parent);
    }

    delay0 = function () {
      if (V) console.log("sortScripts: delay 0");

      for (let j = 0; j < scripts.length; j++) {
        tabv = scripts[j].tabv;
        i = scripts[j].item;
        // id hack to generate new elements
        i.id = i.id + id;

        tr = crc("div", "scripttr", i.name, i.id, "outer");
        if (gOptions.fire_sort_cache_enabled || !tr.inserted) {
          td1 = crc("div", "scripttd", i.name, i.id, "1");
          td2 = crc("div", "scripttd", i.name, i.id, "2");

          ic = i.icon || i.icon64 || i.image;

          if (ic) {
            td1.setAttribute("class", "scripttd imagetd");
            td1.appendChild(HtmlUtil.createImage(ic, i.name, i.id));
          }

          tr.appendChild(td1);
          tr.appendChild(td2);
          createScriptItem(tabv, i, tr);
        }

        index++;
        sort.push({
          tr,
          installs: i["uso:installs"],
          fans: i["uso:fans"],
          timestamp: i["uso:timestamp"],
          rating: i["uso:rating"],
          rank: i.rank,
        });
      }

      if (V) console.log("sortScripts: delay 0.1");

      sort = sort.sort(sortFn[cmp]);

      if (V) console.log("sortScripts: delay 0.2");

      if (down) sort = sort.reverse();
      window.setTimeout(delay1, 100);
    };

    delay1 = function () {
      if (V) console.log("sortScripts: delay 1");

      if (gOptions.fire_sort_cache_enabled) {
        for (let i = 0; i < index; i++) {
          parent.__appendChild(sort[i].tr);
        }
        window.setTimeout(delay2, 100);
      } else {
        const dummy = crc("div", "", "dummy", "dummy");
        parent.appendChild(dummy);

        let s = 0;

        const run = function () {
          let i;
          const t = new Date().getTime() + 15000;

          while (new Date().getTime() < t) {
            // move 100 rows and check time again
            for (i = s; i < index && s + 100 > i; i++) {
              parent.__insertBefore(sort[i].tr, dummy);
            }
            s = i;
          }

          if (i < index) {
            console.log("puhhhhh: sorting is hard work...");
            window.setTimeout(run, 1);
          } else {
            parent.removeChild(dummy);
            window.setTimeout(delay2, 100);
          }
        };

        run();
      }
    };

    delay2 = function () {
      if (V) console.log("sortScripts: end");

      sort = [];

      const cleanup = function () {
        // if (gOptions.fire_sort_cache_enabled) delayedRemove();
        if (cb) cb();
      };

      window.setTimeout(cleanup, 100);
    };

    window.setTimeout(cached || scripts.length == 0 ? delay2 : delay0, 100);
  };

  const createScriptUsoTab = function (i, tabd, closeEditor) {
    const tabh = cr("div", i.name, i.id, "script_editor_h");
    tabh.textContent = "USO";
    const tabc = cr("td", i.name, i.id, "script_editor_c");

    const container = crc(
      "tr",
      "editor_container p100100",
      i.name,
      i.id,
      "container",
    );
    const container_menu = crc("tr", "", i.name, i.id, "container_menu");
    const container_o = crc(
      "table",
      "editor_container_o p100100",
      i.name,
      i.id,
      "container_o",
    );

    const info_outer = crc("td", "editor_outer", i.name, i.id, "script_info");
    const info = crc("td", "editor", i.name, i.id, "script_info");
    let tab;

    container_o.appendChild(container_menu);
    container_o.appendChild(container);
    tabc.appendChild(container_o);

    const menu = crc("td", "editormenu", i.name, i.id, "editormenu");

    info_outer.appendChild(info);
    container.appendChild(info_outer);
    container_menu.appendChild(menu);

    const i_sc_close = HtmlUtil.createButton(
      i.name,
      "close_script",
      I18N.getMessage("Close"),
      closeEditor,
    );

    const install = function () {
      const cb = function (resp) {
        if (resp.found) {
          // if (resp.installed) {}
        } else {
          alert(I18N.getMessage("Unable_to_get_UserScript__Sry_"));
        }
      };
      chrome.extension.sendMessage(
        {
          method: "scriptClick",
          url:
            "http://userscripts.org/scripts/source/" +
            i["uso:script"] +
            ".user.js",
        },
        cb,
      );
    };

    const install_button = HtmlUtil.createButton(
      i.name,
      "save",
      I18N.getMessage("Install"),
      install,
    );

    menu.appendChild(install_button);
    menu.appendChild(i_sc_close);

    tab = tabd.appendTab(
      "script_editor_tab" + Helper.createUniqueId(i.name, i.id),
      tabh,
      tabc,
    );

    return {
      onShow: function () {
        const iframe = document.createElement("iframe");
        iframe.setAttribute("class", "script_iframe");
        iframe.setAttribute(
          "src",
          "http://greasefire.userscripts.org/scripts/show/" + i["uso:script"],
        );
        info.innerHTML = "";
        info.appendChild(iframe);
      },
      onClose: function () {},
    };
  };

  const createScriptDetailsTabView = function (tab, i, tr, parent, closeTab) {
    const tab_head = crc("div", "", i.name, i.id, "script_tab_head");

    const na = Helper.decodeHtml(i.name);

    const heading = crc("div", "heading", i.name, "heading");
    const heading_icon = crc("img", "nameNicon64", i.name, "heading_icon");
    const hicon = i.icon64 ? i.icon64 : i.icon;
    heading_icon.src = hicon;
    const heading_name = crc("div", "nameNname64", i.name, "heading_name");
    heading_name.textContent = na;
    if (hicon) heading.appendChild(heading_icon);
    heading.appendChild(heading_name);
    const heading_author = crc("div", "author", i.name, "author");
    if (i.author) {
      heading_author.textContent = "by " + Helper.decodeHtml(i.author);
    } else if (i.copyright) {
      heading_author.innerHTML = "&copy; ";
      heading_author.textContent += Helper.decodeHtml(i.copyright);
    }

    const table = crc("table", "noborder p100100", i.name, "table");
    const tr1 = crc("tr", "script_tab_head", i.name, "tr1");
    const tr2 = crc("tr", "details", i.name, "tr2");
    const td1 = crc("td", "", i.name, "td1");
    const details = crc("td", "", i.name, "td2");

    heading.appendChild(heading_author);
    tab_head.appendChild(heading);

    td1.appendChild(tab_head);

    tr1.appendChild(td1);
    tr2.appendChild(details);

    table.appendChild(tr1);
    table.appendChild(tr2);

    parent.appendChild(table);

    const style = {
      tv: "tv tv_alt",
      tv_table: "tv_table tv_table_alt",
      tr_tabs: "tr_tabs tr_tabs_alt",
      tr_content: "tr_content tr_content_alt",
      td_content: "td_content td_content_alt",
      td_tabs: "td_tabs td_tabs_alt",
      tv_tabs_align: "tv_tabs_align tv_tabs_align_alt",
      tv_tabs_fill: "tv_tabs_fill tv_tabs_fill_alt",
      tv_tabs_table: "tv_tabs_table tv_tabs_table_alt",
      tv_contents: "tv_contents tv_contents_alt",
      tv_tab_selected: "tv_tab tv_selected tv_tab_alt tv_selected_alt",
      tv_tab_close: "",
      tv_tab: "tv_tab tv_tab_alt",
      tv_content: "tv_content tv_content_alt",
    };

    const tabd = TabView.create(
      "_details" + Helper.createUniqueId(i.name, i.id),
      details,
      style,
    );
    const set = createScriptUsoTab(i, tabd, closeTab);

    const onKey = function (e) {
      let cancel = false;

      if (e.type != "keydown") return;
      if (e.keyCode == 27 /* ESC */) {
        if (tab.isSelected()) {
          window.setTimeout(closeTab, 100);
        }
        cancel = true;
      }

      if (cancel) e.stopPropagation();
    };

    return {
      onShow: function () {
        if (set.onShow) set.onShow();
        window.addEventListener("keydown", onKey, false);
      },
      onClose: function () {
        if (set.onClose) {
          if (set.onClose()) return true;
        }
        window.removeEventListener("keydown", onKey, false);
      },
    };
  };

  var createScriptItem = function (tabv, i, tr) {
    // tab stuff for later use
    let tab;
    let scriptdetails;

    const sname = crc("span", "clickable", i.name, i.id, "sname");

    const sname_name = crc("span", "", i.name, i.id, "sname_name");
    let sname_elem;
    const hp = i.homepage
      ? i.homepage
      : i.namespace && i.namespace.search("http://") == 0
        ? i.namespace
        : null;
    const up = "http://userscripts.org/scripts/show/" + i["uso:script"] + "/";

    sname_elem = cr("a", i.name, i.id, "sname_name_a");
    if (!sname_elem.inserted) {
      // sname_elem.setAttribute('href', up);
      sname_elem.setAttribute("target", "_blank");
      sname_name.appendChild(sname_elem);
    }

    const na = Helper.decodeHtml(i.name);
    sname_elem.textContent = na.length > 35 ? na.substr(0, 35) + "..." : na;
    sname.appendChild(sname_name);

    const ret = [];

    const getTD = function (i, child, app, clas) {
      if (!clas) clas = "scripttd";
      const td1 = crc("div", clas, i.name, i.id, app);
      if (child) td1.appendChild(child);
      return td1;
    };

    const doClose = function () {
      if (scriptdetails.onClose && scriptdetails.onClose()) return;
      if (tab) tab.hide();
    };

    const createTab = function () {
      const tabh = crc("div", "", i.name, i.id, "details_h");
      tabh.textContent = na.length > 25 ? na.substr(0, 25) + "..." : na;
      const tabc = cr("div", i.name, i.id, "details_c");

      tab = tabv.insertTab(
        null,
        "details_" + Helper.createUniqueId(i.name, i.id),
        tabh,
        tabc,
        null,
        doClose,
      );

      scriptdetails = createScriptDetailsTabView(tab, i, tr, tabc, doClose);
    };

    const scriptClick = function (e) {
      if (!tab) createTab();
      if (scriptdetails.onShow) scriptdetails.onShow();
      tab.show();
      if (e.button != 1) {
        tab.select();
      }
    };

    const srank = cr("span", i.name, i.id, "srank");
    const sinstalls = cr("span", i.name, i.id, "sinstalls");
    const srating = cr("span", i.name, i.id, "srating");
    const sfans = cr("span", i.name, i.id, "sfans");
    const stimestamp = cr("span", i.name, i.id, "stimestamp");
    const shomepage = cr("span", i.name, i.id, "shomepage");
    const shomepage_elem = cr("a", i.name, i.id, "shomepage_a");

    i.rank = cacluateRank(i);
    srank.textContent = round(i.rank * 100, 1);
    sinstalls.textContent = i["uso:installs"];
    srating.textContent = i["uso:rating"];
    sfans.textContent = i["uso:fans"];

    const prefixZero = function (s) {
      const r = "0" + s;
      return r.substr(r.length - 2, 2);
    };

    const time_between = function (date1, date2) {
      // The number of milliseconds in one day
      const ONE_HOUR = 1000 * 60 * 60;
      const ONE_DAY = 1000 * 60 * 60 * 24;

      // Convert both dates to milliseconds
      const date1_ms = date1.getTime();
      const date2_ms = date2.getTime();

      // Calculate the difference in milliseconds
      const difference_ms = Math.abs(date1_ms - date2_ms);

      // Convert back to days and return
      const h = Math.round(difference_ms / ONE_HOUR);
      const d = Math.round(difference_ms / ONE_DAY);
      if (h <= 48) {
        return h + " h";
      } else {
        return d + " d";
      }
    };

    if (i["uso:timestamp"] != 0) {
      stimestamp.textContent = time_between(
        versionDB,
        new Date(i["uso:timestamp"]),
      );
    }

    shomepage.appendChild(shomepage_elem);
    if (!shomepage_elem.inserted) {
      shomepage_elem.setAttribute("href", hp);
      shomepage_elem.setAttribute("target", "_blank");
      shomepage.appendChild(sname_elem);
    }

    // add click listener to td to make this more convenient
    const sname_td = getTD(
      i,
      sname,
      "script_td2",
      "scripttd scripttd_name clickable",
    );
    sname_td.addEventListener("click", scriptClick);
    sname_td.title = i.description
      ? na + "\n\n" + Helper.decodeHtml(i.description)
      : na;

    ret.push(sname_td);
    ret.push(getTD(i, srank, "script_td3"));
    ret.push(getTD(i, createImagesFromScript(i), "script_td4"));
    ret.push(getTD(i, sinstalls, "script_td5"));
    ret.push(getTD(i, srating, "script_td6"));
    ret.push(getTD(i, sfans, "script_td7"));
    ret.push(getTD(i, stimestamp, "script_td8"));
    ret.push(getTD(i, shomepage, "script_td9"));

    for (let o = ret.length; o < 10; o++) {
      ret.push(crc("div", "scripttd", i.name, i.id, "script_filler_" + o));
    }

    // tr.removeChild(tr.lastChild);
    // tr.appendChild(cr('td', i.name, i.id, 'script_prefiller_1'));
    tr.appendChild(crc("div", "scripttd", i.name, i.id, "script_prefiller_2"));

    for (let u = 0; u < ret.length; u++) {
      tr.appendChild(ret[u]);
    }

    return ret;
  };

  var createImagesFromScript = function (i) {
    const span = cr("span", i.name, i.id, "site_images", true);
    const getInfo = function (inc) {
      if (inc.search("http") != 0) inc = "http://" + inc;
      const sl = inc.split("/");
      if (sl.length < 3) return null;
      const ps = sl[2].split(".");
      if (ps.length < 2) return null;
      const tld = ps[ps.length - 1];
      const dom = ps[ps.length - 2];
      const predom = [];
      for (let t = ps.length - 3; t >= 0; t--) {
        if (ps[t].search("\\*") != -1) break;
        predom.push(ps[t]);
      }
      return { tld, dom, predom: predom.reverse() };
    };

    if (i.includes) {
      let d = 0;
      for (let o = 0; o < i.includes.length; o++) {
        const inc = i.includes[o];
        if (inc.search(/htt(ps|p):\/\/(\*\/\*|\*)*$/) != -1 || inc == "*") {
          var img = HtmlUtil.createImage(
            chrome.extension.getURL("images/web.png"),
            i.name,
            i.id,
            i.includes[o],
            i.includes[o],
          );
          span.appendChild(img);
          break;
          continue;
        }
        const inf = getInfo(inc);
        if (inf == null) continue;
        let drin = false;
        for (let p = 0; p < o; p++) {
          const pinc = i.includes[p];
          const pinf = getInfo(pinc);
          if (pinf == null) continue;
          if (pinf.dom == inf.dom) {
            drin = true;
            break;
          }
        }
        if (!drin) {
          let tld = "com";
          let predom = "";
          if (inf.tld != "*" && inf.tld != "tld") tld = inf.tld;
          if (inf.predom.length) predom = inf.predom.join(".") + ".";
          // var ico = ("chrome://favicon/http://" + predom + inf.dom + "." + tld + "/").replace(/\*/g, '');
          let ico = (
            "http://" +
            predom +
            inf.dom +
            "." +
            tld +
            "/favicon.ico"
          ).replace(/\*/g, "");
          if (
            ico.search("http://userscripts.org/") == 0 ||
            ico.search("http://userscripts.com/") == 0
          ) {
            ico = "http://userscripts.org/images/script_icon.png";
          }
          var img = HtmlUtil.createImage(
            ico,
            i.name,
            i.id,
            i.includes[o],
            i.includes[o],
          );
          span.appendChild(img);
          d++;
        }
        if (d > 7) {
          const tbc = crc("span", i.name, i.id, "tbc");
          tbc.textContent = "...";
          span.appendChild(tbc);
          break;
        }
      }
    }
    return span;
  };

  const getFireItems = function (tab, url) {
    if (V) console.log("run getFireItems");
    try {
      const s = { method: "getFireItems", tabid: tab, url };

      if (V) console.log("getFireItems sendReq");

      const onResp = function (response) {
        try {
          let use_curtain = true;
          if (response.progress) {
            let a = response.progress.action + "... ";
            if (!a || a == "") a = "";
            let p = "";
            if (response.progress.state && response.progress.state.of) {
              p =
                " " +
                Math.round(
                  (response.progress.state.n * 100) /
                    response.progress.state.of,
                ) +
                "%";
            }
            const c =
              a != "" || p != "" ? a + p : I18N.getMessage("Please_wait___");
            Please.wait(c);
            const retry = function () {
              getFireItems(tab, url);
            };
            window.setTimeout(retry, 2000);
            use_curtain = false;
          }
          if (response.scripts) {
            createFireMenu(response.scripts, use_curtain);
            if (V) console.log("createFireMenu done!");
          }
          if (response.image) {
            const image = crc("img", "banner", "fire");
            image.src = response.image;
          }
          response = null;
        } catch (e) {
          console.log(e);
          throw e;
        }
      };

      chrome.extension.sendMessage(s, onResp);
      Please.wait(I18N.getMessage("Please_wait___"));
    } catch (e) {
      console.log("mSo: " + e.message);
    }
  };

  var startFireUpdate = function (force, cb) {
    if (V) console.log("run startFireUpdate");
    try {
      const s = { method: "startFireUpdate", force };
      const refresh = function () {
        getFireItems(tabID, tabURL);
      };
      chrome.extension.sendMessage(s, function (response) {
        if (response.suc === false) {
          Please.hide();
          alert(I18N.getMessage("TamperFire_is_up_to_date_"));
        } else {
          window.setTimeout(refresh, 1000);
        }
      });
      Please.wait(I18N.getMessage("Please_wait___"));
    } catch (e) {
      console.log("mSo: " + e.message);
    }
  };

  chrome.extension.onMessage.addListener(
    function (request, sender, sendResponse) {
      if (V) console.log("f: method " + request.method);
      if (request.method == "confirm") {
        const resp = function (c) {
          sendResponse({ confirm: c });
        };
        Helper.confirm(request.msg, resp);
      } else if (request.method == "showMsg") {
        alert(request.msg);
        sendResponse({});
      } else {
        if (V) {
          console.log(
            "f: " + I18N.getMessage("Unknown_method_0name0", request.method),
          );
        }
        return false;
      }

      return true;
    },
  );

  const domListener = function () {
    window.removeEventListener("DOMContentLoaded", domListener, false);
    window.removeEventListener("load", domListener, false);

    const suc = function () {
      getFireItems(tabID, tabURL);
    };

    const fail = function () {
      if (
        confirm(
          I18N.getMessage(
            "An_internal_error_occured_Do_you_want_to_visit_the_forum_",
          ),
        )
      ) {
        window.location.href = "http://tampermonkey.net/bug";
      }
    };

    pp.ping(suc, fail);
    Please.wait(I18N.getMessage("Please_wait___"));
  };

  window.addEventListener("DOMContentLoaded", domListener, false);
  window.addEventListener("load", domListener, false);

  tabID = determineTabID();
  tabURL = decodeURI(determineTabURL(encodeURI(tabURL)));
})();
