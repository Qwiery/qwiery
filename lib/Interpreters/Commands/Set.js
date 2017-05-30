const utils = require('../../utils'),
    constants = require("../../constants"),
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await'),
    _ = require("lodash"),
    CommandBase = require("../../Framework/CommandBase"),
    Executors = require("./Executors");
/**
 * Handles the `set>` commands.
 * @class Set
 */
class Set extends CommandBase {
    constructor() {
        super("set");
    }

    canHandle(input) {
        return utils.isDefined(input.match(/^\s?set\s?>\s?/gi));
    }

    handle(session) {
        const that = this;

        function runner() {
            const question = session.Input.Raw;
            const cmd = utils.getCommand(question);
            const ctx = session.Context;
            let pods = [];
            if(cmd.Commands.length > 1) {
                switch(cmd.FirstCommand) {
                    case "space":
                        pods = waitFor(Executors.setSpace(cmd, session, that));
                        break;
                    case "answer":
                        pods = waitFor(Executors.setAnswer(cmd, session, that));
                        break;
                    case "tag":
                        pods = waitFor(Executors.setTag(cmd, session, that));
                        break;
                }

            } else {
                pods = Executors.messagePods(Executors.NotOK + "If you want to set the activeworkspace, try with e.g. 'set>space> <the name of the space>'.");
            }
            return pods;
        }

        return async(runner)();
    }
}
module.exports = Set;