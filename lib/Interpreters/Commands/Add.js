const utils = require('../../utils'),
    constants = require("../../constants"),
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await'),
    _ = require("lodash"),
    CommandBase = require("../../Framework/CommandBase"),
    Executors = require("./Executors");
/**
 * Handles the `add>` commands.
 * @class Add
 */
class Add extends CommandBase {
    constructor() {
        super("add");
    }

    canHandle(input) {
        return utils.isDefined(input.match(/^\s?add\s?>\s?/gi));
    }

    handle(session) {
        const that = this;

        function runner() {

            const question = session.Input.Raw;
            const cmd = utils.getCommand(question);
            const ctx = session.Context;
            let pods = [];
            if(cmd.Commands.length > 1) {
                switch(cmd.Commands[1]) {
                    case "space":
                        pods = Executors.addSpace(cmd, session, that);
                        break;
                    case "tag":
                        pods = waitFor(Executors.addTag(cmd, session, that));
                        break;
                    case "task":
                        pods = waitFor(Executors.addTask(cmd, session, that));
                        break;
                    case "person":
                        pods = waitFor(Executors.addPerson(cmd, session, that));
                        break;
                    case "address":
                        pods = waitFor(Executors.addAddress(cmd, session, that));
                        break;
                    case "personalization":
                    case "preference":
                        pods = waitFor(Executors.addPersonalization(cmd, session, that));
                        break;
                    case "agenda":
                    case "appointment":
                        if(!cmd.HasNamedArguments) {
                            const Entities = require("../../Understanding/Entities"),
                                Event = Entities.Appointment;
                            if(utils.isUndefined(cmd.FirstParameter)) {
                                 return Executors.messagePods("You did not supply anything to create an appointment.");
                            }
                            const a = Event.tryMakingSense(cmd.FirstParameter.value);
                            if(utils.isUndefined(a)) {
                                pods = utils.messagePods("Sorry, I could not make sense of the date and/or time you specified there. Can you try again please?");
                            } else {
                                pods = waitFor(Executors.addAppointment(a, session, that));
                            }
                        }
                        else {
                            pods = waitFor(Executors.addAppointment(cmd, session, that));
                        }
                        break;
                    default:
                        if(cmd.Commands.length > 2) {
                            pods = Executors.messagePods("If you want to add an entity, try with e.g. '`add>thought>` my new thought'.");
                        } else {
                            let node = waitFor(Executors.addEntity(cmd, session, that));
                            pods = Executors.singleEntityPod(node, "The new node has been added.");
                        }
                        break;
                }

            } else {
                if(utils.isUndefined(cmd.FirstParameter)) {
                    pods = Executors.messagePods(Executors.NotOK + " If you want to add an entity, try with e.g. 'add>thought>...'.");
                } else {
                    // if no addditional command the default is adding a thought
                    let node = waitFor(that.addEntity(session, cmd.Commands[1], cmd.FirstParameter));
                    pods = Executors.singleEntityPod(node, "The new node has been added.");
                }

            }
            return pods;
        }

        return async(runner)();
    }

}
module.exports = Add;