const
    InterpreterBase = require("../../Framework/InterpreterBase"),
    utils = require("../../utils"),
    constants = require("../../constants");

/**
 * Most basic implementation of a deduction via the acquired graph knowledge/entities.
 * Language creates knowledge and knowledge creates language/answers.
 * The complement of this deduction is the oracle template ' A $1 is a $2' creating the entities and the is-link.
 * @class Deductions
 * @extends {InterpreterBase}
 */
class Deductions extends InterpreterBase {
    constructor(settings) {
        super(settings);
        this.pluginName = "deductions";
    }

    processMessage(session) {
        if(session.Handled) {
            return session;
        }
        const question = session.Input.Raw;
        const ctx = session.Context;
        const that = this;
        return new Promise(function(resolve, reject) {
            if(utils.isDefined(question.match(/^what is/gi))) {
                let rest = question.replace(/^what is/gi, "");
                // replace a/an
                rest = rest.replace(/a\s|an\s/gi, "").trim();
                that.services.graph.whatis(rest, ctx).then(function(found) {
                    if(utils.isDefined(found)) {
                        session.Output.Answer = [{
                            Content: found,
                            DataType: constants.podType.Text
                        }];
                        session.Handled = true;
                        session.Trace.push({"HandledBy": "Deduction"});
                    }
                    resolve(session);
                });
            } else {
                resolve(session);
            }
        });
    }
}
module.exports = Deductions;