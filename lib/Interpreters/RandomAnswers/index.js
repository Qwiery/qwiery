const c = require("chance"),
    chance = new c.Chance(),
    _ = require("lodash");
const InterpreterBase = require("../../Framework/InterpreterBase");

/**
 * Returns random answers to any question.
 * Just for testing and debugging purposes.
 * @class
 */
class RandomAnswers extends InterpreterBase {
    constructor() {
        super("random");
    }

    processMessage(session) {
        if(session.Handled === true) {
            return session;
        }
        super.processMessage(session);
        return new Promise(function(resolve, reject) {
            const m = _.merge(session, {
                Output: {
                    Answer: chance.sentence()
                },
                Handled: true
            });
            resolve(m);
        });
    }
}
/**
 * An interpreter returning random answers
 * for testing purposes.
 * @module Interpreters/RandomAnswers
 * @type {RandomAnswers}
 */
module.exports = RandomAnswers;