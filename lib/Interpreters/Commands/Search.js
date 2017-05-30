/***
 * Handles anything of the shape
 *
 *  search:...
 */
var
    utils = require('../../utils'),

    constants = require("../../constants");
const CommandBase = require("../../Framework/CommandBase"),
    Executors = require("./Executors");
class Search extends CommandBase {
    constructor() {
        super("search");
    }

    canHandle(input) {
        return utils.isDefined(input.match(/^search\s?>\s?/gi));
    }

    handle(session) {
        const question = session.Input.Raw;
        const cmd = utils.getCommand(question);
        if(cmd.Commands.length > 1) {
            switch(cmd.FirstCommand) {
                case "graph":
                    return Executors.searchGraph(cmd, session, this);
                default:
                    return Executors.messagePods("Other search types are not implemented yet.");
            }
        } else {
            return Executors.searchGraph(cmd, session, this);
        }
    }
}
module.exports = Search;