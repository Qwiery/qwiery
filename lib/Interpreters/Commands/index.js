const
    utils = require('../../utils'),
    Get = require('./get'),
    Add = require('./add'),
    Delete = require('./delete'),
    Search = require('./search'),
    constants = require('../../constants'),
    _ = require('lodash'),
    Language = require('./language'),
    Executors = require('./Executors'),
    Set = require('./Set'),
    Load = require('./Load'),
    Help = require('./help');
const InterpreterBase = require('../../Framework/InterpreterBase');

/**
 * These commands give direct access to the graph and other data.
 *
 * @class Commands
 * @extends {InterpreterBase}
 */
class Commands extends InterpreterBase {
    constructor() {
        super('commands');
    }

    init(instantiator) {
        super.init(instantiator);
        this.handlers = [];
        const actions = [];
        const that = this;
        // todo: move this into the configuration
        [Add, Get, Delete, Search, Language, Set, Help, Load].map(function (h) {
            const instance = new h();
            that.handlers.push(instance);
            actions.push(instance.init(instantiator));
        });
        return Promise.all(actions)
    }

    async processMessage(session) {
        if (session.Handled) {
            return session;
        }
        const question = session.Input.Raw;
        const that = this;

        for (let i = 0; i < that.handlers.length; i++) {
            const handler = that.handlers[i];
            if (handler.canHandle(question)) {
                let pods = await (handler.handle(session));
                if (utils.isUndefined(pods)) {
                    const issue = `Command handler ${handler.constructor.name} did not return  pods as expected.`;
                    session.Output.Answer = Executors.messagePods(issue);
                    session.Handled = true;
                    session.Trace.push({
                        'Module': 'Commands',
                        'What': issue,
                        'Details': handler.constructor.name
                    });
                    session.Trace.push({'HandledBy': 'Commands'});
                }
                if (pods.length > 0) {
                    session.Output.Answer = pods;
                    session.Handled = true;
                    // add trace
                    session.Trace.push({
                        'Module': 'Commands',
                        'What': `Handled by command handler '${handler.constructor.name}'`,
                        'Commands': handler.constructor.name
                    });
                    session.Trace.push({'HandledBy': 'Commands'});
                }
                return session;
            }
        }

        return session;
    }
}

/**
 *
 * @module Commands
 */
module.exports = Commands;
