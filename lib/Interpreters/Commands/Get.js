const utils = require('../../utils'),
    constants = require("../../constants"),
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await'),
    _ = require("lodash"),
    CommandBase = require("../../Framework/CommandBase"),
    Executors = require("./Executors");

/**
 * Handles the `get>` commands.
 * @class Get
 */
class Get extends CommandBase {
    constructor() {
        super("get");
    }

    canHandle(input) {
        return utils.isDefined(input.match(/^\s?get\s?>\s?/gi));
    }


    handle(session) {
        const question = session.Input.Raw;
        const cmd = utils.getCommand(question);
        const ctx = session.Context;
        let pods = [], found;
        const that = this;

        function runner() {
            if(cmd.Commands.length > 1) {
                switch(cmd.FirstCommand) {
                    case "tags":
                        const list = waitFor(Executors.getTags(cmd, session, that));
                        pods = Executors.listPod(list, "Tag", list.length === 1 ? "1 tag" : list.length + " tags");
                        break;
                    case "tag":
                        pods = waitFor(Executors.getTag(cmd, session, that));
                        break;
                    case "space":
                        pods = [waitFor(Executors.getSpace(cmd, session, that))];
                        break;
                    case "activespace":
                        pods = waitFor(Executors.getActiveSpace(cmd, session, that));
                        break;
                    case "spaces":
                        pods = waitFor(Executors.getSpaces(cmd, session, that));
                        break;
                    case "personalization":
                        found = waitFor(Executors.getPersonalization(cmd, session, that));
                        pods = found ? [found] : Executors.messagePods(`You don't have any preferences yet.`);
                        break;
                    case "agenda":
                        found = waitFor(Executors.getAgenda(cmd, session, that));
                        if(utils.isUndefined(found)) {
                            pods = Executors.messagePods(`You don't have any appointments yet.`);
                        } else {
                            if(found.length === 0) {
                                pods = Executors.messagePods(`You don't have any appointments yet.`);
                            } else {
                                {
                                    pods = Executors.listPod(found, "Appointment", "These are your appointments:");
                                }
                            }
                        }
                        break;
                    case "version":
                        let v = waitFor(that.services.system.getSystemVariable("version"));
                        pods = Executors.messagePods(`This is Qwiery v${v}.`);
                        break;
                }
                return pods;
            } else {
                // if no additional command the default is getting an entity
                if(utils.isUndefined(cmd.FirstParameter) || cmd.FirstParameter.length === 0) {
                    return Executors.messagePods(Executors.NotOK + " If you want to get an entity, try with e.g. 'get: some-id'.");
                } else {
                    let entity = waitFor(Executors.getEntity(cmd, session, that));
                    if(utils.isDefined(entity)) {
                        return [entity]
                    } else {
                        return Executors.messagePods(`The entity with id '${cmd.FirstParameter.value}' was not found.`);
                    }
                }
            }
        }

        return async(runner)();
    }
}
module.exports = Get;