let utils = require("../../utils"),
    constants = require("../../constants"),
    path = require('path'),
    fs = require('fs-extra'),
    _ = require('lodash');
const InterpreterBase = require("../../Framework/InterpreterBase");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
const OracleService = require("../../Services/Oracle");
const WorkflowState = require("../../Services/Workflows/WorkflowState");
/**
 * Uses the rule-based answering mechanism.
 *
 * @class Edictor
 * @extends {InterpreterBase}
 */
class Edictor extends InterpreterBase {
    constructor() {
        super("oracle");
    }

    /***
     * Initializes this service.
     */
    init(instantiator) {
        super.init(instantiator);
        this.emotions = this.services.emotions; // can be null;
        this.apps = this.services.apps;
        this.graph = this.services.graph;
        if(utils.isUndefined(this.graph)) {
            throw new Error("The Edictor interpreter cannot work without the Graph service, please add it to the configuration.");
        }
        this.oracle = this.services.oracle;
        if(utils.isUndefined(this.oracle)) {
            throw new Error("The Edictor interpreter requires the Oracle service, please add it.");
        }
        if(utils.isUndefined(this.services.qtl)) {
            throw new Error("QTL is not set though it should have been as part of the Oracle service.");
        } else {
            this.qtl = this.services.qtl;
        }
        this.storage = this.services.storage;
        this.personality = this.services.personality;
        this.personalization = this.services.personalization;
        this.topics = this.services.topics;
        this.workflow = this.services.workflows;
        this.system = this.services.system;


        return Promise.resolve();
    }

    initEmotions() {
        // the global setting can switch on/off the usage even if a bot config is present
        if(this.emotions) {

            this.emotions.init();
            // add all the bots

            let configs = this.apps.getAllAppConfigurations();
            for(let i = 0; i < configs.length; i++) {
                const c = configs[i];
                if(c.emotions === true) {
                    this.emotions.addBot(c.id, c.personality);
                }
            }
        }
    }

    resolver(session, resolve) {
        // here we turn the Answer from a QTL format into a UI/pod format
        const pods = this.makePods(session.Output.Answer);
        if(pods.length > 0) {
            session.Output.Answer = pods;
            session.Handled = true;
            session.Trace.push({"HandledBy": "Edictor"});
        }
        resolve(session);
    }

    /***
     * This method is part of the pipeline mechanism.
     * @param session
     * @returns {*}
     */
    processMessage(session) {
        if(session.Handled) {
            return session;
        }
        const that = this;
        return new Promise(function(resolve, reject) {
            that._processMessage.apply(that, [session, resolve, reject]);
        });
    }

    /***
     * Called by the ProcessMessage Promise.
     * @param session The current session.
     * @param resolve The Promise resolve function.
     * @param reject The Promise reject function.
     * @private
     */
    _processMessage(session, resolve, reject) {

        const question = session.Input.Raw;
        const that = this;

        function runner() {
            // first test whether there is a user-specific answer
            let stack = waitFor(that.oracle.ask(question, session, true));
            if(stack === null || stack.length === 0) {
                // use the global oracle to try to answer the question
                stack = waitFor(that.services.oracle.ask(question, session, false));
            }
            if(stack === null || stack.length === 0) {
                // the next service will have to figure it out
                resolve(session);
            } else {
                // keep the Trace unchanged before it's manipulated
                const oracleTrace = _.cloneDeep(stack);
                that.processTemplate(stack[0], session).then(function(session) {
                    // should Qwiery get emotional about the subject?
                    that.dealWithEmotions(session, stack[0].Topics);
                    session.Trace.push({
                        "Module": "Edictor",
                        "What": `Oracle template has been processed.`,
                        "Details": oracleTrace
                    });
                    that.resolver(session, resolve);
                });
            }
        }

        return async(runner)();

    }

