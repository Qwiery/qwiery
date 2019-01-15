const utils = require('../../utils'),
    _ = require("lodash"),
    CommandBase = require("../../Framework/CommandBase"),
    Executors = require("./Executors");
/**
 * Handles the `delete>` commands.
 * @class Delete
 */
class Delete extends CommandBase {
    constructor() {
        super("delete");
    }

    canHandle(input) {
        return utils.isDefined(input.match(/^\s?delete\s?>\s?/gi));
    }

    handle(session) {
        const that = this;

        const question = session.Input.Raw;
        const cmd = utils.getCommand(question);
        const ctx = session.Context;


        if(cmd.Commands.length > 1) {

            // DELETE:SPACE:
            // if(cmd.Commands[1] === "space") {
            //     if(cmd.Commands.length > 2) {
            //         pods = [{
            //             "Content": "I don't understand this command. If you want to add a workspace, try with e.g. 'add:space: my new space'.",
            //             "DataType": constants.podType.Text
            //         }];
            //     } else {
            //         var workspaceId = graph.addWorkspace({Name: cmd.FirstParameter}, ctx);
            //         pods = [{
            //             "Content": "The new space was added and is now the active one. You can change the active workspace by using the command 'set:space: <the name of the space you have given>'.",
            //             "DataType": constants.podType.Text
            //         }];
            //     }
            // }
            switch(cmd.Commands[1]) {
                case "tag":
                    return Executors.deleteTag(cmd, session, that);
                case "entity":
                    return Executors.deleteEntity(cmd, session, that);
                case "space":
                    return Executors.deleteSpace(cmd, session, that);
                default:
                    return Executors.messagePods(`Deleting a '${cmd.Commands[1]}' is not implemented yet. You can delete tags however.`);
            }
        } else {
            return Executors.deleteEntity(cmd, session, that);
            //return Executors.messagePods(Executors.NotOK + "If you want to delete a tag, try with e.g. 'delete:tag: my new tag'.");
        }
    }
}
module.exports = Delete;
