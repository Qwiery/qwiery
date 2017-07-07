/**
 * Spam filtering
 */
// Based on Alex http://alexjs.com/#demo
// JS injection see https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
const InterpreterBase = require("../../Framework/InterpreterBase");

/**
 * Attempts to catch offensive, dirty, spam input.
 *
 */
const
    constants = require("../../constants"),
    utils = require("../../utils"),
    _ = require("lodash");
const profanity = require("profanity-util");
/**
 * Basic spam filtering.
 *
 * @class Spam
 * @extends {InterpreterBase}
 */
class Spam extends InterpreterBase {
    constructor() {
        super("spam");
    }

    processMessage(session) {
        const question = session.Input.Raw.toLowerCase();
        const found = profanity.check(question);
        if(utils.isDefined(found) && found.length > 0) {
            session.Handled = true;
            session.Trace.push({"HandledBy": "Spam"});
            session.Trace.push({
                "Module": "Spam",
                "What": "Spam found and further processing halted.",
                "Details": found
            });
            const msg = found.length === 1 ? "I consider the word '" + found[0] + "' as offensive and your question will not be answered." : "I consider the words '" + found.join(",") + "'  as offensive and your question will not be answered.";
            session.Output.Answer = utils.messagePods(msg);
        }

        return session;
    }
}
/**
 * @module Spam
 */
module.exports = Spam;