    dealWithEmotions(session, topics) {
        if(this.emotions && topics) {
            const configuration = session.BotConfiguration;
            if(utils.isUndefined(configuration)) {
                throw new Error("Catastrophic: the bot definition was not found.");
            }
            if(configuration.emotions !== true) {
                return; // globally enabled but bot ain't using it
            }
            _.forEach(topics, function(topicName) {
                emotionalModule.appraise(topicName, session.Context.appId);
                emotionalModule.printEmotionalState(session.Context.appId);
            });
            /*
             * // show Qwiery is happy with a smiley:
             * if(emotionalModule.qwiery.getCurrentEmotion('joy')>0.7){
             *   if(_.isString(session.Output.Answer){
             *       session.Output.Answer += ":)";
             *   }
             * }
             * */

        }

    }

    /***
     * Called by the ProcessTemplate Promise.
     * @param session
     * @param template
     * @private
     */
    _processTemplate(session, template) {
        if(utils.isUndefined(session)) {
            throw new Error("The 'session' is undefined.");
        }
        if(utils.isUndefined(template)) {
            throw new Error("The 'template' is undefined.");
        }
        const ctx = session.Context;
        const that = this;

        function runner() {

            // preprocessing: this is where everything %if, %else, %rand... is resolved.
            // Except the content of the Workflow (if any) since that has to be dynamic between sessions
            const mutated = waitFor(that.qtl.mutateOracleItem(template, session));

            const executed = waitFor(that.executeTemplate(mutated, session, ctx));

            let answer = executed.Template.Answer;
            // if a CreateReturn was executed it should be returned to the answer
            if(executed.Return) {
                answer = executed.Return;
            }
            // fetches the node
            if(answer.GetNode) {
                const node = waitFor(this.graph.getAccessibleNode(answer.GetNode, ctx));
                if(utils.isUndefined(node)) {
                    answer = "The requested node could not be found, sorry.";
                } else {
                    answer = {
                        "Entity": node,
                        "DataType": constants.podType.SingleEntity
                    };
                }
            }
            // if the redirect was not found the askUntilDone will return the redirection
            if(answer.Redirect) {
                answer = "Ouch, the answer to that got lost somehow.";
            }
            session.Output.Answer = answer;
            return session;
        }

        return async(runner)();

    }

    /***
     * Processes a QTL template.
     * @param template
     * @param session
     * @returns {Promise}
     */
    processTemplate(template, session) {
        const that = this;
        return that._processTemplate.apply(that, [session, template]);

    }

    /***
     * Executes the workflow and returns the response of the active state.
     * @param wf
     * @param session
     * @param spy
     * @returns {*}
     */
    executeWorkflow(wf, session, spy) {
        if(!this.workflow) {
            return Promise.resolve();
        }
        const that = this;
        return new Promise(function(resolve, reject) {
            // first time execution
            // this will save the workflow for the next round of input and processing
            that.services.workflows.runWorkflow(wf, session, spy).then(function(spion) {
                resolve(spion);
            });
        });
    }

    /***
     * Sorta deserialization and execution of the snippet.
     * @param oracleItem
     * @param session
     * @param ctx
     * @returns {*}
     */
    executeTemplate(oracleItem, session, ctx) {
        const that = this;

        function runner() {
            // add the specified topics to the user+topics statistics
            if(oracleItem.Topics && oracleItem.Topics.length > 0) {
                // and if the topics service has been loaded
                if(that.topics) {
                    waitFor(that.topics.addUserTopics(oracleItem.Topics, ctx));
                }
            }
            if(oracleItem.Template.Think) {
                const think = oracleItem.Template.Think;
                // Create something as a side-effect
                if(think.Create) {
                    // if only the titles matter (typically when creating deductions) then this
                    // leads to a semantic graph
                    if(think.Create.Graph.Semantic === true) {
                        waitFor(that.graph.createSemanticGraph(think.Create.Graph, ctx));
                    } else {
                        // when tasks and such are created in QTL
                        waitFor(that.graph.createGraph(think.Create.Graph, ctx));
                    }
                }
                // change parameters
                if(think.Context) {
                    waitFor(that.executeContext(think.Context, ctx));
                }
                // create something and return it as an answer
                if(think.CreateReturn) {
                    // a workflow is the answer
                    if(think.CreateReturn.Workflow) {
                        try {
                            let spy = waitFor(that.executeWorkflow(think.CreateReturn.Workflow, session));
                            // to be handed over to the answer
                            oracleItem.Return = spy.toAnswer();
                        } catch(e) {
                            oracleItem.Return = [{
                                DataType: "Text",
                                Content: WorkflowState.getVariation(constants.INTERNALERROR)
                            }];
                        }
                        session.Handled = true;
                        session.Trace.push({"HandledBy": "Edictor"});
                    } else if(think.CreateReturn.Graph) {
                        let newGraph;
                        // if only the titles matter (typically when creating deductions) then this
                        // leads to a semantic graph
                        if(think.CreateReturn.Graph.Semantic === true) {
                            newGraph = waitFor(this.graph.createSemanticGraph(think.CreateReturn.Graph, ctx));
                        } else {
                            // when tasks and such are created in QTL
                            newGraph = waitFor(that.graph.createGraph(think.CreateReturn.Graph, ctx));
                        }
                        // a graph was created and needs to be returned
                        if(think.CreateReturn.Graph.Nodes.length === 1) {
                            oracleItem.Return = {
                                "Entity": newGraph.Nodes[0],
                                DataType: "SingleEntity"
                            }
                        } else {
                            throw new Error("Returning a multinode graph is not implemented yet.");
                        }
                    }
                }
            }
            return oracleItem;
        }

        return async(runner)();
    }

