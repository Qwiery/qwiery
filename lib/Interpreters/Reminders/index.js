const InterpreterBase = require("../../Framework/InterpreterBase");
const constants = require("../../constants");
const _ = require('lodash');
class Reminders extends InterpreterBase {
    constructor() {
        super("reminders");
    }
    processMessage(session) {
        return new Promise(function(resolve, reject) {
            const ctx = session.Context;
            // in extreme case of threshold==1 this will check at every request and remind with every request
            if(Math.random() <= config.remindersThreshold) {
                // pushing a reminder works if the answer if not an object, but just a string
                if(!_.isArray(session.Output.Answer)) {
                    console.warn("Error> does not generate pods.");
                    console.warn("Question> '" + session.Input.Raw);
                    console.warn("Answer> '" + session.Output.Answer);
                    resolve(session);
                }
                if(session.Output.Answer[0].DataType === constants.podType.Text) {
                    this.getRandomReminder(ctx).then(function(reminderDescription) {
                        if(reminderDescription.length > 0) {
                            session.Output.Answer[0].Content += "\n\nBTW, I'd like to remind you: " + reminderDescription;
                        }
                        resolve(session);
                    });

                }
            }
            resolve(session);
        });
    }

    getRandomReminder(ctx) {
        // other things (inferred tasks) can be recalled but let's say that
        // only suspended tasks are important
        return new Promise(function(resolve, reject) {
            services.workflow.getSuspendedWorkflows(ctx).then(function(sus) {
                if(utils.isUndefined(sus) || sus.length === 0) {
                    resolve("");
                } else {
                    const one = _.sample(sus);
                    if(one.Reminder) {
                        resolve(services.workflow.getReminder(one));
                    } else {
                        resolve("Task with id '" + one.Id + "' is pending.");
                    }
                }
            });
        });

    }
}

module.exports = Reminders;