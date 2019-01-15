const utils = require('../../utils'),
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

    async handle(session) {
        const that = this;

        const question = session.Input.Raw;
        const cmd = utils.getCommand(question);
        let pods = [];
        if (cmd.Commands.length > 1) {
            switch (cmd.FirstCommand) {
                case "space":
                    pods = await (Executors.setSpace(cmd, session, that));
                    break;
                case "answer":
                    pods = await (Executors.setAnswer(cmd, session, that));
                    break;
                case "tag":
                    pods = await (Executors.setTag(cmd, session, that));
                    break;
            }

        } else {
            pods = Executors.messagePods(Executors.NotOK + "If you want to set the activeworkspace, try with e.g. 'set>space> <the name of the space>'.");
        }
        return pods;
    }
}
module.exports = Set;
