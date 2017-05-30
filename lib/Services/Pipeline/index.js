const path = require("path"),
    _ = require("lodash"),
    assert = require("assert"),
    fs = require("fs-extra"),
    ServiceBase = require('../../Framework/ServiceBase'),
    InterpreterBase = require('../../Framework/InterpreterBase'),
    constants = require("../../constants"),
    utils = require("../../utils");

class ParallelAnswering {
    constructor(interpreters) {
        this.interpreters = interpreters;
    }

    processMessage(session) {
        if(session.Handled === true) {
            return session;
        }
        const actions = [];
        for(let i = 0; i < this.interpreters.length; i++) {
            const interpreter = this.interpreters[i];
            // cloning otherwise they overwrite each other's Answer
            const clonedSession = session.clone();
            actions.push(interpreter.processMessage(clonedSession));
        }
        return Promise.all(actions).then(function(sessions) {
            let collected = [];
            for(let i = 0; i < sessions.length; i++) {
                const s = sessions[i];
                // if(utils.isUndefined(s)){
                //     console.log(sessions);
                // }
                collected = _.concat(collected, s.Output.Answer)
            }
            if(collected.length > 0) {
                session.Output.Answer = collected;
                session.Handled = true;
                session.Trace.push({HandledBy: "Parallel"});
            }
            return session;
        });
    }
}

/**
 * The answering processor invoking the interpreters.
 * @class Pipeline
 */
class Pipeline extends ServiceBase {
    constructor() {
        super("pipeline");
        this.appInterpreters = {};
    }


    /**
     * The entry-point to answering all your questions.
     * @session
     * @returns {Promise.<T>|*}
     */
    processMessage(session) {
        // if handled it means the question was resolved and services should
        // not further try. If not handled parallel options triggered (Bing, entities etc.) and
        // if all this fails then the NoAnswer service picks up.
        if(!session.BotConfiguration) {
            throw new Error("BotConfiguration has not been set.");
        }
        let ctx = session.Context;
        const that = this;
        // fetch the config of the bot if not known yet
        if(this.appInterpreters[ctx.appId] === undefined) {
            this.createAppInterpreters(session, ctx);
        }

        const appInterpreters = this.appInterpreters[ctx.appId];
        let currentIndex = -1;
        // chaining the appInterpreters and ensuring proper async sequencing
        function next() {
            currentIndex++;
            // an app without appInterpreters only answers with noAnswer
            if(appInterpreters.length === 0) {
                session.Handled = true;
                session.Trace.push({"HandledBy": "NoAnswer"});
                session.Output.Answer = [{
                    Content: session.BotConfiguration.noAnswer,
                    DataType: "Text"
                }];
                return Promise.resolve(session);
            }
            if(currentIndex < appInterpreters.length) {
                const p = appInterpreters[currentIndex].processMessage(session, that);
                // allowing for async processing if interpreter wishes to do so
                // The Beyond interpreter runs parallel answer-resolving for instance.
                return Promise.resolve(p).then(function(newSession) {
                    if(_.isString(newSession)) // lazy interpreter returning a string instead of a session
                    {
                        session.Output.Answer = [{
                            DataType: constants.podType.Text,
                            Content: newSession
                        }];

                        // this automatically implies that the question was handled
                        session.Handled = true;
                        session.Trace.push({"HandledBy": "An intepreter returning a string instead of a session."});
                    } else {
                        session = newSession;
                    }
                    return next();
                });
            }
            return "|Handled> " + session.Input.Raw;
        }

        return next().then(function(v) {
            // there are interpreters but none handled it
            if(!session.Handled) {
                session.Handled = true;
                session.Trace.push({"HandledBy": "NoAnswer"});
                session.Output.Answer = utils.messagePods(session.BotConfiguration.noAnswer);
            }

            if(!session.Timing) { // should be done by historization but if not in the pipeline we'll do here
                session.Output.Timestamp = new Date();
                session.Timing = parseFloat((session.Output.Timestamp - session.Input.Timestamp) / 1000).toFixed(3) + "s";
                const statistics = that.services.statistics;
                if(utils.isDefined(statistics)) {
                    // async saving is OK here
                    statistics.addAnswerTiming(session.Output.Timestamp - session.Input.Timestamp);
                }
            }
            return session;
        });


    }

    findInterpreterInPlugins(name) {
        if(utils.isDefined(this.settings.plugins)) {
            var found = _.find(this.settings.plugins, function(plugin) {
                return plugin.type.toLowerCase() === "interpreter" && plugin.name.toLowerCase() === name.toLowerCase();
            });
            return found || null;
        }
        return null;
    }

    lookInterpreterUp(name) {
        const keys = _.keys(this.interpreters);
        for(let i = 0; i < keys.length; i++) {
            const interpreter = this.interpreters[keys[i]];
            assert(utils.isDefined(interpreter.pluginIdentifier), `The ${interpreter.constructor.name} has no pluginIdentifier.`);
            if(interpreter.pluginIdentifier.toLowerCase() === name.toLowerCase()) {
                return interpreter;
            }
        }
        return null;
    }

