const _ = require("lodash");
const md = require('markdown-it')({html: true});
const constants = require("./constants");

/**
 * Turns JSON into a console-friendly format.
 * Based on code from Easy-Table (https://github.com/eldargab/easy-table)
 * @class Table
 */
class Table {

    constructor() {
        this.rows = [];
        this.row = {__printers: {}}
    }


    static get rowEndMarker() {
        return Table._endMarker || "\n";
    }

    static set rowEndMarker(v) {
        Table._endMarker = v;
    }

    static get rowStartMarker() {
        return Table._startMarker || "";
    }

    static set rowStartMarker(v) {
        Table._startMarker = v;
    }

    static get headerSeparator() {
        return Table._headerSeparator || "-";
    }

    static set headerSeparator(v) {
        Table._headerSeparator = v;
    }

    /**
     * Gets the seprarator between columns.
     * @static
     * @memberof Table
     */
    static get rowSeparator() {
        return Table._seprator || "  ";
    }

    /**
     * Sets the seprarator between columns.
     * @static
     * @memberof Table
     */
    static set rowSeparator(v) {
        Table._seprator = v;
    }

    newRow() {
        this.rows.push(this.row);
        this.row = {__printers: {}};
        return this
    }

    /**
     * Write cell in the current row
     *
     * @param {String} col          - Column name
     * @param {Any} val             - Cell value
     * @param {Function} [printer]  - Printer function to format the value
     * @returns {Table} `this`
     */
    cell(col, val, printer) {
        this.row[col] = val;
        this.row.__printers[col] = printer || Table.stringify;
        return this
    }

    static stringify(val) {
        return val === undefined ? '' : '' + val
    }

