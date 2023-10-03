
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
        this.mark = {color: '#fdd'};
        this.usage = [];
    }

    /**
     * Find position & length of nearest occurence of `this.a` in string
     * @param {String} string str to search in
     * @param {Number} pos optional start position of the search
     * @returns {Match} {pos: 123, len: 4} or null
     */
    first_match(string, pos = 0) {
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