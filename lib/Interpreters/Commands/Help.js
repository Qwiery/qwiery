const utils = require('../../utils'),
    _ = require("lodash"),
    CommandBase = require("../../Framework/CommandBase"),
    Executors = require("./Executors");
class Help extends CommandBase {
    constructor() {
        super("help");
    }

    canHandle(input) {
        return utils.isDefined(input.match(/^\s?help\s?>\s?/gi));
    }

    handle(session) {
        const question = session.Input.Raw;
        const cmd = utils.getCommand(question);
        return Executors.getHelp(cmd, session, this);
    }
}
module.exports = Help;
