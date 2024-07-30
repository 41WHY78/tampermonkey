/**
 * @filename options.js
 * @author Jan Biniok <jan@biniok.net>
 * @licence GPL v3
 */

/* ########### include ############## */
Registry.require("xmlhttprequest");
Registry.require("pingpong");
Registry.require("crcrc");
Registry.require("curtain");
Registry.require("tabview");
Registry.require("htmlutil");
Registry.require("helper");
Registry.require("convert");
Registry.require("i18n");
Registry.require("syncinfo");

(function () {
  const V = false;

  if (!window.requestFileSystem) {
    window.requestFileSystem = window.webkitRequestFileSystem;
  }

  const cr = Registry.get("crcrc").cr;
  const crc = Registry.get("crcrc").crc;
  const Please = Registry.get("curtain");
  const TabView = Registry.get("tabview");
  const HtmlUtil = Registry.get("htmlutil");
  const Helper = Registry.get("helper");
  const Converter = Registry.get("convert");
  const pp = Registry.get("pingpong");
  const I18N = Registry.get("i18n");
  const SyncInfo = Registry.get("syncinfo");

  let initialized = false;
  let allItems = null;
  const gOptions = {};
  const doneListener = [];
  let version = "0.0.0";
  let gNoWarn = false;
  const stCache = {};
  const gArgs = Helper.getUrlArgs();

  /* ########### callbacks ############## */
  const gCallbacks = {};
  const gCb = function (id, fn) {
    if (gCallbacks[id] && gCallbacks[id][fn]) {
      gCallbacks[id][fn].apply(this, Array.prototype.slice.call(arguments, 2));
    } else {
      console.log(
        "option: WARN: unable to find callback '" +
          fn +
          "' for id '" +
          id +
          "'",
      );
    }
  };

  /* ########### main ############## */

  const itemsToMenu = function (items, tabv) {
    let tobj = null;
    let current_elem = null;
    const scripts = [];

    const getTable = function (i) {
      let t, tr, trf, b, f, h;
      let r = [];
      let u = [];

      b = cr("tbody", i.name, i.id, "body");
      f = cr("tfoot", i.name, i.id, "foot");
      h = cr("thead", i.name, i.id, "head");

      if (i.scriptTab) {
        const multi = createMultiSelectActions(i);
        t = crc("table", "scripttable", i.name, i.id, "main");
        const t0 = crc("th", "", i.name, i.id, "thead_sel");
        t0.appendChild(multi.selAll);
        const f0 = crc("td", "", i.name, i.id, "tfoot_sel");

        const t1 = crc("th", "", i.name, i.id, "thead_en");
        const f1 = crc("td", "", i.name, i.id, "tfoot_en");
        f1.setAttribute("colspan", "9");
        f1.appendChild(multi.actionBox);

        const t2 = crc("th", "settingsth", i.name, i.id, "thead_name");
        t2.textContent = I18N.getMessage("Name");
        const t24 = crc("th", "settingsth", i.name, i.id, "thead_ver");
        t24.textContent = I18N.getMessage("Version");
        const t25 = crc("th", "settingsth", i.name, i.id, "thead_type");
        t25.textContent = I18N.getMessage("Type");
        const t26 = crc("th", "settingsth", i.name, i.id, "thead_sync");
        t26.textContent = "";
        const t3 = crc("th", "settingsth", i.name, i.id, "thead_sites");
        t3.width = "25%";
        t3.textContent = I18N.getMessage("Sites");
        const t4 = crc("th", "settingsth", i.name, i.id, "thead_features");
        t4.textContent = I18N.getMessage("Features");
        const t5 = crc("th", "settingsth", i.name, i.id, "thead_edit");
        t5.textContent = I18N.getMessage("Homepage");
        const t6 = crc("th", "settingsth", i.name, i.id, "thead_updated");
        t6.textContent = I18N.getMessage("Last_Updated");
        const t7 = crc("th", "settingsth", i.name, i.id, "thead_sort");
        t7.textContent = I18N.getMessage("Sort");
        const t8 = crc("th", "settingsth", i.name, i.id, "thead_del");
        t8.textContent = I18N.getMessage("Delete");
        const later = function () {
          if (gOptions.sync_enabled) {
            t26.textContent = I18N.getMessage("Imported");
          }
        };
        doneListener.push(later);

        r = r.concat([t0, t1, t2, t24, t25, t26, t3, t4, t5, t6, t7, t8]);
        tr = crc("tr", "settingstr filler", i.name, i.id, "filler");
        for (var o = 0; o < r.length; o++) {
          tr.appendChild(r[o]);
        }

        u = u.concat([f0, f1]);
        trf = crc("tr", "settingstr filler", i.name, i.id, "footer");
        for (var o = 0; o < u.length; o++) {
          trf.appendChild(u[o]);
        }

        const td = crc(
          "td",
          "settingstd filler",
          i.name,
          i.id,
          "filler_td" + i.id,
        );
        // td.width = "100%";
        tr.appendChild(td);
        h.appendChild(tr);
        f.appendChild(trf);
      } else {
        t = crc("table", "settingstable", i.name, i.id, "main");
        tr = crc("tr", "settingstr filler", i.name, i.id, "filler");
        b.appendChild(tr);
      }

      t.appendChild(h);
      t.appendChild(b);
      t.appendChild(f);

      return { table: t, head: h, body: b, foot: f };
    };

    let section = null;
    let section_root = null;
    let section_need_save = false;

    for (const k in items) {
      const i = items[k];
      if (V) console.log("options: process Item " + i.name);

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
        if (i.image) {
          td1.setAttribute("class", "imagetd");
          td1.appendChild(HtmlUtil.createImage(i.image, i.name, i.id));
        }
        let td2 = crc("td", "settingstd", i.name, i.id, "2");
        if (i.option) {
          gOptions[i.id] = i.checkbox ? i.enabled : i.value;
        }
        if (i.checkbox) {
          var oc = function () {
            enableScript(this.key, this.checked);
          };
          var oco = function () {
            let doit = true;
            if (this.warning) {
              doit = confirm(this.warning);
              if (!doit) this.checked = !this.checked;
            }
            if (doit) {
              setOption(this.key, this.checked, this.reload);
              if (this.reload) window.location.reload();
            }
          };
          if (section && section_need_save) {
            // checkbox value will by stored by "Save" button
            oc = null;
            oco = null;
          }

          var input = HtmlUtil.createCheckbox(i.name, i, i.option ? oco : oc);
          if (section) {
            section.appendChild(input.elem);
            tr = null;
          } else {
            td2.appendChild(input.elem);
          }
          input.elem.setAttribute(
            "style",
            i.level > gOptions.configMode
              ? Helper.staticVars.invisible
              : Helper.staticVars.visible,
          );
        } else if (i.button) {
          var oco = function () {
            let doit = true;
            if (this.warning) {
              doit = confirm(this.warning);
            }
            if (doit) {
              buttonPress(this.key, true, this.ignore, this.reload);
            }
          };

          var input = HtmlUtil.createButton(i.name, i, oco);

          if (section) {
            section.appendChild(input);
            tr = null;
          } else {
            td2.appendChild(input);
          }
          input.setAttribute(
            "style",
            i.level > gOptions.configMode
              ? Helper.staticVars.invisible
              : Helper.staticVars.visible,
          );
        } else if (i.input) {
          var input = HtmlUtil.createTextarea(i.name, i);
          if (section) {
            section.appendChild(input.elem);
            if (i.hint) {
              var h = cr("span", i.name, i.id, "hint");
              h.textContent = i.hint;
              input.elem.appendChild(h);
            }
            tr = null;
            section_need_save = true;
          } else {
            td2.appendChild(input.elem);
          }
          input.elem.setAttribute(
            "style",
            i.level > gOptions.configMode
              ? Helper.staticVars.invisible
              : Helper.staticVars.visible,
          );
        } else if (i.text) {
          var input = HtmlUtil.createInput(i.name, i);
          if (section) {
            section.appendChild(input.elem);
            if (i.hint) {
              var h = crc("span", "hint", i.name, i.id, "hint");
              h.textContent = i.hint;
              input.elem.appendChild(h);
            }
            tr = null;
            section_need_save = true;
          } else {
            td2.appendChild(input.elem);
          }
          input.elem.setAttribute(
            "style",
            i.level > gOptions.configMode
              ? Helper.staticVars.invisible
              : Helper.staticVars.visible,
          );
        } else if (i.password) {
          var input = HtmlUtil.createPassword(i.name, i);
          if (section) {
            section.appendChild(input.elem);
            tr = null;
            section_need_save = true;
          } else {
            td2.appendChild(input.elem);
          }
          input.elem.setAttribute(
            "style",
            i.level > gOptions.configMode
              ? Helper.staticVars.invisible
              : Helper.staticVars.visible,
          );
        } else if (i.select) {
          var oc = function () {
            let doit = true;
            if (this.warning) {
              doit = confirm(this.warning);
              if (!doit) this.value = this.oldvalue;
            }
            if (doit) {
              setOption(this.key, this.value, this.reload);
              if (this.reload) window.location.reload();
            }
          };

          if (section && section_need_save) {
            // checkbox value will by stored by "Save" button
            oc = null;
            if (i.enabler) {
              // only applicable if section has a save button
              oc = function () {
                const es = document.getElementsByName("enabled_by_" + this.key);
                const selected =
                  this.selectedIndex < this.options.length
                    ? this.options[this.selectedIndex]
                    : this.options[0];
                const enabless = selected.getAttribute("enables");
                const enables = enabless ? JSON.parse(enabless) : {};

                Helper.forEach(es, function (e) {
                  if (enables[e.key] === undefined || enables[e.key] == 1) {
                    e.setAttribute("style", Helper.staticVars.visible);
                  } else {
                    e.setAttribute("style", Helper.staticVars.invisible);
                  }
                });
              };
            }
          }

          var input = HtmlUtil.createDropDown(i.name, i, i.select, oc);
          if (section) {
            section.appendChild(input.elem);
            tr = null;
          } else {
            td2.appendChild(input.elem);
          }
          input.elem.setAttribute(
            "style",
            i.level > gOptions.configMode
              ? Helper.staticVars.invisible
              : Helper.staticVars.visible,
          );
          if (section && i.enabler) {
            // schedule initial setup
            const wrap = function () {
              const foc = oc;
              const felem = input;
              doneListener.push(function () {
                foc.apply(felem.select, []);
              });
            };
            wrap();
          }
        } else if (i.url) {
          const a = cr("a", i.name, i.id);
          a.href = "javascript://nop/";
          a.url = i.url;
          a.newtab = i.newtab;
          if (!a.inserted) {
            var oc = function () {
              loadUrl(this.url, this.newtab);
            };
            a.addEventListener("click", oc);
          }
          a.textContent = i.name;
          if (section) {
            section.appendChild(a);
            tr = null;
          } else {
            td2.setAttribute("colspan", "2");
            td2.appendChild(a);
          }
        } else if (i.heading) {
          var h = cr("span", i.name, i.id);
          h.textContent = i.name;
          tobj = getTable(i);
          current_elem = cr("div", i.name, i.id, "tab_content");
          current_elem.appendChild(tobj.table);
          tr = null;
          const tab = tabv.appendTab(
            Helper.createUniqueId(i.name, i.id),
            h,
            current_elem,
          );
        } else if (i.section) {
          if (section && section_need_save) {
            // finalize previous section...
            const b = cr("input", section.name, section.id, "Save");
            if (!b.inserted) {
              b.type = "button";
              b.section = section;
              b.value = I18N.getMessage("Save");

              var s = function () {
                const elems = Array.prototype.slice.call(
                  this.section.getElementsByTagName("textarea"),
                );
                const app = function (iterator) {
                  Helper.forEach(iterator, function (e) {
                    elems.push(e);
                  });
                };
                app(
                  document.evaluate(
                    '//div[@id="' + this.section.id + '"]//input',
                    this.section,
                    null,
                    XPathResult.ORDERED_NODE_ITERATOR_TYPE,
                    null,
                  ),
                );
                app(
                  document.evaluate(
                    '//div[@id="' + this.section.id + '"]//select',
                    this.section,
                    null,
                    XPathResult.ORDERED_NODE_ITERATOR_TYPE,
                    null,
                  ),
                );

                for (let o = 0; o < elems.length; o++) {
                  let val = null;
                  const elem = elems[o];
                  const k = elem.key;
                  if (elem.tagName.toLowerCase() == "textarea") {
                    if (elem.array) {
                      const ar = elem.value.split("\n");
                      const nar = [];
                      for (let u = 0; u < ar.length; u++) {
                        if (ar[u] && ar[u].trim() != "") nar.push(ar[u]);
                      }
                      val = nar;
                    } else {
                      val = elem.value;
                    }
                  } else if (elem.getAttribute("type") == "checkbox") {
                    val = elem.checked;
                  } else if (elem.getAttribute("type") == "select") {
                    let l = 0;
                    if (
                      elem.selectedIndex >= 0 &&
                      elem.selectedIndex < elem.options.length
                    ) {
                      l = elem.selectedIndex;
                    }
                    val = elem[l] ? elem[l].value : elem.options[0].value;
                  } else if (elem.getAttribute("type") == "button") {
                    // ignore
                  } else {
                    val = elem.value;
                  }
                  if (k) setOption(k, val);
                }
              };
              b.addEventListener("click", s, false);
            }
            section.appendChild(b);
            tr = null;
          }
          if (i.endsection) continue;

          var s = crc("div", "section", i.name, i.id);
          var h = crc("div", "section_head", i.name, i.id, "head");
          const c = crc("div", "section_content", i.name, i.id, "content");
          h.textContent = i.name;
          s.appendChild(h);
          s.appendChild(c);
          if (section_root == null) {
            section_root = crc("div", "section_table", "", "");
            td2.appendChild(section_root);
            td2.setAttribute("class", "section_td");
          } else {
            tr = null;
            td2 = null;
          }
          section_need_save = false;
          section_root.appendChild(s);

          s.setAttribute(
            "style",
            i.level > gOptions.configMode
              ? Helper.staticVars.invisible
              : Helper.staticVars.visible,
          );
          section = c;
          if (i.needsave) section_need_save = true; // section is stored once
          td1 = null;
        } else if (i.menucmd) {
          var span = cr("span", i.name, i.id, false, true);
          span.textContent = i.name;
          td2.setAttribute("colspan", "2");
          td2.appendChild(span);
        } else if (i.userscript || i.nativeScript || i.user_agent) {
          td2.setAttribute("colspan", "2");
          const tds = createScriptItem(i, tr, tabv);
          tr.setAttribute("class", "scripttr");
          if (i.nnew) {
            tr.setAttribute("style", "display: none;");
          }
          for (let u = 0; u < tds.length; u++) {
            tr.appendChild(tds[u]);
          }
          if (i.userscript || i.user_agent) {
            scripts.push({ script: tr, pos: i.position, posof: i.positionof });
          }
          td1 = null;
        } else if (i.version) {
          version = i.value;
          tr = null;
          const ver = crc("div", "version", "version", "version");
          ver.textContent = "v" + version + " by Jan Biniok";
        } else {
          var span = cr("span", i.name, i.id);
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

      if (tobj && tr) tobj.body.appendChild(tr);
    }

    sortScripts(scripts);

    doneListener.push(gCallbacks.multiselect.single_click);
  };

  const createUtilTab = function (tabv) {
    const i = { name: "utils", id: "utils" };

    const h = cr("div", i.name, i.id, "tab_util_h");
    h.textContent = I18N.getMessage("Utilities");
    const util = cr("div", i.name, i.id, "tab_util");
    const tab = tabv.appendTab(Helper.createUniqueId(i.name, i.id), h, util);

    // TODO: hardcoded !!
    if (gOptions.configMode < 50) {
      tab.hide();
    } else {
      tab.show();
    }

    const cont = crc("div", "tv_util", i.name, i.id, "tab_util_cont");

    const expo = function () {
      const exp = { created_by: "Tampermonkey", version: "1", scripts: [] };

      for (const o in allItems) {
        const c = allItems[o];
        if ((c.userscript || i.user_agent) && c.id && !c.system) {
          const p = {
            name: c.name,
            options: c.options,
            enabled: c.enabled,
            position: c.position,
          };
          if (c.file_url && c.file_url.trim() != "") {
            p.file_url = c.file_url;
          }
          if (c.code && c.code.trim() != "") {
            p.source = Converter.Base64.encode(Converter.UTF8.encode(c.code));
            exp.scripts.push(p);
          } else {
            console.log("options: Strange script: " + c.name);
          }
        }
      }

      return JSON.stringify(exp);
    };

    const impo = function (src) {
      let err = false;
      let cnt = 0;
      if (src.trim() != "") {
        let m = null;
        try {
          m = JSON.parse(src);
        } catch (e) {
          const t1 = "<body>";
          const t2 = "</body>";
          if (src.search(t1) != -1) {
            const p1 = src.indexOf(t1);
            const p2 = src.lastIndexOf(t2);
            if (p1 != -1 && p2 != -1) {
              src = src.substr(p1 + t1.length, p2 - (p1 + t1.length));
              impo(src);
            }
          } else {
            Helper.alert(I18N.getMessage("Unable_to_parse_this_"));
          }
          return;
        }
        const processScript = function (s) {
          try {
            const name = s.name;
            const code = Converter.UTF8.decode(
              Converter.Base64.decode(s.source),
            );
            const uu = s.file_url || s.update_url; // compatibility cause update_url was renamed to file_url

            if (code && code.trim() != "") {
              const resp = function (response) {
                if (response.installed) {
                  const en = s.enable == undefined ? s.enabled : s.enable;
                  const o = s.options;
                  o.enabled = en;
                  o.position = s.position;
                  modifyScriptOptions(s.name, o, false);
                }
                if (--cnt == 0) {
                  modifyScriptOption(null, false, null, true, true);
                }
              };
              cnt++;
              chrome.extension.sendMessage(
                {
                  method: "saveScript",
                  name,
                  code,
                  reload: false,
                  file_url: uu,
                },
                resp,
              );
            }
          } catch (e) {
            err = true;
            console.log("options: Error while importing script " + o.name);
          }
        };
        const p = m.scripts;
        for (var o = p.length - 1; o >= 0; o--) {
          processScript(p[o]);
        }
        if (err) {
          Helper.alert(I18N.getMessage("An_error_occured_during_import_"));
        }
      }
    };

    const errorHandler = function (e) {
      let msg = "";

      switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
          msg = "QUOTA_EXCEEDED_ERR";
          break;
        case FileError.NOT_FOUND_ERR:
          msg = "NOT_FOUND_ERR";
          break;
        case FileError.SECURITY_ERR:
          msg = "SECURITY_ERR";
          break;
        case FileError.INVALID_MODIFICATION_ERR:
          msg = "INVALID_MODIFICATION_ERR";
          break;
        case FileError.INVALID_STATE_ERR:
          msg = "INVALID_STATE_ERR";
          break;
        default:
          msg = "Unknown Error";
          break;
      }

      Helper.alert("Error: " + msg);
    };

    const impo_textarea = function () {
      impo(ta.value);
    };

    const impo_ls = function () {
      function onInitFs(fs) {
        fs.root.getFile(
          "scripts.tmx",
          {},
          function (fileEntry) {
            // Get a File object representing the file,
            // then use FileReader to read its contents.
            fileEntry.file(function (file) {
              const reader = new FileReader();

              reader.onloadend = function (e) {
                impo(this.result);
              };

              reader.readAsText(file);
            }, errorHandler);
          },
          errorHandler,
        );
      }

      window.requestFileSystem(
        window.PERSISTENT,
        1024 * 1024,
        onInitFs,
        errorHandler,
      );
    };

    const expo_ls = function () {
      const ta_value = expo();
      function onInitFs(fs) {
        fs.root.getFile(
          "scripts.tmx",
          { create: true },
          function (fileEntry) {
            // Create a FileWriter object for our FileEntry (log.txt).
            fileEntry.createWriter(function (fileWriter) {
              fileWriter.onwriteend = function (e) {
                console.log("Write completed.");
              };

              fileWriter.onerror = function (e) {
                console.log("Write failed: " + e.toString());
              };

              // Create a new Blob and write it to log.txt.
              const bb = new Blob([ta_value], { type: "text/plain" });
              fileWriter.write(bb);
            }, errorHandler);
          },
          errorHandler,
        );
      }

      window.requestFileSystem(
        window.PERSISTENT,
        1024 * 1024,
        onInitFs,
        errorHandler,
      );
    };

    const expo_doc = function () {
      const ta_value = expo();
      const bb = new Blob([ta_value], { type: "text/plain" });
      saveAs(bb, "tmScripts.txt");
    };

    const expo_textarea = function () {
      ta.value = expo();
    };

    const imp_ta = HtmlUtil.createButton(
      i.name,
      i.id + "_i_ta",
      I18N.getMessage("Import_from_Textarea"),
      impo_textarea,
    );
    const imp_ls = HtmlUtil.createButton(
      i.name,
      i.id + "_i_ls",
      I18N.getMessage("Import_from_SandboxFS"),
      impo_ls,
    );
    const imp_file = cr("input", i.name, i.id + "_i_file", "file");

    const handleFileSelect = function (evt) {
      const files = evt.target.files; // FileList object
      const data = [];

      const run_impo = function () {
        impo(data.pop());
      };

      for (var i = 0, f; (f = files[i]); i++) {
        const reader = new FileReader();
        // Closure to capture the file information.
        reader.onload = (function (theFile) {
          return function (e) {
            data.push(e.target.result);
            window.setTimeout(run_impo, 10);
          };
        })(f);
        reader.readAsText(f);
      }
    };

    if (!imp_file.inserted) {
      imp_file.type = "file";
      imp_file.addEventListener("change", handleFileSelect, false);
    }

    const exp_ta = HtmlUtil.createButton(
      i.name,
      i.id + "_e_ta",
      I18N.getMessage("Export_to_Textarea"),
      expo_textarea,
    );
    const exp_doc = HtmlUtil.createButton(
      i.name,
      i.id + "_e_doc",
      I18N.getMessage("Export_to_file"),
      expo_doc,
    );
    const exp_ls = HtmlUtil.createButton(
      i.name,
      i.id + "_e_ls",
      I18N.getMessage("Export_to_SandboxFS"),
      expo_ls,
    );

    var ta = crc("textarea", "importta", i.name, i.id, "ta");
    const sta = crc("div", "section", i.name, i.id, "ta");
    const hta = crc("div", "section_head", i.name, i.id, "head_ta");
    const cta = crc("div", "section_content", i.name, i.id, "content_ta");

    hta.textContent = "TextArea";
    cta.appendChild(exp_ta);
    cta.appendChild(imp_ta);
    cta.appendChild(ta);
    sta.appendChild(hta);
    sta.appendChild(cta);

    const ssb = crc("div", "section", i.name, i.id, "sb");
    const hsb = crc("div", "section_head", i.name, i.id, "head_sb");
    const csb = crc("div", "section_content", i.name, i.id, "content_sb");

    hsb.textContent = "SandboxFS";
    ssb.appendChild(hsb);
    ssb.appendChild(csb);
    csb.appendChild(exp_ls);
    csb.appendChild(imp_ls);

    const sfi = crc("div", "section", i.name, i.id, "fi");
    const hfi = crc("div", "section_head", i.name, i.id, "head_fi");
    const cfi = crc("div", "section_content", i.name, i.id, "content_fi");

    hfi.textContent = "File";
    sfi.appendChild(hfi);
    sfi.appendChild(cfi);
    cfi.appendChild(exp_doc);
    cfi.appendChild(imp_file);

    cont.appendChild(sfi);
    cont.appendChild(ssb);
    cont.appendChild(sta);

    util.appendChild(cont);
  };

  const createOptionsMenu = function (items, noWarn) {
    gNoWarn = noWarn;

    if (!items) {
      console.log("options: items is empty!");
      return;
    }
    allItems = items;

    const o = document.getElementById("options");
    const main = crc("div", "main_container p100100", "options", "main");

    if (o) {
      const p = o.parentNode;
      p.removeChild(o);
      p.appendChild(main);
      document.body.setAttribute("class", "main");
    }

    if (V) console.log("options: head");

    const head = crc("div", "head_container", "opt", "head_container");
    const tv = crc("div", "tv_container", "opt", "tv_container");

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

    if (V) console.log("options: tabView");
    const tabv = TabView.create("_main", tv);

    if (V) console.log("options: itemsToMenu");
    itemsToMenu(items, tabv);
    if (V) console.log("options: utilTab");
    createUtilTab(tabv);

    gNoWarn = null;
    initialized = true;
    Please.hide();

    while (doneListener.length) {
      const f = doneListener.pop();
      f();
    }
  };

  const createCludesEditor = function (name, type, other_name) {
    const i = type.item;
    const id = i.id + type.id;
    const key = (other_name ? "orig_" : "use_") + type.id;

    const selId = function (k) {
      return "select_" + Helper.createUniqueId(k, i.id) + "_sel1";
    };

    const s = crc("div", "cludes", name, id, "cb1");
    if (document.getElementById(selId(key))) return { elem: s };

    const span = cr("span", i.name, id, "cb2");
    if (other_name) {
      const co = function () {
        if (this.type == "checkbox") {
          modifyScriptOption(this.name, this.key, !this.oldvalue);
        }
      };
      const kk = "merge_" + type.id;
      const vv = !!(i.options && i.options.override && i.options.override[kk]);

      const cbs = HtmlUtil.createCheckbox(
        name,
        { id: kk, name: i.name, enabled: vv },
        co,
      );
      span.appendChild(cbs.elem);
    } else {
      span.textContent = name;
    }
    s.title = i.desc ? i.desc : "";

    const values =
      i.options && i.options.override && i.options.override[key]
        ? i.options.override[key]
        : [];
    const sel = crc("select", "cludes", key, i.id, "sel1");
    sel.setAttribute("size", "6");
    for (let n = 0; n < values.length; n++) {
      const op = document.createElement("option");
      op.value = op.text = values[n];
      sel.appendChild(op);
    }

    s.appendChild(span);
    s.appendChild(sel);

    const addToOther = function () {
      const uid = selId(
        "use_" + (type.id == "excludes" ? "includes" : "excludes"),
      );
      const other_sel = document.getElementById(uid);
      const op = sel.options[sel.selectedIndex];

      if (op && !other_sel.querySelector('option[value="' + op.value + '"]')) {
        other_sel.appendChild(op.cloneNode(true));
        saveChanges();
      }
    };

    const addRule = function () {
      const rule = prompt(I18N.getMessage("Enter_the_new_rule"));
      if (rule) {
        const op = document.createElement("option");
        op.value = op.text = rule.trim();
        sel.appendChild(op);
        saveChanges();
      }
    };

    const editRule = function () {
      const op = sel.options[sel.selectedIndex];
      if (!op) return;
      const rule = prompt(I18N.getMessage("Enter_the_new_rule"), op.value);
      if (rule) {
        op.value = op.text = rule.trim();
        saveChanges();
      }
    };

    const delRule = function () {
      const op = sel.options[sel.selectedIndex];
      if (!op) return;
      op.parentNode.removeChild(op);
      saveChanges();
    };

    const optsToArr = function (select) {
      const arr = [];
      for (let n = 0; n < select.options.length; n++) {
        arr.push(select.options[n].value);
      }
      return arr;
    };

    var saveChanges = function () {
      const options = {
        includes: optsToArr(document.getElementById(selId("use_includes"))),
        matches: optsToArr(document.getElementById(selId("use_matches"))),
        excludes: optsToArr(document.getElementById(selId("use_excludes"))),
      };

      // save and merge original and user *cludes
      modifyScriptOptions(i.name, options);
      return true;
    };

    if (other_name) {
      // this is the original (in/ex)clude list; items can be added to the user (ex/in)clude list
      const btn = cr("button", i.name, id, "btn1");
      btn.innerHTML = I18N.getMessage("Add_as_0clude0", other_name);
      btn.addEventListener("click", addToOther, false);
      s.appendChild(btn);
    } else {
      // this is a user *clude; append add, edit an remove buttons for this list
      const btn_add = cr("button", i.name, id, "btn2");
      btn_add.innerHTML = I18N.getMessage("Add") + "...";
      btn_add.addEventListener("click", addRule, false);
      s.appendChild(btn_add);

      const btn_edit = cr("button", i.name, id, "btn3");
      btn_edit.innerHTML = I18N.getMessage("Edit") + "...";
      btn_edit.addEventListener("click", editRule, false);
      s.appendChild(btn_edit);

      const btn_del = cr("button", i.name, id, "btn4");
      btn_del.innerHTML = I18N.getMessage("Remove");
      btn_del.addEventListener("click", delRule, false);
      s.appendChild(btn_del);
    }

    return { elem: s };
  };

  var sortScripts = function (scripts) {
    const first = function (elem, tag) {
      if (elem.tagName == tag) {
        return elem;
      } else {
        return elem.parentNode ? first(elem.parentNode, tag) : null;
      }
    };
    const sortEm = function (results) {
      const numComparisonAsc = function (a, b) {
        return a.position - b.position;
      };
      results.sort(numComparisonAsc);
      return results;
    };

    let parent = null;
    let sort = [];
    let index = 0;

    for (var i = 0; i < scripts.length; i++) {
      const e = scripts[i].script;
      const tr = first(e, "TR");
      if (tr) {
        const p = first(tr, "TBODY");
        if (!parent) {
          parent = p;
        } else if (parent != p) {
          console.log("options: different parents?!?!");
        }
        index++;
        sort.push({ tr, position: e.pos ? e.pos : 1000 + index });
        tr.inserted = false;
        tr.parentNode.removeChild(tr);
      } else {
        console.log("options: unable to sort script at pos " + e.pos);
      }
    }
    sort = sortEm(sort);
    for (var i = 0; i < index; i++) {
      parent.appendChild(sort[i].tr);
    }
  };

  const savedScript = {};
  const createScriptDetailsTabView = function (tab, i, tr, parent, closeTab) {
    const tab_head = crc("div", "", i.name, i.id, "script_tab_head");

    const old = tab_head.inserted;
    const heading = crc("div", "heading", i.name, "heading");
    const heading_icon = crc("img", "nameNicon64", i.name, "heading_icon");
    const hicon = i.icon64 ? i.icon64 : i.icon;
    heading_icon.src = hicon;
    const heading_name = crc("div", "nameNname64", i.name, "heading_name");
    heading_name.textContent = i.name;
    if (hicon) heading.appendChild(heading_icon);
    heading.appendChild(heading_name);
    const heading_author = crc("div", "author", i.name, "author");
    if (i.author) {
      heading_author.textContent = "by " + i.author;
    } else if (i.copyright) {
      heading_author.innerHTML = "&copy; ";
      heading_author.textContent += i.copyright;
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
    const set = createScriptEditorTab(i, tabd, closeTab);
    const sst = !i.id || i.system ? {} : createScriptSettingsTab(i, tabd);

    if (old) {
      return stCache["tab" + i.name];
    }

    const onKey = function (e) {
      let cancel = false;

      if (e.type != "keydown") return;
      if (e.keyCode == 27 /* ESC */) {
        if (gOptions.editor_keyMap == "windows") {
          if (tab.isSelected()) {
            closeTab();
          }
          cancel = true;
        }
      }

      if (cancel) e.stopPropagation();
    };

    const beforeClose = function (force) {
      let leafmealone = false;
      if (sst.beforeClose) leafmealone |= sst.beforeClose(force);
      if (set.beforeClose) leafmealone |= set.beforeClose(force);
      return leafmealone;
    };

    const onShow = function () {
      if (sst.onShow) sst.onShow();
      if (set.onShow) set.onShow();
      window.addEventListener("keydown", onKey, false);
    };

    const onClose = function (force) {
      if (sst.onClose) {
        if (sst.onClose(force)) return true;
      }
      if (set.onClose) {
        if (set.onClose(force)) return true;
      }
      window.removeEventListener("keydown", onKey, false);
    };

    const onSelect = function () {
      if (sst.onSelect) {
        if (sst.onSelect()) return true;
      }
      if (set.onClose) {
        if (set.onSelect()) return true;
      }
    };

    const e = { onShow, onClose, onSelect, beforeClose };

    stCache["tab" + i.name] = e;

    return e;
  };

  var createScriptSettingsTab = function (i, tabd) {
    const tabh = cr("div", i.name, i.id, "script_setting_h");
    const old = tabh.inserted;

    tabh.textContent = I18N.getMessage("Settings");
    const tabc = cr("td", i.name, i.id, "script_settings_c");

    const co = function () {
      if (this.type == "checkbox" || this.type == "button") {
        modifyScriptOption(this.name, this.key, !this.oldvalue);
      } else if (
        this.type == "text" ||
        this.type == "textarea" ||
        this.type == "select-one"
      ) {
        modifyScriptOption(this.name, this.key, this.value);
      }
    };

    const i_pos = HtmlUtil.createPosition(
      I18N.getMessage("Position_") + ": ",
      { id: "position", name: i.name, pos: i.position, posof: i.positionof },
      co,
    );

    const i_ra = HtmlUtil.createScriptStartDropDown(
      I18N.getMessage("Run_at") + ": ",
      { id: "run_at", name: i.name, value: i.run_at },
      co,
    );

    const e_oi = createCludesEditor(
      I18N.getMessage("Original_includes"),
      { id: "includes", item: i },
      I18N.getMessage("User_excludes"),
    );
    const e_om = createCludesEditor(
      I18N.getMessage("Original_matches"),
      { id: "matches", item: i },
      I18N.getMessage("User_excludes"),
    );
    const e_oe = createCludesEditor(
      I18N.getMessage("Original_excludes"),
      { id: "excludes", item: i },
      I18N.getMessage("User_includes"),
    );
    const clear_cludes = crc("div", "clear", i.name, i.id, "clear");

    const e_ui = createCludesEditor(I18N.getMessage("User_includes"), {
      id: "includes",
      item: i,
    });
    const e_um = createCludesEditor(I18N.getMessage("User_matches"), {
      id: "matches",
      item: i,
    });
    const e_ue = createCludesEditor(I18N.getMessage("User_excludes"), {
      id: "excludes",
      item: i,
    });

    const i_re = HtmlUtil.createCheckbox(
      I18N.getMessage("Apply_compatibility_options_to_required_script_too"),
      {
        id: "compatopts_for_requires",
        name: i.name,
        enabled: i.compatopts_for_requires,
      },
      co,
    );
    const i_md = HtmlUtil.createCheckbox(
      I18N.getMessage("Convert_CDATA_sections_into_a_chrome_compatible_format"),
      { id: "compat_metadata", name: i.name, enabled: i.compat_metadata },
      co,
    );
    const i_fe = HtmlUtil.createCheckbox(
      I18N.getMessage("Replace_for_each_statements"),
      { id: "compat_foreach", name: i.name, enabled: i.compat_foreach },
      co,
    );
    const i_vi = HtmlUtil.createCheckbox(
      I18N.getMessage("Fix_for_var_in_statements"),
      { id: "compat_forvarin", name: i.name, enabled: i.compat_forvarin },
      co,
    );
    const i_al = HtmlUtil.createCheckbox(
      I18N.getMessage("Convert_Array_Assignements"),
      { id: "compat_arrayleft", name: i.name, enabled: i.compat_arrayleft },
      co,
    );
    const i_ts = HtmlUtil.createCheckbox(
      I18N.getMessage("Add_toSource_function_to_Object_Prototype"),
      { id: "compat_prototypes", name: i.name, enabled: i.compat_prototypes },
      co,
    );

    const i_compats = [i_re, i_md, i_fe, i_vi, i_al, i_ts];

    const section_opt = crc("div", "section", i.name, i.id, "ta_opt");
    const section_opt_head = crc(
      "div",
      "section_head",
      i.name,
      i.id,
      "head_ta_opt",
    );
    const section_opt_content = crc(
      "div",
      "section_content",
      i.name,
      i.id,
      "content_ta_opt",
    );

    section_opt_head.textContent = I18N.getMessage("Settings");
    section_opt.appendChild(section_opt_head);
    section_opt.appendChild(section_opt_content);

    const section_cludes = crc("div", "section", i.name, i.id, "ta_cludes");
    const section_cludes_head = crc(
      "div",
      "section_head",
      i.name,
      i.id,
      "head_ta_cludes",
    );
    const section_cludes_content = crc(
      "div",
      "section_content",
      i.name,
      i.id,
      "content_ta_cludes",
    );

    section_cludes_head.textContent = I18N.getMessage("Includes_Excludes");
    section_cludes.appendChild(section_cludes_head);
    section_cludes.appendChild(section_cludes_content);

    const section_compat = crc("div", "section", i.name, i.id, "ta_compat");
    const section_compat_head = crc(
      "div",
      "section_head",
      i.name,
      i.id,
      "head_ta_compat",
    );
    const section_compat_content = crc(
      "div",
      "section_content",
      i.name,
      i.id,
      "content_ta_compat",
    );

    section_compat_head.textContent = I18N.getMessage("GM_compat_options_");
    section_compat.appendChild(section_compat_head);
    section_compat.appendChild(section_compat_content);

    section_opt_content.appendChild(i_pos);
    if (!i.user_agent) {
      section_opt_content.appendChild(i_ra);
    }

    section_cludes_content.appendChild(e_oi.elem);
    section_cludes_content.appendChild(e_om.elem);
    section_cludes_content.appendChild(e_oe.elem);
    section_cludes_content.appendChild(clear_cludes);
    section_cludes_content.appendChild(e_ui.elem);
    section_cludes_content.appendChild(e_um.elem);
    section_cludes_content.appendChild(e_ue.elem);

    const h = cr("span", i.name, i.id);
    h.textContent = I18N.getMessage("Settings");
    const content = cr("div", i.name, i.id, "tab_content_settings");
    content.appendChild(section_opt);
    content.appendChild(section_cludes);

    if (!i.user_agent) {
      for (let u = 0; u < i_compats.length; u++) {
        section_compat_content.appendChild(i_compats[u].elem);
      }
      if (i.awareOfChrome) {
        for (const k in i_compats) {
          i_compats[k].input.setAttribute("disabled", "disabled");
          i_compats[k].elem.setAttribute(
            "title",
            I18N.getMessage("This_script_runs_in_Chrome_mode"),
          );
        }
      }
      content.appendChild(section_compat);
    }

    const t = { name: i.name, id: "comment", value: i.options.comment };
    const i_comment = HtmlUtil.createTextarea(null, t);
    i_comment.elem.setAttribute("class", "script_setting_wrapper");
    const save_comment = function () {
      co.apply(i_comment.textarea, []);
    };
    const i_comment_save = cr("div", i.name, i.id, "save");
    const i_comment_save_button = HtmlUtil.createButton(
      i.name,
      i.id,
      I18N.getMessage("Save"),
      save_comment,
    );
    i_comment_save.appendChild(i_comment_save_button);
    const section_comment = crc("div", "section", i.name, i.id, "ta_comment");
    const section_comment_head = crc(
      "div",
      "section_head",
      i.name,
      i.id,
      "head_ta_comment",
    );
    const section_comment_content = crc(
      "div",
      "section_content",
      i.name,
      i.id,
      "content_ta_comment",
    );

    section_comment_head.textContent = I18N.getMessage("Comment");
    section_comment.appendChild(section_comment_head);
    section_comment.appendChild(section_comment_content);
    section_comment_content.appendChild(i_comment.elem);
    section_comment_content.appendChild(i_comment_save);

    content.appendChild(section_comment);

    tabc.appendChild(content);

    const tab = tabd.appendTab(
      "script_settings_tab" + Helper.createUniqueId(i.name, i.id),
      tabh,
      tabc,
    );

    if (old) {
      return stCache["settings" + i.name];
    }

    const beforeClose = function () {
      let leafmealone = false;
      if (e_oi.beforeClose) leafmealone |= e_oi.beforeClose();
      if (e_om.beforeClose) leafmealone |= e_om.beforeClose();
      if (e_oe.beforeClose) leafmealone |= e_oe.beforeClose();
      if (e_ui.beforeClose) leafmealone |= e_ui.beforeClose();
      if (e_um.beforeClose) leafmealone |= e_um.beforeClose();
      if (e_ue.beforeClose) leafmealone |= e_ue.beforeClose();
      return leafmealone;
    };

    const e = { beforeClose };

    stCache["settings" + i.name] = e;

    return e;
  };

  var createScriptEditorTab = function (i, tabd, close_cb) {
    let saveEm = null;

    const tabh = cr("div", i.name, i.id, "script_editor_h");
    const old = tabh.inserted;

    tabh.textContent = I18N.getMessage("Editor");
    const tabc = cr("td", i.name, i.id, "script_editor_c");

    const container = crc(
      "tr",
      "editor_container p100100",
      i.name,
      i.id,
      "container",
    );
    const container_menu = crc(
      "tr",
      "editormenubar",
      i.name,
      i.id,
      "container_menu",
    );
    const container_o = crc(
      "table",
      "editor_container_o p100100 noborder",
      i.name,
      i.id,
      "container_o",
    );

    container_o.appendChild(container_menu);
    container_o.appendChild(container);
    tabc.appendChild(container_o);

    const saveEditor = function (cm, force) {
      if (saveEm) {
        if (saveEm(force)) {
          savedScript[i.id] = true;
          if (container.editor && gOptions.editor_enabled) {
            container.editor.mirror.clearHistory();
          }
        }
      }
    };

    const closeEditor = function (cm, force) {
      if (close_cb) close_cb(force);
    };

    const fullReset = function () {
      let cb = null;
      cb = function (r) {
        if (r.cleaned) {
          closeEditor();
        }
      };
      const ou = i_uu.input ? i_uu.input.oldvalue : "";
      const nu = i_uu.input ? i_uu.input.value : "";

      const options = {
        old_url: ou,
        new_url: nu,
        clean: true,
        reload: true,
      };
      saveScript(i.name, null, options, cb);
    };

    const resetScript = function () {
      const c = confirm(I18N.getMessage("Really_reset_all_changes_"));
      if (c) {
        if (container.editor && gOptions.editor_enabled) {
          // set value clears history too
          container.editor.mirror.setValue(i.code);
        } else {
          input.textContent = i.code;
        }
      }
    };

    const lintScript = function () {
      Please.wait();
      const run = function () {
        myLINT.run(container.editor);
        Please.hide();
      };
      window.setTimeout(run, 1);
    };

    const i_sc_save = HtmlUtil.createImageButton(
      i.name,
      "save",
      I18N.getMessage("Save"),
      chrome.extension.getURL("images/filesave.png"),
      saveEditor,
    );
    const i_sc_cancel = HtmlUtil.createImageButton(
      i.name,
      "cancel",
      I18N.getMessage("Editor_reset"),
      chrome.extension.getURL("images/editor_cancel.png"),
      resetScript,
    );
    const i_sc_reset = HtmlUtil.createImageButton(
      i.name,
      "reset",
      I18N.getMessage("Full_reset"),
      chrome.extension.getURL("images/script_cancel.png"),
      fullReset,
    );
    const i_sc_close = HtmlUtil.createImageButton(
      i.name,
      "close_script",
      I18N.getMessage("Close"),
      chrome.extension.getURL("images/exit.png"),
      closeEditor,
    );
    const i_sc_lint = HtmlUtil.createImageButton(
      i.name,
      "lint_script",
      I18N.getMessage("Run_syntax_check"),
      chrome.extension.getURL("images/check.png"),
      lintScript,
    );

    var i_uu = HtmlUtil.createInput(I18N.getMessage("Update_URL_"), {
      id: "file_url",
      name: i.name,
      value: i.file_url,
    });
    i_uu.input.setAttribute("class", "updateurl_input");
    i_uu.elem.setAttribute("class", "updateurl");

    var input = crc("textarea", "editorta", i.name, i.id);
    input.setAttribute("wrap", "off");
    const edit_outer = crc("td", "editor_outer", i.name, i.id, "edit");
    const edit = crc("div", "editor", i.name, i.id, "edit");
    edit_outer.appendChild(edit);

    if (!gNoWarn && container.editor) {
      if (savedScript[i.id]) {
        savedScript[i.id] = false;
        return [];
      } else if (!i.nnew) {
        // huh! script item is recreated but editor is open!
        Helper.alert(I18N.getMessage("Script_modified_in_background"));
        return [];
      }
    }

    const menu = crc("div", "editormenu", i.name, i.id, "editormenu");

    container_menu.appendChild(menu);
    container_menu.appendChild(i_uu.elem);

    if (!container.inserted) {
      edit.appendChild(input);
      container.appendChild(edit_outer);
    }

    /* if (!container.inserted) {
        var v = i.id ? "" : Helper.staticVars.invisible;
        i_pos.setAttribute('style', v);
        i_en.setAttribute('style', v);
        i_del.setAttribute('style', v);
    } */

    if (!i.system) {
      saveEm = function (force) {
        let doIt = true;
        if (gOptions.showFixedSrc && !i.user_agent) {
          doIt = confirm(
            I18N.getMessage(
              "Do_you_really_want_to_store_fixed_code_",
              I18N.getMessage("Show_fixed_source"),
            ),
          );
        }
        const value =
          container.editor && gOptions.editor_enabled
            ? container.editor.mirror.getValue()
            : input.value;
        if (doIt) {
          let cb = null;
          if (i.nnew) {
            cb = function (r) {
              if (r.installed) {
                closeEditor();
              }
            };
          }
          const ou = i_uu.input ? i_uu.input.oldvalue : "";
          const nu = i_uu.input ? i_uu.input.value : "";

          const options = {
            old_url: ou,
            new_url: nu,
            clean: false,
            reload: true,
            force,
          };
          saveScript(i.name, value, options, cb);
        }
        return doIt;
      };

      menu.appendChild(i_sc_save);
      menu.appendChild(i_sc_cancel);
    }

    if (!i.nnew) {
      menu.appendChild(i_sc_reset);
    }
    menu.appendChild(i_sc_close);

    if (!i.system && gOptions.editor_enabled) {
      menu.appendChild(i_sc_lint);
    }

    const tab = tabd.appendTab(
      "script_editor_tab" + Helper.createUniqueId(i.name, i.id),
      tabh,
      tabc,
    );

    if (old) {
      return stCache["editor" + i.name];
    }

    const onSelect = function () {
      if (container.editor) {
        container.editor.mirror.refresh();
      }
    };

    const onShow = function () {
      const textareas = tabc.getElementsByTagName("textarea");
      if (textareas.length) {
        const textarea = textareas[0];
        if (!container.editor) {
          // speed up by adding the source code on show
          if (gOptions.editor_enabled) {
            const edit = textarea.parentNode;
            edit.removeChild(textarea);
            container.editor = new MirrorFrame(
              edit,
              {
                value: i.code,
                indentUnit: Number(gOptions.editor_indentUnit),
                indentWithTabs: gOptions.editor_indentWithTabs == "tabs",
                smartIndent: gOptions.editor_tabMode != "classic",
                enterMode: gOptions.editor_enterMode,
                electricChars:
                  gOptions.editor_electricChars.toString() == "true",
                lineNumbers: gOptions.editor_lineNumbers.toString() == "true",
                extraKeys: { Enter: "newlineAndIndentContinueComment" },
                keyMap: gOptions.editor_keyMap,
                gutter: true,
                matchBrackets: true,
              },
              {
                save: saveEditor,
                close: closeEditor,
                find: function (cm) {
                  container.editor.searchText = container.editor.search();
                },
                findNext: function (cm) {
                  container.editor.searchText = container.editor.search(
                    container.editor.searchText,
                  );
                },
              },
            );
          } else {
            textarea.value = i.code;
          }
        }
      }
    };

    const e = {
      onSelect,
      onShow,
      onClose: function (force) {
        const doIt = function () {
          container.editor = null;
        };
        let uc = false;
        if (gOptions.editor_enabled) {
          if (container.editor) {
            const h = container.editor.mirror.historySize();
            if (h.undo) {
              uc = true;
            }
          }
        } else {
          uc = input.value != i.code;
        }
        if (uc && !force) {
          const c = confirm(I18N.getMessage("There_are_unsaved_changed_"));
          if (c) doIt();
          return !c;
        } else {
          doIt();
          return false;
        }
      },
    };

    stCache["editor" + i.name] = e;

    return e;
  };

  var createScriptItem = function (i, tr, tabv) {
    if (!gCallbacks[i.id]) gCallbacks[i.id] = {};

    // tab stuff for later use
    let tab;
    let scriptdetails;
    const use_icon = i.icon && !i.nativeScript;

    const sname = crc(
      "span",
      "script_name" + (i.nativeScript ? "" : " clickable"),
      i.name,
      i.id,
      "sname",
    );
    const sname_img = crc(
      "img",
      "nameNicon16 icon16",
      i.name,
      i.id,
      "sname_img",
    );

    const sname_name = crc(
      "span",
      use_icon ? "nameNname16" : "",
      i.name,
      i.id,
      "sname_name",
    );
    const hp = i.homepage
      ? i.homepage
      : i.namespace && i.namespace.search("http://") == 0
        ? i.namespace
        : null;

    sname_name.textContent =
      i.name.length > 35 ? i.name.substr(0, 35) + "..." : i.name;

    const sversion = cr("span", i.name, i.id, "sversion");
    sversion.textContent = i.version ? i.version : "";

    if (use_icon) {
      sname_img.src = i.icon;
      sname.appendChild(sname_img);
    }

    const ret = [];

    const getTD = function (i, child, app, clas) {
      if (!clas) clas = "scripttd";
      const td1 = crc("td", clas, i.name, i.id, app);
      if (child) td1.appendChild(child);
      return td1;
    };

    const closeAndRemoveTab = function () {
      if (tab) {
        tab.remove();
        tab = null;
      }
    };

    const removeScriptItem = function () {
      sname.parentNode.removeChild(sname);
      // sname_name.setAttribute('open', 'false');
    };

    const doRecreateScriptItem = function () {
      const run = function () {
        for (const o in allItems) {
          const c = allItems[o];
          if (c.id == i.id && c.name == i.name) {
            // recreate editor
            createScriptItem(c, tr, tabv);
            break;
          }
        }
      };
      window.setTimeout(run, 1);
    };

    const doClose = function (force) {
      let recreate = true;
      if (scriptdetails.beforeClose) {
        recreate = !scriptdetails.beforeClose(force);
      }
      if (scriptdetails.onClose && scriptdetails.onClose(force)) return;

      closeAndRemoveTab();
      removeScriptItem();
      if (recreate) {
        doRecreateScriptItem();
      }
    };

    const onSelect = function () {
      if (scriptdetails.onSelect && scriptdetails.onSelect()) return;
    };

    const createTab = function () {
      let tabh = null;
      if (i.nnew) {
        tabh = crc("div", "head_icon", i.name, i.id, "details_h");
        tabh.appendChild(
          HtmlUtil.createImage(i.image, i.name, i.id, "new_script_head"),
        );
      } else {
        tabh = crc("div", "", i.name, i.id, "details_h");
        tabh.textContent =
          I18N.getMessage("Edit") +
          " - " +
          (i.name.length > 25 ? i.name.substr(0, 25) + "..." : i.name);
      }

      const tabc = cr("td", i.name, i.id, "details_c");
      tab = tabv.insertTab(
        null,
        "details_" + Helper.createUniqueId(i.name, i.id),
        tabh,
        tabc,
        onSelect,
        i.nnew ? null : doClose,
      );

      scriptdetails = createScriptDetailsTabView(tab, i, tr, tabc, doClose);
    };

    const scriptClick = function (e, noselect) {
      if (!tab) createTab();
      if (scriptdetails.onShow) scriptdetails.onShow();
      tab.show();
      if ((!e || e.button != 1) && !noselect) {
        tab.select();
      }
      sname_name.setAttribute("open", "true");
    };

    if (sname_name.getAttribute("open") == "true") {
      // update currently open tabs too
      scriptClick(null, true);
    }

    const hp_script = cr("span", i.name, i.id, "hp");
    if (hp) {
      var hpa = cr("a", i.name, i.id, "hp");
      hpa.setAttribute("href", hp);
      hpa.setAttribute("target", "_blank");

      const hp_script_img = HtmlUtil.createImage(
        chrome.extension.getURL("images/home.png"),
        i.name,
        i.id,
        "hp",
        "",
      );

      hpa.appendChild(hp_script_img);
      hp_script.appendChild(hpa);
    }

    const time_between = function (date1, date2) {
      // The number of milliseconds in one day
      const ONE_MINUTE = 1000 * 60;
      const ONE_HOUR = 1000 * 60 * 60;
      const ONE_DAY = 1000 * 60 * 60 * 24;

      // Convert both dates to milliseconds
      const date1_ms = date1.getTime();
      const date2_ms = date2.getTime();

      // Calculate the difference in milliseconds
      const difference_ms = Math.abs(date1_ms - date2_ms);

      // Convert back to days and return
      const m = Math.round(difference_ms / ONE_MINUTE);
      const h = Math.round(difference_ms / ONE_HOUR);
      const d = Math.round(difference_ms / ONE_DAY);
      if (m <= 60) {
        return m + " min";
      } else if (h <= 48) {
        return h + " h";
      } else {
        return d + " d";
      }
    };

    const last_updated = cr("span", i.name, i.id, "last_updated");
    let lUp = "";
    if (i.nativeScript || !i.id || i.system) {
      lUp = "";
    } else {
      const scriptUpdate = function () {
        const t = last_updated.textContent;
        last_updated.textContent = "";
        last_updated.appendChild(
          HtmlUtil.createImage("/images/download.gif", i.name + "_down", i.id),
        );
        const done = function (up) {
          last_updated.textContent = t;
          if (up) {
            last_updated.style.color = "green";
            last_updated.title = I18N.getMessage(
              "There_is_an_update_for_0name0_avaiable_",
              i.name,
            );
            // close and remove tab
            closeAndRemoveTab();
            removeScriptItem();
            // update tab to not show the old version
            modifyScriptOption(null, false);
          } else {
            last_updated.style.color = "red";
            last_updated.title = I18N.getMessage("No_update_found__sry_");
          }
        };

        runScriptUpdates(i.id, done);
      };

      if (!sname_name.inserted) {
        last_updated.addEventListener("click", function () {
          gCb(i.id, "scriptUpdate");
        });
        last_updated.style.cursor = "pointer";
        last_updated.title = I18N.getMessage("Check_for_Updates");
      }

      gCallbacks[i.id].scriptUpdate = scriptUpdate;

      if (i.lastUpdated) {
        try {
          lUp = time_between(new Date(), new Date(i.lastUpdated));
        } catch (e) {
          console.log("o: error calculating time " + e.message);
        }
      } else {
        lUp = "?";
      }
    }
    last_updated.textContent = lUp;

    let sync = cr("div", i.name, i.id, "imported");
    let lSync = "";
    const later = function () {
      if (gOptions.sync_enabled) {
        if (i.nativeScript || !i.id || i.system) {
          lSync = "";
        } else {
          if (i.sync && i.sync.imported) {
            if (
              i.sync.imported === true ||
              i.sync.imported == SyncInfo.types.ePASTEBIN
            ) {
              lSync =
                '<img src="http://pastebin.com/favicon.ico" class="icon16" title="pastebin.com"/>';
            } else if (i.sync.imported == SyncInfo.types.eCHROMESYNC) {
              lSync =
                '<img src="http://www.google.com/images/icons/product/chrome-16.png" class="icon16" title="Google Sync"/>';
            } else {
              lSync = '<img src="images/update.png" class="icon16" />';
            }
          } else {
            lSync = '<img src="images/no.png" class="icon16" />';
          }
        }
        sync.innerHTML = lSync;
        sync = null;
      }
    };
    doneListener.push(later);

    if (i.file_url && i.file_url.trim() != "") {
      // "http://userscripts.org/scripts/source/44327.user.js".match(new RegExp("/http:\/\/userscripts\.org\/scripts\/source\/([0-9]{1,9})\.user\.js/"));
      const usoid = i.file_url.match(
        new RegExp(
          "http://userscripts.org/scripts/source/([0-9]{1,9}).user.js",
        ),
      );
      if (usoid && usoid.length == 2) {
        var hpa = cr("a", i.name, i.id, "hp");
        hpa.setAttribute(
          "href",
          "http://userscripts.org/scripts/show/" + usoid[1],
        );
        hpa.setAttribute("target", "_blank");

        const uso_script_img = HtmlUtil.createImage(
          Helper.staticVars.USOicon,
          i.name,
          i.id,
          "uso",
          "",
        );

        hpa.appendChild(uso_script_img);
        hp_script.appendChild(hpa);
      }
    }

    gCallbacks[i.id].deleteScript = function (e, dontask) {
      if (i.nativeScript) {
        var c =
          dontask || confirm(I18N.getMessage("Really_delete_this_extension__"));
        if (c == true) {
          modifyNativeScriptOption(i.name, "installed", !dontask);
          tr.parentNode.removeChild(tr);
        }
      } else {
        var c =
          dontask || confirm(I18N.getMessage("Really_delete_this_script__"));
        if (c == true) {
          const options = { reload: !dontask };
          saveScript(i.name, null, options);
          tr.parentNode.removeChild(tr);
        }
      }
    };

    const img_delete = HtmlUtil.createImage(
      chrome.extension.getURL("images/delete.png"),
      i.nativeScript ? i.id : i.name,
      "delete",
      "delete",
      I18N.getMessage("Delete"),
      function () {
        gCb(i.id, "deleteScript");
      },
    );

    const createEnableImageTD = function () {
      const img = i.enabled
        ? chrome.extension.getURL("images/greenled.png")
        : chrome.extension.getURL("images/redled.png");

      const td1 = getTD(i, sname, "script_td05", "scripttd_enable");
      td1.setAttribute("class", "imagetd");

      const en = function () {
        gCb(i.id, i.nativeScript ? "switchNativeEnabled" : "switchEnabled");
      };

      const pt =
        i.position > 0
          ? i.position < 10
            ? " " + i.position
            : i.position
          : null;
      let g = HtmlUtil.createImageText(
        img,
        i.nativeScript ? i.id : i.name,
        "enabled",
        "enabled",
        i.enabled ? I18N.getMessage("Enabled") : I18N.getMessage("Disabled"),
        en,
        i.nativeScript ? "" : pt,
      );

      gCallbacks[i.id].switchEnabled = function (e, o, reload) {
        if (o === undefined) o = !i.enabled;
        modifyScriptOption(i.name, "enabled", o, reload);
      };
      gCallbacks[i.id].switchNativeEnabled = function (e, o, reload) {
        if (o === undefined) o = !i.enabled;
        modifyNativeScriptOption(i.id, "enabled", o, reload);
      };

      td1.appendChild(g);
      g = null;

      return td1;
    };

    if (!sname.inserted && !i.nativeScript) {
      sname.addEventListener("click", scriptClick);
    }

    sname.appendChild(sname_name);
    const sname_td = getTD(i, sname, "script_td1", "scripttd_name");
    sname_td.title = i.description ? i.name + "\n\n" + i.description : i.name;

    const sel_td = getTD(i, sname, "script_td0", "scripttd_sel");
    if (i.id && !i.system) {
      sel_td.appendChild(getSingleMultiSelectCheckbox(i));
    }

    ret.push(sel_td);
    ret.push(createEnableImageTD());
    ret.push(sname_td);
    ret.push(getTD(i, sversion, "script_td24", "scripttd"));
    ret.push(getTD(i, createTypeImageFromScript(i), "script_td25", "scripttd"));
    ret.push(getTD(i, sync, "script_td26", "scripttd"));
    ret.push(getTD(i, createImagesFromScript(i), "script_td3"));
    ret.push(getTD(i, createFeatureImagesFromScript(i), "script_td4"));
    ret.push(getTD(i, hp_script, "script_td5"));
    ret.push(getTD(i, last_updated, "script_td6"));
    ret.push(getTD(i, createPosImagesFromScript(i), "script_td7"));
    ret.push(getTD(i, i.id && !i.system ? img_delete : null, "script_td8"));

    for (let o = ret.length; o < 10; o++) {
      ret.push(cr("td", i.name, i.id, "script_filler_" + o));
    }

    if (i.nnew) {
      const show = function () {
        scriptClick(null, true);
      };
      window.setTimeout(show, 100);
      if (!initialized && gArgs.open === "0") {
        window.setTimeout(scriptClick, 1000);
      }
    } else if (gArgs.open) {
      if (i.id === gArgs.open) {
        window.setTimeout(scriptClick, 1000);
      }
    }

    return ret;
  };

  var createTypeImageFromScript = function (i) {
    const span = cr("span", i.name, i.id, "pos_type", true);

    if (!i.id) return span;

    if (i.user_agent) {
      var m = HtmlUtil.createImage(
        "images/user_agent.png",
        i.name,
        i.id,
        "user_agent",
        I18N.getMessage("This_only_changes_the_user_agent_string"),
      );
      span.appendChild(m);
    } else if (i.nativeScript) {
      var m = HtmlUtil.createImage(
        i.icon,
        i.name,
        i.id,
        "chrome_ext",
        I18N.getMessage("This_is_a_chrome_extension"),
      );
      span.appendChild(m);
    } else if (i.userscript) {
      var m = HtmlUtil.createImage(
        "images/txt.png",
        i.name,
        i.id,
        "user_agent",
        I18N.getMessage("This_is_a_userscript"),
      );
      span.appendChild(m);
    }

    return span;
  };

  var createFeatureImagesFromScript = function (i) {
    const span = cr("span", i.name, i.id, "pos_features", true);

    if (!i.id) return span;

    if (i.system) {
      var m = HtmlUtil.createImage(
        chrome.extension.getURL("images/lock.png"),
        i.name,
        i.id,
        "lock",
        I18N.getMessage("This_is_a_system_script"),
      );
      span.appendChild(m);
    }

    if (i.awareOfChrome || i.nativeScript) {
      var m = HtmlUtil.createImage(
        "http://www.google.com/images/icons/product/chrome-16.png",
        i.name,
        i.id,
        "chrome_mode",
        I18N.getMessage("This_script_runs_in_Chrome_mode"),
      );
      span.appendChild(m);
    }

    if (i.nativeScript) return span;

    let https_found = false;
    const https_check = { includes: true, matches: true };
    for (var k in https_check) {
      if (!i[k]) continue;
      for (let o = 0; o < i[k].length; o++) {
        if (
          i[k][o] &&
          (i[k][o].search("https") != -1 || i[k][o].search(/^\*:\/\//) != -1)
        ) {
          var m = HtmlUtil.createImage(
            chrome.extension.getURL("images/halfencrypted.png"),
            i.name,
            i.id,
            "encrypt",
            I18N.getMessage("This_script_has_access_to_https_pages"),
          );
          span.appendChild(m);
          https_found = true;
          break;
        }
      }
      if (https_found) break;
    }

    if (i.user_agent) return span;

    if (i.code.search("GM_xmlhttpRequest") != -1) {
      var m = HtmlUtil.createImage(
        chrome.extension.getURL("images/web.png"),
        i.name,
        i.id,
        "web",
        I18N.getMessage("This_script_has_full_web_access"),
      );
      span.appendChild(m);
    }
    if (i.code.search("GM_setValue") != -1) {
      var m = HtmlUtil.createImage(
        chrome.extension.getURL("images/db.png"),
        i.name,
        i.id,
        "db",
        I18N.getMessage("This_script_stores_data"),
      );
      span.appendChild(m);
    }
    if (i.code.search("unsafeWindow") != -1) {
      var m = HtmlUtil.createImage(
        chrome.extension.getURL("images/resources.png"),
        i.name,
        i.id,
        "resource",
        I18N.getMessage("This_script_has_access_to_webpage_scripts"),
      );
      span.appendChild(m);
    }
    for (var k in i.options) {
      if (k.search("compat_") != -1 && i.options[k]) {
        var m = HtmlUtil.createImage(
          chrome.extension.getURL("images/critical.png"),
          i.name,
          i.id,
          "crit",
          I18N.getMessage("One_or_more_compatibility_options_are_set"),
        );
        span.appendChild(m);
        break;
      }
    }

    return span;
  };

  var createPosImagesFromScript = function (i) {
    const span = cr("span", i.name, i.id, "pos_images", true);

    if (!i.id || i.nativeScript) return span;

    const up2 = HtmlUtil.createImage(
      chrome.extension.getURL("images/2uparrow.png"),
      i.name,
      "position",
      "2up",
      "2 Up",
      function () {
        modifyScriptOption(this.name, this.key, 1);
      },
    );
    const up1 = HtmlUtil.createImage(
      chrome.extension.getURL("images/1downarrow.png"),
      i.name,
      "position",
      "1up",
      "1 Up",
      function () {
        modifyScriptOption(this.name, this.key, i.position - 1);
      },
    );
    const down1 = HtmlUtil.createImage(
      chrome.extension.getURL("images/1downarrow1.png"),
      i.name,
      "position",
      "1down",
      "1 Down",
      function () {
        modifyScriptOption(this.name, this.key, i.position + 1);
      },
    );
    const down2 = HtmlUtil.createImage(
      chrome.extension.getURL("images/2downarrow.png"),
      i.name,
      "position",
      "2down",
      "2 Down",
      function () {
        modifyScriptOption(this.name, this.key, i.positionof);
      },
    );
    if (i.position > 1) {
      if (false) span.appendChild(up2);
      span.appendChild(up1);
    }
    if (i.position < i.positionof) {
      span.appendChild(down1);
      if (false) span.appendChild(down2);
    }

    return span;
  };

  var createImagesFromScript = function (i) {
    let span = cr("span", i.name, i.id, "site_images");
    let oldspan = null;
    if (span.inserted) {
      // cache image sif possible, but remove not used though
      oldspan = span;
      oldspan.setAttribute("id", oldspan.id + "foo");
      span = cr("span", i.name, i.id, "site_images");
    }

    const getInfo = function (inc) {
      inc = inc.replace(/^\*:\/\//, "http://");
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

    if (i.includes || i.matches) {
      let d = 0;
      const incl = i.includes.length ? i.includes : i.matches;
      for (let o = 0; o < incl.length; o++) {
        const inc = incl[o];
        if (!inc) {
          console.log(
            "o: Warn: script '" +
              i.name +
              "' has invalid include (index: " +
              o +
              ")",
          );
          continue; // issue 93 ?!
        }

        if (
          inc.search(/htt(ps|p):\/\/(\*\/\*|\*)*$/) != -1 ||
          inc.search(/\*:\/\/(\*\/\*|\*)*$/) != -1 ||
          inc == "*"
        ) {
          var img = HtmlUtil.createImage(
            chrome.extension.getURL("images/web.png"),
            i.name,
            i.id,
            inc,
            inc,
          );
          span.appendChild(img);
          break;
          continue;
        }

        const inf = getInfo(inc);
        if (inf == null) {
          var img = HtmlUtil.createFavicon("?", i.name, i.id, inc, inc);
          if (img.inserted && oldspan) {
            img.parentNode.removeChild(img);
          }
          span.appendChild(img);
          continue;
        }

        let drin = false;
        for (let p = 0; p < o; p++) {
          const pinc = incl[p];
          if (pinc) {
            const pinf = getInfo(pinc);
            if (pinf == null) continue;
            if (pinf.dom == inf.dom) {
              drin = true;
              break;
            }
          }
        }
        if (!drin) {
          let tld = "com";
          let predom = "";
          if (inf.tld != "*" && inf.tld != "tld") tld = inf.tld;
          if (inf.predom.length) predom = inf.predom.join(".") + ".";
          const ico2 = (
            "chrome://favicon/http://" +
            predom +
            inf.dom +
            "." +
            tld +
            "/"
          ).replace(/\*/g, "");
          const ico1 = (
            "http://" +
            predom +
            inf.dom +
            "." +
            tld +
            "/favicon.ico"
          ).replace(/\*/g, "");
          let ico = [ico1, ico2];

          if (
            ico1.search("http://userscripts.org/") == 0 ||
            ico1.search("http://userscripts.com/") == 0
          ) {
            ico = Helper.staticVars.USOicon;
          }
          var img = HtmlUtil.createFavicon(ico, i.name, i.id, inc, inc);
          if (img.inserted && oldspan) {
            img.parentNode.removeChild(img);
          }
          span.appendChild(img);
          d++;
        }
        if (d > 7) {
          const tbc = crc("span", i.name, i.id, "tbc");
          tbc.textContent = "...";
          if (tbc.inserted && oldspan) {
            tbc.parentNode.removeChild(tbc);
          }

          span.appendChild(tbc);
          break;
        }
      }
    }

    if (oldspan) {
      oldspan.parentNode.removeChild(oldspan);
    }

    return span;
  };

  /* ########### MultiSelect ############## */

  const getMultiSelectedCnt = function () {
    const all = document.getElementsByName("scriptselectors");
    let c = 0;
    for (let a = 0; a < all.length; a++) {
      if (all[a].checked) c++;
    }
  };

  const initMultiSelect = function () {
    let mode = 0;
    gCallbacks.multiselect = {};

    gCallbacks.multiselect.single_click = function () {
      let m = 0;

      const all = document.getElementsByName("scriptselectors");
      let all_native = true;
      let any_native = false;
      let found_native = false;
      let all_scripts = true;
      let any_script = false;
      let found_scripts = false;

      for (let a = 0; a < all.length; a++) {
        if (all[a].s_type == "n") {
          found_native = true;
          all_native = all_native && all[a].checked;
          any_native = any_native || all[a].checked;
        } else if (all[a].s_type == "s") {
          found_scripts = true;
          all_scripts = all_scripts && all[a].checked;
          any_script = any_script || all[a].checked;
        }
      }

      if (found_native) {
        if (all_native && !any_script) {
          m = 1;
        } else if (all_scripts && !any_native && any_script) {
          m = 2;
        }
      } else if (found_scripts && all_scripts) {
        m = 3;
      }
      if (m != mode) {
        mode = m;
        const ch = cr("input", "sms", "all");
        ch.checked = m != 0;
      }
    };

    gCallbacks.multiselect.un_selectAll = function () {
      if (++mode > 3) mode = 0;
      let any_script = false;

      const all = document.getElementsByName("scriptselectors");
      for (let a = 0; a < all.length; a++) {
        if (a == 0 && (mode == 1 || mode == 3) && all[a].s_type == "s") {
          // first element shows that no native scripts are installed :(
          if (++mode > 3) mode = 0;
        }
        any_script |= all[a].s_type == "s";

        all[a].checked =
          mode == 3 ||
          (mode == 1 && all[a].s_type == "n") ||
          (mode == 2 && all[a].s_type == "s");
      }
      if (mode > 1 && !any_script) mode = 0;

      this.checked = mode != 0;
    };
  };

  var getSingleMultiSelectCheckbox = function (i) {
    const input = cr("input", i.name, i.id, "sel");
    input.type = "checkbox";
    input.s_id = i.id;
    input.name = "scriptselectors";
    input.s_type = i.nativeScript ? "n" : "s";
    if (!input.inserted) {
      input.addEventListener("click", function () {
        gCallbacks.multiselect.single_click();
      });
    }
    return input;
  };

  var createMultiSelectActions = function (i) {
    const input = cr("input", "sms", "all", null, true);
    input.type = "checkbox";
    input.mode = 0;
    input.addEventListener("click", gCallbacks.multiselect.un_selectAll);
    let value = 0;

    const select = [
      { name: I18N.getMessage("__Please_choose__"), value: 0 },
      { name: I18N.getMessage("Enable"), value: 1 },
      { name: I18N.getMessage("Disable"), value: 2 },
      { name: I18N.getMessage("Trigger_Update"), value: 5 },
      { name: I18N.getMessage("Remove"), value: 6 },
    ];

    const e = { value: 0, id: "sms", name: "select" };
    const enable_button = function () {
      if (this.value == 0) {
        bu.setAttribute("disabled", "true");
      } else {
        bu.removeAttribute("disabled");
      }
      value = this.value;
    };
    const dd = HtmlUtil.createDropDown(
      I18N.getMessage("Apply_this_action_to_the_selected_scripts"),
      e,
      select,
      enable_button,
    );
    dd.elem.setAttribute("class", "float");

    const run = function () {
      if (value == 0) {
        console.log("option: ?!?!");
        return;
      }

      if (value == 6) {
        if (!confirm(I18N.getMessage("Really_delete_the_selected_items_"))) {
          return;
        }
      }

      const alle = document.getElementsByName("scriptselectors");
      const all = [];
      // alle is resized on node removal -> copy
      for (var a = 0; a < alle.length; a++) {
        all.push(alle[a]);
      }

      let fn;
      let reload = false;
      let reloadt = 100;
      for (var a = 0; a < all.length; a++) {
        if (!all[a].checked) continue;

        if (value == 1 || value == 2) {
          fn = all[a].s_type == "n" ? "switchNativeEnabled" : "switchEnabled";
          gCb(all[a].s_id, fn, null, value == 1, false);
          reload = true;
        } else if (value == 5) {
          fn = "scriptUpdate";
          gCb(all[a].s_id, fn);
        } else if (value == 6) {
          fn = "deleteScript";
          gCb(all[a].s_id, fn, null, true);
          reload = true;
          reloadt = 1500;
        }
      }

      if (reload) {
        Please.wait(I18N.getMessage("Please_wait___"));
        window.setTimeout(function () {
          modifyScriptOption(null, false, null, true);
        }, reloadt);
      }
    };
    var bu = HtmlUtil.createButton(
      "MultiSelectButton",
      "button",
      I18N.getMessage("Start"),
      run,
    );
    bu.setAttribute("disabled", "true");
    bu.setAttribute(
      "style",
      "height: 19px; top: 2px; position: relative; padding-top: -1px;",
    );

    const actions = cr("div", i.name, i.id, "actions");
    actions.appendChild(dd.elem);
    actions.appendChild(bu);

    return { selAll: input, actionBox: actions };
  };
  initMultiSelect();

  /* ########### extension messaging  ############## */
  var myLINT = {
    options: {
      maxerr: 999,
      newcap: true,
      es5: true,
      sloppy: true,
      browser: true,
      white: true,
      plusplus: true,
      nomen: true,
      continue: true,
      todo: true,
      eqeq: true,
      passfail: false,
      unparam: true,
      devel: true,
    },

    JSLINT_GLOBALS: [
      "CDATA",
      "XPathResult",
      "xpath",
      "uneval",
      "escape",
      "unescape",
      "console",
      "JSON",
      "TM_info",
      "GM_info",
      "TM_addStyle",
      "TM_deleteValue",
      "TM_listValues",
      "TM_getValue",
      "TM_log",
      "TM_registerMenuCommand",
      "TM_openInTab",
      "TM_setValue",
      "TM_addValueChangeListener",
      "TM_removeValueChangeListener",
      "TM_xmlhttpRequest",
      "TM_getTab",
      "TM_saveTab",
      "TM_getTabs",
      "TM_installScript",
      "TM_runNative",
      "TM_execUnsafe",
      "TM_notification",
      "TM_getResourceText",
      "TM_getResourceURL",
      "GM_addStyle",
      "GM_deleteValue",
      "GM_listValues",
      "GM_getValue",
      "GM_log",
      "GM_registerMenuCommand",
      "GM_openInTab",
      "GM_setValue",
      "GM_addValueChangeListener",
      "GM_removeValueChangeListener",
      "GM_xmlhttpRequest",
      "GM_getTab",
      "GM_saveTab",
      "GM_getTabs",
      "GM_installScript",
      "GM_runNative",
      "GM_setClipboard",
      "GM_execUnsafe",
      "GM_notification",
      "GM_getResourceText",
      "GM_getResourceURL",
    ],

    cleanGutters: function (mirror, gutters) {
      for (const i in gutters) {
        if (!gutters.hasOwnProperty(i)) continue;
        mirror.clearMarker(Number(i) - 1);
        if (gutters[i].marks) {
          for (let k = 0; k < gutters[i].marks.length; k++) {
            gutters[i].marks[k].clear();
          }
        }
      }
    },

    setGutters: function (mirror, gutters) {
      for (const i in gutters) {
        if (!gutters.hasOwnProperty(i)) continue;
        const os = gutters[i];
        let level = 0;
        let img = null;
        const text = [];
        os.marks = [];

        for (let k = 0; k < os.length; k++) {
          let t = "";
          const o = os[k];

          if (o.stop) {
            img = "no";
            level = 3;
          } else if (o.warn) {
            if (level < 1) {
              img = "critical";
              level = 1;
            }
            t = I18N.getMessage("Warning") + ": ";
          } else if (o.info) {
            if (level == 0) {
              img = "info";
            }
            t = I18N.getMessage("Info") + ": ";
          } else {
            if (level < 2) {
              img = "error";
              level = 2;
              t = I18N.getMessage("Error") + ": ";
            }
          }

          text.push((os.length > 1 ? t : "") + o.text.replace(/\"/g, '\\"'));
          if (!o.stop) {
            os.marks.push(
              mirror.markText(
                { line: o.line - 1, ch: o.character - 1 },
                { line: o.line - 1, ch: o.character - 1 + o.evle },
                "CodeMirror-highlight-" + img,
              ),
            );
          }
        }

        const hint =
          '<span class="editor_gutter" title="' +
          text.join("\n\n") +
          '"><span width="10px">' +
          '<img class="editor_gutter_img" src="images/' +
          img +
          '.png"/>&nbsp;&nbsp;</span>%N%</span>';
        mirror.setMarker(Number(i) - 1, hint);
      }

      return gutters;
    },

    run: function (editor) {
      if (editor.oldGutters) {
        myLINT.cleanGutters(editor.mirror, editor.oldGutters);
      }

      const all = editor.mirror.getValue();
      let JS = null;
      try {
        JS = JSLINT;
      } catch (je) {}

      const globals =
        "/*global " + myLINT.JSLINT_GLOBALS.join(": true, ") + "*/\n";
      const result = JS ? JS(globals + all, myLINT.options) : true;

      if (result) {
      } else {
        const gutter = {};
        for (const i in JSLINT.errors) {
          const error = JSLINT.errors[i];
          if (error && error.line > 1 /* globals statement */) {
            let l = error.line - 1;
            let cara = error.character;
            let tabs = 0;
            const detectTabs =
              error.reason.search("Mixed spaces and tabs") != -1;
            let len = 0;
            try {
              const fixTabs = !!error.evidence && !detectTabs;
              if (fixTabs) {
                for (let p = 0, cp = 0; p < cara && cp < cara; p++, cp++) {
                  if (error.evidence.charCodeAt(p) == 9) {
                    cp += gOptions.editor_indentUnit - 1;
                    tabs += 1;
                  }
                }
              }

              const addtabschars = tabs * (gOptions.editor_indentUnit - 1);
              cara -= addtabschars;
              if (fixTabs || detectTabs) {
                const t =
                  error.evidence.length > cara
                    ? error.evidence.substr(cara - 1)
                    : "";
                const m = detectTabs
                  ? t.match(/([ \t])*/)
                  : t.match(/([a-zA-Z0-9_])*/);
                len = m.length ? m[0].length : 0;
              }
            } catch (e) {
              console.log("jslint: error parsing source " + e.message);
            }
            const evle = len || 1;

            const o = {
              line: l,
              stop: error.reason.search("Stopping") == 0,
              info:
                detectTabs ||
                error.reason.search("Combine this with the previous 'var'") !=
                  -1 ||
                error.reason.search("Expected '{' and instead saw") != -1 ||
                error.reason.search("Move 'var' declarations to the top") != -1,
              warn:
                error.id != "(error)" ||
                error.reason.search("used before it was defined") != -1,
              character: cara,
              evle,
              text: error.reason.replace(/.$/, ""),
            };
            if (o.stop) l++;
            if (!gutter[l]) gutter[l] = [];
            gutter[l].push(o);
          }
        }
        editor.oldGutters = myLINT.setGutters(editor.mirror, gutter);
      }
    },
  };

  /* ########### extension messaging  ############## */
  let reCreateTo = null;
  let reCreateArgs = null;

  const scheduleReCreate = function (items, noWarn) {
    if (reCreateTo != null) {
      window.clearTimeout(reCreateTo);
      reCreateTo = null;
      scheduleReCreate(
        items || reCreateArgs.items,
        noWarn || reCreateArgs.noWarn,
      );
    } else {
      reCreateArgs = { items, noWarn };
      reCreateTo = window.setTimeout(function () {
        reCreateTo = null;
        createOptionsMenu(reCreateArgs.items, reCreateArgs.noWarn);
        reCreateArgs = null;
      }, 50);
    }
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
      console.log("lU: " + e.message);
    }
  };

  var saveScript = function (name, code, options, cb) {
    if (options.reload === undefined) options.reload = true;
    // options { old_url, new_url, clean, reload }

    try {
      const ou = options.old_url ? options.old_url : "";
      const nu =
        options.new_url && options.new_url != options.old_url
          ? options.new_url
          : "";

      chrome.extension.sendMessage(
        {
          method: "saveScript",
          name,
          code,
          clean: options.clean,
          force: options.force,
          file_url: ou,
          force_url: nu,
          reload: options.reload,
        },
        function (response) {
          if (response.items) {
            scheduleReCreate(response.items, name && true);
          }
          if (!code && options.reload) {
            Please.hide();
          }
          if (cb) {
            cb(response);
          }
        },
      );
      Please.wait(I18N.getMessage("Please_wait___"));
    } catch (e) {
      console.log("sS: " + e.message);
    }
  };

  var setOption = function (name, value, ignore) {
    try {
      chrome.extension.sendMessage(
        { method: "setOption", name, value },
        function (response) {
          if (!ignore) {
            scheduleReCreate(response.items);
          }
        },
      );
      Please.wait(I18N.getMessage("Please_wait___"));
    } catch (e) {
      console.log("sO: " + e.message);
    }
  };

  var buttonPress = function (name, value, ignore, reload) {
    try {
      chrome.extension.sendMessage(
        { method: "buttonPress", name },
        function (response) {
          if (reload) {
            window.location.reload();
          } else if (!ignore) {
            scheduleReCreate(response.items);
          } else {
            Please.hide();
          }
        },
      );
      Please.wait(I18N.getMessage("Please_wait___"));
    } catch (e) {
      console.log("sO: " + e.message);
    }
  };

  var modifyScriptOptions = function (name, options, reload, reorder) {
    if (V) console.log("run modifyScriptOptions");
    if (reload == undefined) reload = true;
    try {
      const s = { method: "modifyScriptOptions", name, reload, reorder };
      for (const k in options) {
        if (!options.hasOwnProperty(k)) continue;
        s[k] = options[k];
      }

      if (V) console.log("modifyScriptOptions sendReq");
      chrome.extension.sendMessage(s, function (response) {
        if (response.items) {
          scheduleReCreate(response.items, name && true);
        }
      });
      Please.wait(I18N.getMessage("Please_wait___"));
    } catch (e) {
      console.log("mSo: " + e.message);
    }
  };

  var modifyScriptOption = function (name, id, value, reload, reorder) {
    if (V) console.log("run modifyScriptOption");
    if (reload === undefined) reload = true;
    try {
      const s = { method: "modifyScriptOptions", name, reload, reorder };
      if (id && id != "") s[id] = value;

      if (V) console.log("modifyScriptOption sendReq");
      chrome.extension.sendMessage(s, function (response) {
        if (response) {
          if (response.i18n) {
            I18N.setLocale(response.i18n);
          }
          if (response.items) {
            scheduleReCreate(response.items, name && true);
          }
        }
      });
      Please.wait(I18N.getMessage("Please_wait___"));
    } catch (e) {
      console.log("mSo: " + e.message);
    }
  };

  var modifyNativeScriptOption = function (nid, id, value, reload) {
    if (V) console.log("run modifyNativeScriptOption");
    if (reload === undefined) reload = true;
    try {
      const s = {
        method: "modifyNativeScript",
        nid,
        actionid: id,
        value,
        reload,
      };

      if (V) console.log("modifyNativeScriptOption sendReq");
      chrome.extension.sendMessage(s, function (response) {
        if (response.items) {
          scheduleReCreate(response.items, name && true);
        }
      });
      Please.wait(I18N.getMessage("Please_wait___"));
    } catch (e) {
      console.log("mSo: " + e.message);
    }
  };

  var runScriptUpdates = function (id, cb) {
    try {
      const done = function (response) {
        if (cb) cb(response.updatable);
      };
      chrome.extension.sendMessage(
        { method: "runScriptUpdates", scriptid: id },
        done,
      );
    } catch (e) {
      console.log("rSu: " + e.message);
    }
  };

  chrome.extension.onMessage.addListener(
    function (request, sender, sendResponse) {
      if (V) console.log("o: method " + request.method);
      if (request.method == "updateOptions") {
        scheduleReCreate(request.items);
        sendResponse({});
      } else if (request.method == "confirm") {
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
            "o: " + I18N.getMessage("Unknown_method_0name0", request.method),
          );
        }
        return false;
      }

      return true;
    },
  );

  if (V) console.log("Register request listener (options)");

  const domListener = function () {
    window.removeEventListener("DOMContentLoaded", domListener, false);
    window.removeEventListener("load", domListener, false);

    const suc = function () {
      modifyScriptOption(null, false, null, true);
    };

    const fail = function () {
      if (
        confirm(
          I18N.getOriginalMessage(
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
})();
