const Qwiery = require("../../../lib");
const _ = require("lodash");
/**
 * Sample interpreter plugin.
 * Returns a random integer.
 * @example <caption>How to include this plugin in a Qwiery instance:</caption>
 * var q = new Qwiery({
 *       defaults:{pipeline: [
 *           "RandomInt"
 *       ]},
 *       plugins: [
 *           {
 *               type: "interpreter",
 *               name: "RandomInt",
 *               path: path.join(__dirname, "../plugins/RandomInt")
 *           }
 *       ]
 *   });
 * @class
 */
class RandomIntInterpreter extends Qwiery.InterpreterBase {
    constructor(settings) {
        super(settings);
        this.pluginName = "numbers";
    }

    processMessage(session) {
        if(session.Handled === true) {
            return session;
        }
        return new Promise(function(resolve, reject) {
            const m = _.merge(session, {
                Output: {
                    Answer: Math.floor(Math.random() * 10000)
                },
                Handled: true
            });
            resolve(m);
        });
    }
}
/**
 * An interpreter returning random integers
 * for testing purposes.
 * @module Interpreters/RandomInt
 * @type {RandomInt}
 */
module.exports = RandomIntInterpreter;