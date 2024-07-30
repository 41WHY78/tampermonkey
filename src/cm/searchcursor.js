(function () {
  function SearchCursor(cm, query, pos, caseFold) {
    this.atOccurrence = false;
    this.cm = cm;
    if (caseFold == null && typeof query === "string") caseFold = false;

    pos = pos ? cm.clipPos(pos) : { line: 0, ch: 0 };
    this.pos = { from: pos, to: pos };

    // The matches method is filled in based on the type of query.
    // It takes a position and a direction, and returns an object
    // describing the next occurrence of the query, or null if no
    // more matches were found.
    if (typeof query !== "string") {
      // Regexp match
      if (!query.global) {
        query = new RegExp(query.source, query.ignoreCase ? "ig" : "g");
      }
      this.matches = function (reverse, pos) {
        if (reverse) {
          query.lastIndex = 0;
          var line = cm.getLine(pos.line).slice(0, pos.ch);
          var match = query.exec(line);
          var start = 0;
          while (match) {
            start += match.index + 1;
            line = line.slice(start);
            query.lastIndex = 0;
            const newmatch = query.exec(line);
            if (newmatch) match = newmatch;
            else break;
          }
          start--;
        } else {
          query.lastIndex = pos.ch;
          var line = cm.getLine(pos.line);
          var match = query.exec(line);
          var start = match?.index;
        }
        if (match) {
          return {
            from: { line: pos.line, ch: start },
            to: { line: pos.line, ch: start + match[0].length },
            match,
          };
        }
      };
    } else {
      // String query
      if (caseFold) query = query.toLowerCase();
      const fold = caseFold
        ? function (str) {
            return str.toLowerCase();
          }
        : function (str) {
            return str;
          };
      const target = query.split("\n");
      // Different methods for single-line and multi-line queries
      if (target.length == 1) {
        this.matches = function (reverse, pos) {
          const line = fold(cm.getLine(pos.line));
          const len = query.length;
          let match;
          if (
            reverse
              ? pos.ch >= len &&
                (match = line.lastIndexOf(query, pos.ch - len)) != -1
              : (match = line.indexOf(query, pos.ch)) != -1
          ) {
            return {
              from: { line: pos.line, ch: match },
              to: { line: pos.line, ch: match + len },
            };
          }
        };
      } else {
        this.matches = function (reverse, pos) {
          let ln = pos.line;
          let idx = reverse ? target.length - 1 : 0;
          let match = target[idx];
          let line = fold(cm.getLine(ln));
          const offsetA = reverse
            ? line.indexOf(match) + match.length
            : line.lastIndexOf(match);
          if (
            reverse
              ? offsetA >= pos.ch || offsetA != match.length
              : offsetA <= pos.ch || offsetA != line.length - match.length
          ) {
            return;
          }
          for (;;) {
            if (reverse ? !ln : ln == cm.lineCount() - 1) return;
            line = fold(cm.getLine((ln += reverse ? -1 : 1)));
            match = target[reverse ? --idx : ++idx];
            if (idx > 0 && idx < target.length - 1) {
              if (line != match) return;
              else continue;
            }
            const offsetB = reverse
              ? line.lastIndexOf(match)
              : line.indexOf(match) + match.length;
            if (
              reverse
                ? offsetB != line.length - match.length
                : offsetB != match.length
            ) {
              return;
            }
            const start = { line: pos.line, ch: offsetA };
            const end = { line: ln, ch: offsetB };
            return { from: reverse ? end : start, to: reverse ? start : end };
          }
        };
      }
    }
  }

  SearchCursor.prototype = {
    findNext: function () {
      return this.find(false);
    },
    findPrevious: function () {
      return this.find(true);
    },

    find: function (reverse) {
      const self = this;
      let pos = this.cm.clipPos(reverse ? this.pos.from : this.pos.to);
      function savePosAndFail(line) {
        const pos = { line, ch: 0 };
        self.pos = { from: pos, to: pos };
        self.atOccurrence = false;
        return false;
      }

      for (;;) {
        if ((this.pos = this.matches(reverse, pos))) {
          this.atOccurrence = true;
          return this.pos.match || true;
        }
        if (reverse) {
          if (!pos.line) return savePosAndFail(0);
          pos = {
            line: pos.line - 1,
            ch: this.cm.getLine(pos.line - 1).length,
          };
        } else {
          const maxLine = this.cm.lineCount();
          if (pos.line == maxLine - 1) return savePosAndFail(maxLine);
          pos = { line: pos.line + 1, ch: 0 };
        }
      }
    },

    from: function () {
      if (this.atOccurrence) return this.pos.from;
    },
    to: function () {
      if (this.atOccurrence) return this.pos.to;
    },

    replace: function (newText) {
      const self = this;
      if (this.atOccurrence) {
        self.pos.to = this.cm.replaceRange(newText, self.pos.from, self.pos.to);
      }
    },
  };

  CodeMirror.defineExtension(
    "getSearchCursor",
    function (query, pos, caseFold) {
      return new SearchCursor(this, query, pos, caseFold);
    },
  );
})();
