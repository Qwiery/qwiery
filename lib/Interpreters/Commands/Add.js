const utils = require('../../utils'),
    constants = require('../../constants'),
    _ = require('lodash'),
    CommandBase = require('../../Framework/CommandBase'),
    Executors = require('./Executors');

/**
 * Handles the `add>` commands.
 * @class Add
 */
class Add extends CommandBase {
    constructor() {
        super('add');
    }

    canHandle(input) {
        return utils.isDefined(input.match(/^\s?add\s?>\s?/gi));
    }

    async handle(session) {
        const question = session.Input.Raw;
        const cmd = utils.getCommand(question);
        const ctx = session.Context;
        let pods = [];
        if (cmd.Commands.length > 1) {
            switch (cmd.Commands[1]) {
                case 'space':
                    pods = Executors.addSpace(cmd, session, this);
                    break;
                case 'tag':
                    pods = await (Executors.addTag(cmd, session, this));
                    break;
                case 'task':
                    pods = await (Executors.addTask(cmd, session, this));
                    break;
                case 'person':
                    pods = await (Executors.addPerson(cmd, session, this));
                    break;
                case 'address':
                    pods = await (Executors.addAddress(cmd, session, this));
                    break;
                case 'personalization':
                case 'preference':
                    pods = await (Executors.addPersonalization(cmd, session, this));
                    break;
                case 'agenda':
                case 'appointment':
                    if (!cmd.HasNamedArguments) {
                        const Entities = require('../../Understanding/Entities'),
                            Event = Entities.Appointment;
                        if (utils.isUndefined(cmd.FirstParameter)) {
                            return Executors.messagePods('You did not supply anything to create an appointment.');
                        }
                        const a = Event.tryMakingSense(cmd.FirstParameter.value);
                        if (utils.isUndefined(a)) {
                            pods = utils.messagePods('Sorry, I could not make sense of the date and/or time you specified there. Can you try again please?');
                        } else {
                            pods = await (Executors.addAppointment(a, session, this));
                        }
                    } else {
                        pods = await (Executors.addAppointment(cmd, session, this));
                    }
                    break;
                default:
                    if (cmd.Commands.length > 2) {
                        pods = Executors.messagePods('If you want to add an entity, try with e.g. \'`add>thought>` my new thought\'.');
                    } else {
                        let node = await (Executors.addEntity(cmd, session, this));
                        pods = Executors.singleEntityPod(node, 'The new node has been added.');
                    }
                    break;
            }

        } else {
            if (utils.isUndefined(cmd.FirstParameter)) {
                pods = Executors.messagePods(Executors.NotOK + ' If you want to add an entity, try with e.g. \'add>thought>...\'.');
            } else {
                // if no addditional command the default is adding a thought
                let node = await (this.addEntity(session, cmd.Commands[1], cmd.FirstParameter));
                pods = Executors.singleEntityPod(node, 'The new node has been added.');
            }

        }
        return pods;
    }

}

module.exports = Add;