    /***
     * Executes the context, sets parameters and such.
     * @param context
     * @param ctx
     */
    executeContext(context, ctx) {
        const actions = [];
        const that = this;
        return new Promise(function(resolve, reject) {
            for(let i = 0; i < context.length; i++) {
                const item = context[i];
                if(item.DataType === undefined || item.DataType === "Set") {
                    const name = item.Name;
                    const value = item.Value;
                    if(name.toLowerCase() === "topic") {
                        actions.push(that.topics.addUserTopics(value, ctx));
                        actions.push(that.personalization.addPersonalization("topic", value, ctx));
                    } else if(name.toLowerCase() === "personality") {
                        if(that.services.personality) {
                            actions.push(that.personality.addPersonality(value, ctx));
                        } else {
                            console.warn("Service 'personality' was called but is not registered.");
                        }
                    }
                    else {
                        actions.push(that.personalization.addPersonalization(name, value, ctx));
                    }
                }
            }
            Promise.all(actions).then(function() {
                resolve();
            });
        });

    }

    makePods(answer) {
        let pods = [];
        if(_.isString(answer)) {
            switch(answer.toLowerCase()) {
                case "currentagenda":
                    pods.push({
                        "IsList": true,
                        "DataType": constants.podType.CurrentAgenda
                    });
                    break;
                case "tasks":
                    pods.push({
                        "IsList": true,
                        "DataType": constants.podType.Tasks
                    });
                    break;
                case "people":
                    pods.push({
                        "IsList": true,
                        "DataType": constants.podType.People
                    });
                    break;
                case "thoughts":
                    pods.push({
                        "IsList": true,
                        "DataType": constants.podType.Thoughts
                    });
                    break;
                case "addresses":
                    pods.push({
                        "IsList": true,
                        "DataType": constants.podType.Addresses
                    });
                    break;
                case "favorites":
                    pods.push({
                        "IsList": true,
                        "DataType": constants.podType.Favorites
                    });
                    break;
                default:
                    pods.push({
                        "Content": answer,
                        "DataType": constants.podType.Text
                    });
                    break;
            }
        }
        else if(answer.String) {
            pods.push({
                "Content": answer.String,
                "DataType": constants.podType.Text
            });
        }
        else if(answer.File) {
            try {
                const content = services.documents.getContent(answer.File);
                pods.push({
                    "Content": content,
                    "DataType": constants.podType.SimpleContent
                });
            } catch(e) {
                pods.push({
                    "Content": "The content of this topic could not be found.",
                    "DataType": constants.podType.SimpleContent
                });
            }
        }

        else if(answer.Error) {
            pods.push(_.extend({"DataType": "Error"}, answer));
        }
        else { // returned as-is
            if(_.isArray(answer)) {
                pods = answer;
            } else {
                pods.push(answer);
            }
        }
        return pods;
    }

}
/**
 * @module Edictor
 */
module.exports = Edictor;