    static measure(str) {
        const s = str.replace(/\u001b\[\d+m/g, '');
        return s.length // use 'npm wcwidth' for multilingual power
    }

    /**
     * Create a printer which right aligns the content by padding with the
     * given character on the left.
     * @param {String} ch A padding character.
     * @returns {Function} A printer.
     */
    static leftPaddingPrinter(ch) {
        return function(val, width) {
            const str = Table.stringify(val);
            const len = Table.measure(str);
            const pad = width > len ? new Array(width - len + 1).join(ch) : '';
            return pad + str;
        }
    }

    /**
     * Returns a padded string.
     * @static
     * @param {String} val The string to be padded.
     * @param {Number} width The expected width of the output string.
     * @returns {String} The padded string.
     *
     * @memberof Table
     */
    static padLeft(val, width) {
        return Table.leftPaddingPrinter(' ')(val, width);
    }

    /**
     * Create a printer which right aligns the content by padding with the
     * given character on the right.
     * @param {String} ch A padding character.
     * @returns {Function} A printer.
     */
    static rightPaddingPrinter(ch) {
        return function padRight(val, width) {
            const str = Table.stringify(val);
            const len = Table.measure(str);
            const pad = width > len ? new Array(width - len + 1).join(ch) : '';
            return str + pad
        }
    }

    /**
     * Returns a padded string.
     * @static
     * @param {String} val The string to be padded.
     * @param {Number} width The expected width of the output string.
     * @returns {String} The padded string.
     *
     * @memberof Table
     */
    static padRight(val, width) {
        return Table.rightPaddingPrinter(' ')(val, width);
    }

    /**
     * Create a printer for numbers
     *
     * Will do right alignment and optionally fix the number of digits after decimal point
     *
     * @param {Number} [digits] - Number of digits for fixpoint notation
     * @returns {Function}
     */
    static numberPrinter(digits) {
        return function(val, width) {
            if(_.isNil(val)) return '';
            if(!_.isNumber(val))
                throw new Error(`Expected ${val} to be a number.`);
            const str = digits === null ? val + '' : val.toFixed(digits);
            return Table.padLeft(str, width)
        }
    }

    /**
     * Applies the given function to the row.
     *
     * @static
     * @param {any} row
     * @param {any} fn
     *
     * @memberof Table
     */
    static rowApply(row, fn) {
        if(!_.isFunction(fn)) {
            throw new Error("Expected a function.");
        }
        for(const key in row) {
            if(key === '__printers') continue;
            fn(key, row[key]);
        }
    }


    /**
     * Get list of columns in printing order
     *
     * @returns {string[]}
     */
    get columns() {
        const cols = {};
        for(let i = 0; i < 2; i++) { // do 2 times
            this.rows.forEach(function(row) {
                let idx = 0;
                Table.rowApply(row, function(key) {
                    idx = Math.max(idx, cols[key] || 0);
                    cols[key] = idx;
                    idx++
                })
            })
        }
        return Object.keys(cols).sort(function(a, b) {
            return cols[a] - cols[b]
        })
    }

    /**
     * Format just rows, i.e. print the table without headers and totals
     *
     * @returns {String} String representaion of the table
     */
    print() {
        const cols = this.columns;
        const widths = {};
        let out = '';

        // Calc widths
        this.rows.forEach(function(row) {
            Table.rowApply(row, function(key, val) {
                const str = row.__printers[key].call(row, val);
                widths[key] = Math.max(Table.measure(str), widths[key] || 0)
            })
        });

        // Now print
        this.rows.forEach(function(row) {
            let line = '';
            cols.forEach(function(key, index) {
                let str;
                const width = widths[key];
                if(index === 0) { // deal with begin marker
                    str = row.hasOwnProperty(key)
                        ? '' + row.__printers[key].call(row, row[key], width)
                        : '';
                    line += Table.rowStartMarker + Table.padRight(str, width) + Table.rowSeparator
                } else {
                    str = row.hasOwnProperty(key)
                        ? '' + row.__printers[key].call(row, row[key], width)
                        : '';
                    line += Table.padRight(str, width) + Table.rowSeparator
                }

            });
            line = line.slice(0, -Table.rowSeparator.length);
            out += line + Table.rowEndMarker
        });
        return out
    }


    /**
     * Format the table
     *
     * @returns {String}
     */
    toString() {
        const cols = this.columns;
        const out = new Table();

        // copy options
        out.separator = Table.rowSeparator;

        // Write header
        cols.forEach(function(col) {
            out.cell(col, col)
        });
        out.newRow();
        out.pushDelimeter(cols);

        // Write body
        out.rows = out.rows.concat(this.rows);

        // Totals
        if(this.totals && this.rows.length) {
            out.pushDelimeter(cols);
            this.forEachTotal(out.cell.bind(out));
            out.newRow()
        }

        return out.print()
    }

    /**
     * Push delimeter row to the table (with each cell filled with dashs during printing)
     *
     * @param {String[]} [cols]
     * @returns {Table} `this`
     */
    pushDelimeter(cols) {
        cols = cols || this.columns;
        cols.forEach(function(col) {
            this.cell(col, undefined, Table.leftPaddingPrinter(Table.headerSeparator))
        }, this);
        return this.newRow()
    }


    /**
     * Compute all totals and yield the results to `cb`
     *
     * @param {Function} cb - Callback function with signature `(column, value, printer)`
     */
    forEachTotal(cb) {
        for(const key in this.totals) {
            const aggr = this.totals[key];
            let acc = aggr.init;
            const len = this.rows.length;
            this.rows.forEach(function(row, idx) {
                acc = aggr.reduce.call(row, acc, row[key], idx, len)
            });
            cb(key, acc, aggr.printer)
        }
    }


    /**
     * Format the table so that each row represents column and each column represents row
     *
     * @param {Object} [opts]
     * @param {String} [ops.separator] - Column separation string
     * @param {Function} [opts.namePrinter] - Printer to format column names
     * @returns {String}
     */
    printTransposed(opts) {
        opts = opts || {};
        const out = new Table;
        Table.rowSeparator = "  ";
        Table.rowStartMarker = "";
        Table.rowEndMarker = "\n";
        out.separator = opts.separator || ": ";
        this.columns.forEach(function(col) {
            out.cell(0, col, opts.namePrinter);
            this.rows.forEach(function(row, idx) {
                out.cell(idx + 1, row[col], row.__printers[col])
            });
            out.newRow()
        }, this);
        return out.print()
    }


    /**
     * Print the array or object
     *
     * @param {Array|Object} obj - Object to print
     * @param {Function|Object} [format] - Format options
     * @param {Function} [cb] - Table post processing and formating
     * @returns {String}
     */
    static print(obj, format, cb) {
        const opts = format || {};

        format = _.isFunction(format)
            ? format
            : function(obj, cell) {
                for(const key in obj) {
                    if(!obj.hasOwnProperty(key)) continue;
                    const params = opts[key] || {};
                    cell(params.name || key, obj[key], params.printer)
                }
            };

        const t = new Table;
        const cell = t.cell.bind(t);

        if(Array.isArray(obj)) {
            cb = cb || function(t) {
                    return t.toString()
                };
            obj.forEach(function(item) {
                format(item, cell);
                t.newRow()
            })
        } else {
            cb = cb || function(t) {
                    return t.printTransposed({separator: ' : '})
                };
            format(obj, cell);
            t.newRow()
        }

        return cb(t)
    }
}

module.exports = {
    Table: Table,

    isDefined: function(obj) {
        return obj !== undefined && obj !== null;
    },


    isUndefined: function(obj) {
        return !this.isDefined(obj);
    },

    extractSession(session, format){
        return session;
    },

    extractPods(session, format){
        return session.Output.Answer;
    },

    /**
     * Formats the answer in the given session in a way suitable for console output.
     * @param session {Session} A Qwiery session.
     * @param format {String} raw|plain|text, md|markdown, html
     * @return {String} A console adapted format of the answer in the given session.
     */
    extractSimple(session, format = "plain") {
        let nt, // new line + tab separator
            t, // tab (if necessary)
            n; // new line separator
        switch(format.toLowerCase()) {
            case "plain":
            case "text":
            case "raw":
                nt = "\n\t";
                t = "\t";
                n = "\n";
                Table.rowSeparator = "  ";
                Table.rowStartMarker = "";
                Table.rowEndMarker = "\n";
                break;
            case "md":
            case "markdown":
                nt = "\n\t";
                t = "\t";
                n = "\n";
                Table.rowSeparator = " | ";
                Table.rowStartMarker = "|";
                Table.rowEndMarker = "|\n";
                break;
            case "html": // create md and render the md thereafter
                nt = "\n";
                t = "";
                n = "\n";
                Table.rowSeparator = " | ";
                Table.rowStartMarker = "|";
                Table.rowEndMarker = "|\n";
                break;
        }
        let i;

        let r = [];

        if(this.isUndefined(session)) {
            r.push("Something went wrong, the processing did not result in an answer. The session was nil.");
        }
        else if(_.isString(session) || _.isNumber(session)) {
            r.push(t + session.toString().replace(/\n/gmi, nt));
        }
        else if(_.isArray(session)) {
            r.push(t + session.map(
                    function(s) {
                        return s.toString()
                    })
            );
        }
        else {
            const ans = session.Output.Answer;
            if(_.isString(ans) || _.isNumber(ans)) {
                r.push(n + session.Output.Answer.toString().replace(/\n/gmi, nt));
            }
            else if(!_.isArray(ans)) {
                r.push("Can't figure out what to do with an answer in an unexpected shape.");
            } else {
                // an array of numbers?
                if(_.every(ans, function(x) {
                        return _.isNumber(x)
                    })) {
                    r.push(ans.join(", "));
                } else {
                    for(i = 0; i < ans.length; i++) {
                        const pod = ans[i];
                        if(this.isUndefined(pod)) {
                            r.push(nt + "Ouch, got an empty item in the pod list.");
                            continue;
                        }
                        if(_.isString(pod) || _.isNumber(pod)) {
                            r.push(nt + pod);
                            continue;
                        }
                        if(pod.Head) {
                            r.push(t + "▶ " + pod.Head + n);
                        }
                        if(this.isUndefined(pod.DataType)) {
                            r.push(nt + Table.print(pod).replace(/\n/gmi, nt));
                            break;
                        }
                        else {
                            switch(pod.DataType.toLowerCase()) {
                                case "list":
                                    r.push(t + Table.print(pod.List).replace(/\n/gmi, nt));
                                    break;
                                case "text":
                                    r.push(t + pod.Content.replace(/\n/gmi, nt));
                                    break;
                                case "singleentity":
                                    r.push(this.printEntity(pod.Entity, format));
                                    break;
                            }
                        }

                    }
                }
            }
        }
        if(format.toLowerCase() === "html") {
            return md.render(r.join("\n"));
        } else {
            return r.join("\n");
        }
    },

    /**
     * This turns a session into oneliners.
     * Mostly useful for unit testing and such.
     * @param session
     * @param format {String} The expected format is not relevant since the flat extraction always returns a simple string.
     * @return {*}
     */
    extractFlat(session, format){
        if(this.isUndefined(session)) {
            return constants.NOSESSION;
        }
        if(_.isString(session.Output.Answer) || _.isNumber(session.Output.Answer)) {
            return session.Output.Answer.toString();
        }
        if(_.isPlainObject(session.Output.Answer)) {
            session.Output.Answer = [session.Output.Answer];
        }
        if(!_.isArray(session.Output.Answer)) {
            return constants.BADSESSIONFORMAT;
        }
        if(session.Output.Answer.length === 0) {
            return constants.EMPTYARRAY;
        }
        if(session.Output.Answer.length > 1) {
            // const types = [];
            // for(let i = 0; i < session.Output.Answer.length; i++) {
            //     const pod = session.Output.Answer[i];
            //     types.push(pod.DataType || "No DataType set");
            // }
            // return constants.MULTIPOD + "Types:" + types.join(", ");
            return constants.MULTIPOD;
        } else {
            const pod = session.Output.Answer[0];
            if(pod.DataType) {
                switch(pod.DataType) {
                    case constants.podType.Text:
                        return pod.Content;
                    case constants.podType.CurrentAgenda:
                        return constants.AGENDA;
                    case constants.podType.Favorites:
                        return constants.FAVORITES;
                    case constants.podType.Thoughts:
                        return constants.THOUGHTS;
                    case constants.podType.People:
                        return constants.PEOPLE;
                    case constants.podType.SingleEntity:
                        return constants.SINGLEENTITY;
                    case constants.podType.List:
                        if(!pod.ListType) {
                            return constants.LIST;
                        }
                        switch(pod.ListType.toLowerCase()) {
                            case "task":
                                return constants.TASKS;
                            case "searchitem":
                                return constants.GRAPHSEARCH;
                        }
                        break;
                    case constants.podType.GraphSearch:
                        return constants.GRAPHSEARCH;
                }
            } else {
                if(_.isPlainObject(pod)) {
                    return constants.PLAIN;
                } else {
                    return constants.NOTPLAIN;
                }
            }
            return constants.NORESULTS;
        }
    },

    extractTrace(session, format){
        return JSON.stringify(session.Trace, null, 5);
    },

    /**
     * Let's do something special for the entity
     * so it appears a bit more appealing in html.
     * @param entity
     * @param format
     * @return {string}
     */
    printEntity(entity, format = "plain"){
        let r = "";
        switch(format.toLowerCase()) {
            case "plain":
            case "text":
            case "raw":

                _.forOwn(entity, function(v, k) {
                    r += `\t ${k}: ${v}\n`;
                });
                break;
            case "md":
            case "markdown":
                _.forOwn(entity, function(v, k) {
                    r += `${k}: ${v}\n`;
                });
                break;
            case "html": // create md and render the md thereafter
                _.forOwn(entity, function(v, k) {
                    r += `<strong>${k}</strong>: ${v}<br/>\n`;
                });
                break;
        }
        return r;
    }

};