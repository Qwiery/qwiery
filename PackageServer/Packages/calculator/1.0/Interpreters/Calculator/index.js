const
    Qwiery = require("qwiery"),
    InterpreterBase = Qwiery.InterpreterBase,
    math = require("mathjs"),
    utils = Qwiery.utils,
    _ = require('lodash');
/**
 * Attempts to detect a pure calculation.
 * @class Alias
 */
class Calculator extends InterpreterBase {
    constructor() {
        super("calculator");
    }

    processMessage(session) {
        if(session.Handled) {
            return session;
        }
        const question = session.Input.Raw;
        // the math module returns its version if you do eval("version").
        if(utils.isDefined(question.match(/^version\s?/gi))) {
            return session;
        }
        // see http://mathjs.org/download.html
        // if(utils.isDefined(question.match(/^\s*([-+]?)(\d+)(?:\s*([-+*\/])\s*((?:\s[-+])?\d+)\s*)+$/gi))) {
        //     session.Input.Raw = question.replace(/^tags\:/gi, "get:tags:").trim();
        //     session.Trace.push({"Rephrase": "tags: => get:tags:"});
        // }
        try {
            const works = math.eval(question);
            if(_.isFunction(works)) { // e.g. evaluating "help" returns a function
                return session;
            }

            session.Output.Answer = [{
                "Content": works.toString(),
                "DataType": "Text"
            }];
            session.Handled = true;
            session.Trace.push({
                "Module": "Calculator",
                "What": "Interpreted input as maths.",
                "Calculator": "Eval did it."
            })
        } catch(e) {
            //
        }
        return session;
    }
}

module.exports = Calculator;