    getInterpreter(definition, allowParallel = true) {
        if(_.isPlainObject(definition)) { // an inline interpreter makes it easy to experiment            
            if(definition.processMessage) { // minimum requirement for an operator
                return definition;
            }
        }
        else if(_.isArray(definition) && allowParallel === true) {
            const parInstances = [];
            for(let i = 0; i < definition.length; i++) {
                const parInstanceName = definition[i];
                // settings 'false' otherwise you get parallels inside parallels
                // the recursion does allow for inline parallels however
                const pluginFound = this.getInterpreter(parInstanceName, false);
                if(pluginFound) {
                    parInstances.push(pluginFound);
                }
                else {
                    throw new Error(`The interpreter '${definition}' has not been defined. Add it to the plugins first.`);
                }
            }
            const parallelInterpreter = new ParallelAnswering(parInstances);
            if(utils.isUndefined(parallelInterpreter)) {
                throw new Error("An array was specified in the pipeline but you need to add the 'Parallel' intepreter.");
            }
            return parallelInterpreter;
        }
        else if(_.isString(definition)) {
            // first check whether the name refers to a plugin then check the standard/core interpreters
            const pluginFound = this.lookInterpreterUp(definition);
            if(pluginFound) {
                return pluginFound;
            }
            else {
                throw new Error(`The interpreter '${definition}' has not been defined. Add it to the plugins first.`);
            }

        } else {
            return null;
        }
    }

    createAppInterpreters(session, ctx) {
        const configuration = session.BotConfiguration;
        let interpreter;
        this.appInterpreters[ctx.appId] = [];
        const interpreterNames = configuration.pipeline;
        // if an array of interpreters appears, it means we run them in parallel
        for(let k = 0; k < interpreterNames.length; k++) {
            const definition = interpreterNames[k];
            let found = this.getInterpreter(definition, true);
            if(utils.isDefined(found)) {
                this.appInterpreters[ctx.appId].push(found);
            } else {
                console.warn(`Invalid pipeline interpreter in app '${ctx.appId}'.`);
            }
        }
    }

    /**
     * Creates the interpreters defined by the pipeline configuration.
     * @param session {Session} The current session.
     * @param ctx {SecurityContext} The security context.
     */
    old_createAppInterpreters(session, ctx) {
        const configuration = session.BotConfiguration;
        let interpreter;
        this.appInterpreters[ctx.appId] = [];
        const interpreterNames = configuration.pipeline;
        for(let k = 0; k < interpreterNames.length; k++) {
            if(_.isObject(interpreterNames[k])) { // an inline interpreter makes it easy to experiment
                interpreter = interpreterNames[k];
                if(interpreter.processMessage) { // minimum requirement for an operator
                    this.appInterpreters[ctx.appId].push(interpreter);
                }
            } else if(_.isString(interpreterNames[k])) {
                // first check whether the name refers to a plugin then check the standard/core interpreters
                const pluginFound = this.findInterpreterInPlugins(interpreterNames[k]);
                if(pluginFound) {
                    if(pluginFound.processMessage) { //inline plugin
                        this.appInterpreters[ctx.appId].push({
                            processMessage: pluginFound.processMessage
                        });
                    }
                    else if(pluginFound.path) {
                        if(!fs.existsSync(pluginFound.path)) {
                            throw new Error(`The '${pluginFound.name}' interpreter does not exist at the specified path.`);
                        }
                        const interpreterClass = require(pluginFound.path);
                        const instance = new interpreterClass(this.settings);
                        if(utils.isUndefined(instance.interpreterName)) {
                            throw new Error(`The interpreter ${pluginFound.name} should have a 'interpreterName' property.`);
                        }
                        if(instance.interpreterName !== pluginFound.name) {
                            throw new Error(`The plugin name and the actual implementation have different names: '${instance.interpreterName}' and '${pluginFound.name}'.`)
                        }
                        instance.init(this.settings, this.services);
                        this.appInterpreters[ctx.appId].push(instance);
                    } else {
                        throw new Error("Interpreter plugin is missing 'path' specification or 'processMessage' implementation.");
                    }
                }
                else {
                    interpreter = require("../../Interpreters/" + interpreterNames[k]);
                    if(interpreter.prototype instanceof InterpreterBase) {

                        const op = new interpreter(this.settings);
                        if(utils.isUndefined(op.interpreterName)) {
                            throw new Error(`The interpreter ${interpreterNames[k]} should have a 'interpreterName' property.`);
                        }
                        op.init(this.settings, this.services);
                        this.appInterpreters[ctx.appId].push(op);
                    } else {
                        throw new Error(`The interpreter ${interpreterNames[k]} should inherit from InterpreterBase.`);
                    }
                }

            } else {
                console.warn("Invalid pipeline interpreter in app '" + ctx.appId + "'.");
            }
        }
    }
}

module.exports = Pipeline;