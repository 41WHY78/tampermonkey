/**
 * @filename compat.js
 * @author Jan Biniok <jan@biniok.net>
 * @licence GPL v3
 */

(function () {
  Registry.require("helper");

  const Helper = Registry.get("helper");

  var compaMo = {
    mkCompat: function (src, script, test) {
      if (script) {
        if (script.options.compat_metadata || test) {
          src = compaMo.unMetaDataify(src);
        }
        if (script.options.compat_foreach || test) src = compaMo.unEachify(src);
        if (script.options.compat_arrayleft || test) {
          src = compaMo.unArrayOnLeftSideify(src);
        }
        if (script.options.compat_forvarin /* || test */) {
          src = compaMo.fixForVarXStatements(src);
        }
      }
      /* it's a shame, but TM does not support "strict mode" scripts at the moment :(
           setID + getID are not working due to callee restrictions tmf:322 */
      src = src.replace('"use strict"', '"use\u00A0strict"');

      return src;
    },

    findPrototypes: function (src) {
      if (src.search(Helper.escapeForRegExp(".toSource(")) != -1) {
        return true;
      }
      const fns = [
        "indexOf",
        "lastIndexOf",
        "filter",
        "forEach",
        "every",
        "map",
        "some",
        "slice",
      ];
      for (const k in fns) {
        if (src.search(Helper.escapeForRegExp("Array." + fns[k] + "(")) != -1) {
          return true;
        }
      }
    },

    // for (var handler in events[ type ] )
    fixForVarXStatements: function (src) {
      src = src.replace(/for[ \t.]*\([ \t.]*var/gi, "for (var");

      const t1 = "for (";
      const t3 = ")";

      const arr = src.split(t1);

      for (let i = 1; i < arr.length; i++) {
        const a = arr[i];
        const e = a.search(Helper.escapeForRegExp(t3));
        if (e == -1) continue;
        const f = a.substr(0, e);
        if (f.search(/[ \r\n]*in[ \r\n]/) == -1) continue;
        const aw = f.match(
          /^[ \r\n]*(?:var[ \r\n\t]*)*(.*?)[ \r\n]* in [ \r\n]*(.*?)$/,
        );

        if (aw == null || aw.length < 3) continue;
        const varname = aw[1];
        const inname = "in";
        const arrname = aw[2];

        /*
            var m = f.split(' ');
            var varname = null;
            var inname = null;
            var arrname = null;
            for (var r in m) {
                if (m[r] != '') {
                    if (!varname) {
                        varname = m[r];
                    } else if (!inname) {
                        inname = m[r];
                    } else if (!arrname) {
                        arrname = m[r];
                    }
                }
            } */

        if (!varname || !arrname || inname != "in" || e > a.length) {
          continue;
        }
        const p = a.search(/\)[\n\r\t ]*\{/);
        if (p != e) {
          continue;
          /* if (Helper.getStringBetweenTags(arr[i], ')', '\n').trim() == "") {
                   arr[i] = arr[i].replace(')','){').replace(/([\n|\r].*[\n|\r|;])/, '$1}');
                   } else {
                   arr[i] = arr[i].replace(')','){').replace(/([\n|\r|;])/, '}$1');
                   } */
        }
        let b = "";
        b +=
          "{ " +
          "    if (!" +
          arrname +
          ".hasOwnProperty(" +
          varname +
          ")) continue;";
        arr[i] = arr[i].replace("{", b);
      }

      return arr.join(t1);
    },

    /*
     * unArrayOnLeftSideify(src)
     *
     * replaces i.e
     *
     *  [, name, value] = line.match(/\/\/ @(\S+)\s*(.*)/);
     *
     * by
     *
     *  var __narf6439 = line.match(/\/\/ @(\S+)\s*(.*)/);;
     *  name = __narf6439[1];
     *  value = __narf6439[2];
     *  ...
     *
     */
    unArrayOnLeftSideify: function (src) {
      const lines = src.split("\n");

      for (const k in lines) {
        const line = lines[k];
        const wosp = line.replace(/[\t ]/g, "");
        let a1 = wosp.search("]=");
        const a2 = wosp.search("]==");
        const k1 = wosp.search("\\[");
        if (k1 != -1) {
          const ee = wosp.substr(0, k1);
          // seems to be a valid array assignement like a[0] = 'blub';
          if (ee != "") a1 = -1;
        }

        if (a1 != -1 && a1 != a2) {
          let nl = "";
          // stupid hack detected!
          const ie = line.search("=");
          const value = line.substr(ie + 1, line.length - ie - 1);
          const randvar = "__narf" + k.toString();

          nl += "var " + randvar + " = " + value + ";\n";

          const vars = Helper.getStringBetweenTags(wosp, "[", "]=");
          const vara = vars.split(",");

          for (const e in vara) {
            const v = vara[e];
            if (v.trim() != "") nl += v + " = " + randvar + "[" + e + "];\n";
          }
          lines[k] = nl;
        }
      }

      return lines.join("\n");
    },

    /*
     * unEachify(src)
     *
     * replaces i.e
     *
     *  for each (mod in mods) {;
     *
     * by
     *
     *  for (var k in mods) {;
     *     mod = mods[k];
     *     ...
     *
     */
    unEachify: function (src) {
      src = src.replace(/for each[ \t]*\(/gi, "for each(");

      const t1 = "for each";
      const t2 = "(";
      const t3 = ")";

      const arr = src.split(t1);

      for (let i = 1; i < arr.length; i++) {
        const a = arr[i];
        if (a.substr(0, 1) != "(") {
          arr[i] = " each" + arr[i];
          continue;
        }
        const f = Helper.getStringBetweenTags(a, t2, t3);
        const m = f.split(" ");
        let varname = null;
        let inname = null;
        let arrname = null;
        for (const e in m) {
          if (m[e] != "" && m[e] != "var") {
            if (!varname) {
              varname = m[e];
            } else if (!inname) {
              inname = m[e];
            } else if (!arrname) {
              arrname = m[e];
            }
          }
        }
        if (!varname || !arrname) {
          arr[i] = " each" + arr[i];
          continue;
        }

        const n = "var __kk in " + arrname;
        let b = "";
        // filter the Array.prototype.filter function :-/
        b += "{\n" + "    if (!" + arrname + ".hasOwnProperty(__kk)) continue;";
        b += " \n" + "    var " + varname + " = " + arrname + "[__kk];";

        arr[i] = arr[i].replace(Helper.escapeForRegExp(f), n).replace("{", b);
      }

      return arr.join("for");
    },

    /*
     * unMetaDataify(src)
     *
     * replaces i.e
     *
     *   var code = <><![CDATA[
     *   if (this._name == null || refresh) {
     *     this._name = this.name();
     *   }
     *   ret = this._name;
     *   ]]></>.toString();
     *
     * by
     *
     *   var code = ("\n" +
     *   "    if (this._name == null || refresh) {\n" +
     *   "      this._name = this.name();\n" +
     *   "    }\n" +
     *   "    ret = this._name;\n" +
     *   "").toString();
     *   ...
     *
     */
    unMetaDataify: function (src) {
      let s = src;
      let t = src;
      const t1 = "<><![CDATA[";
      const t2 = "]]></>";
      let pos = s.search(Helper.escapeForRegExp(t1));
      while (pos != -1) {
        const p = s.substr(0, pos);
        const lc = p.lastIndexOf("\n");
        let cc = "";
        if (lc != -1) cc = p.substr(lc, p.length - lc);
        s = s.substr(pos, s.length - pos);

        // check if commented
        const c1 = cc.search("\\/\\*");
        const c2 = cc.search("\\/\\/");
        if (c1 == -1 && c2 == -1) {
          const z = Helper.getStringBetweenTags(s, t1, t2);
          var x;
          x = z.replace(/\"/g, '\\"').replace(/\n/g, '\\n" + \n"');
          x = x.replace(/^\n/g, "").replace(/\n$/g, "");
          // remove Windows line ending stuff
          x = x.replace(/\r/g, "");
          const g = t1 + z + t2;
          t = t.replace(g, '(new CDATA("' + x + '"))');
        }
        s = s.substr(1, s.length - 1);
        pos = s.search(Helper.escapeForRegExp(t1));
      }

      return t;
    },
  };

  Registry.register("compat", compaMo);
})();
