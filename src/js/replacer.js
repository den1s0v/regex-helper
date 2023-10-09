
class Match {
    constructor (cnf) {
        // whithin the source string:
        this.pos = cnf.pos || +Infinity;
        this.len = cnf.len || 0;
        // whithin the destination string:
        this.insert_pos = cnf.insert_pos || +Infinity;
        this.replacement = cnf.replacement || '';
        // reference to parent
        this.ri = cnf.ri || null;
    }
    
    /** Determines if this Match is strictly better that the other.
     * Returns true if this is at left of other or longer than other; 
     * returns false if is shorter (or equals in length) or is at right than other. */
    isBetterThan(other) {
        if (other === null)
            return true;
        if (this.pos < other.pos)
            return true;
        if (this.pos > other.pos)
            return false;

        return (this.len > other.len);
    }

    locationForMark(role = 'src', line = 0) {
        if (role === 'src')
            return [/* from: */ {line, ch: this.pos}, /* to: */ {line, ch: this.pos + this.len}];
        else if (role === 'dst')
            return [/* from: */ {line, ch: this.insert_pos}, /* to: */ {line, ch: this.insert_pos + this.replacement.length}];
    }
}

/**
 * data item for replacement pair [a -> b]
 */
class ReplaceItem {
    constructor(cnf) {
        if (!cnf)
            cnf = {}

        if (cnf instanceof String) {
            // parse config
            // ...
        }

        // basic data
        this.a = cnf.a || ' ';  // search str
        this.b = cnf.b || ' ';  // replace with
        this.kind = cnf.kind || 'text';  // 'text' or (TODO:) 're'/'regex'/'regexp'
        this.mode = cnf.mode || 'on';  // 'on' (do replace) or 'off' (do nothing) or 'keep' (do match but do not replace)

        // UI-related data
        this.style = "color: #fdd";
        this.usage = [];
    }

    /**
     * Find position & length of nearest occurence of `this.a` in string
     * @param {String} string str to search in
     * @param {Number} pos optional start position of the search
     * @returns {Match} {pos: 123, len: 4} or null
     */
    first_match(string, pos = 0, _inversed = false) {
        if (this.mode == 'off') {
            return null;
        }
        if (this.kind == 'text') {
            let p = string.indexOf(this.a, pos);
            if (p > -1) {
                
                return new Match({
                    pos: p, 
                    len: this.a.length,
                    replacement: this.b,
                    ri: this,
                });
            }
        } else if (this.kind.slice(0, 2) == 're') {
            // todo: RE
            // ...
        }
        return null;
    }

    clearUsage() {
        this.usage = [];
    }

    static fromStr(s, inversed = false) {
        s = str_strip(s);
        // 1. Expect tab-separated a & b, possibly enclosed in single or double quotes
        if (s === '' || s.startsWith('// ')) {
            // empty or  outcommented line
            return null; 
        }
        /* if (s.includes('\t')) */ {
            // e.g.   ' ' -> "\s*"
            const m  = /(\'[^\']+\'|\"[^\"]+\"|\S+)\s*(?:\t|->?)\s*(\'[^\']+\'|\"[^\"]+\"|\S+)/.exec(s);
            if (!m)
                return false; // parsing error
            
            let a = strip_quotes(m[1]);
            let b = strip_quotes(m[2]);

            if (inversed) {
                [a, b] = [b, a];
            }

            let cnf = {a, b};

            if (a === b) {
                cnf.mode = 'keep';
            }

            return new ReplaceItem(cnf);
        }
        // return new ReplaceItem({a, b});
    }
}


class Replacer {
    constructor(ri_list, ) {
        this.ris = ri_list || [];
    }

    /**
     * Replace all posssible replacings in string. Main rule for performing that is selecting most left and longest match.
     * @param {String} string string (`a`) to replace in
     * @returns [updated string (`b`) with all posssible replacings done  ,  list of matches for further highlighting]
     */
    replace_in_string(string) {
        this.clear_marks();
        let pos_a = 0;
        let pos_b = 0;

        let replaced_str_parts = [];
        let match_list = [];

        let search_finished = false;
        while (!search_finished) {
            // let pos = Infinity;
            let m = this.find_best_match(string, pos_a);
            if (!m) {
                // fake Match at end of str
                m = new Match({
                    pos: string.length,
                    len: 0,
                    replacement: '',
                });
                search_finished = true;
            }

            // move along both (given & new) strings
            // 1) copy the untouched part
            if (pos_a < m.pos) {
                let untouched = string.slice(pos_a, m.pos);
                replaced_str_parts.push(untouched);
                pos_a += untouched.length;
                pos_b += untouched.length;
            }
            // 2) insert replacement
            pos_a += m.len;
            if (m.replacement.length > 0) {
                m.insert_pos = pos_b; // set anchor to match object
                replaced_str_parts.push(m.replacement);
                pos_b += m.replacement.length;
            }


            if (!search_finished) {
                // register the match as used in it's ri
                m.ri && m.ri.usage.push(m);
                // save match
                match_list.push(m);
            }
        }

        ///
        console.log(replaced_str_parts);

        return [replaced_str_parts.join(''), match_list];
    }

    find_best_match(string, pos_a = 0) {
        let best_match = null;

        this.ris.forEach(ri => {
            if (ri.mode != 'off') {
                let m = ri.first_match(string, pos_a);
                if (m && m.isBetterThan(best_match)) {
                    // replace current best match
                    best_match = m;
                }
            }
        });

        return best_match;
    }

    clear_marks() {
        this.ris.forEach(ri => ri.clearUsage());
    }
}

function str_strip(s, chars = ' \t') {
    // cut the beginning
    while (s.length > 0 && chars.includes(s[0])) {
        s = s.slice(1);
    }
    // cut the end
    while (s.length > 0 && chars.includes(s[s.length - 1])) {
        s = s.slice(0, -1);
    }
    return s;
}

function strip_quotes(s, chars = '"\'') {
    // cut the beginning
    const first = s[0];
    const last = s[s.length - 1];
    if (s.length > 0 && first === last && chars.includes(first) && chars.includes(last)) {
        s = s.slice(1, -1);
    }
    return s;
}

