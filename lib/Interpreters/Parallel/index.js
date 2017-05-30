const
    utils = require('../../utils'),
    constants = require('../../constants'),
    InterpreterBase = require('../../Framework/InterpreterBase'),
    request = require('request'),
    fs = require("fs-extra"),
    path = require("path"),
    eventHub = require("../../eventHub"),
    _ = require('lodash');

/**
 * Reaches out to the configured external services
 * for an answer.
 *
 * @class Parallel
 * @extends {InterpreterBase}
 */
class Parallel extends InterpreterBase {

    constructor() {
        super("parallel");
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
module.exports = Parallel;