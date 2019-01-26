const
    utils = require('../../utils'),
    _ = require('lodash');
/**
 * Listens to the events raised by a workflow
 * and delivers various utilities to pass this info
 * on as an answer to the pipeline.
 * @class WorkflowSpy
 */
class WorkflowSpy {
    constructor(flow, options = {trace: true, debugMessages: false, immediate: false}) {
        const Workflow = require('./Workflow');
        if(!(flow instanceof Workflow)) {
            throw new Error("The given flow should be a Workflow instance.");
        }
        /**
         * The sequence of activation messages
         * @type {Array}
         */
        this.enterMessages = [];
        this.rejectionMessages = [];
        /**
         * The names of the states that have been visited.
         */
        this.stateSequence = [];
        this.acceptMessages = [];
        this.executeMessages = [];
        this.quitMessage = null;
        this.wasRejected = false;
        /**
         * If the user quit the flow before termination
         * this field is `true`.
         * @type {boolean}
         */
        this.hasQuit = false;
        this.trace = options.trace;
        this.debugMessages = options.debugMessages;
        this.flow = flow;
        this._spy(flow, "onQuit");
        this._spy(flow, "onAccept");
        this._spy(flow, "onReject");
        this._spy(flow, "onDeactivate");
        this._spy(flow, "onExecute");
        this._spy(flow, "onActivate");
        this._spy(flow, "onInput");
        this._spy(flow, "onInfo");
        this.immediate = options.immediate;
        if(this.immediate === true) {
            this.harvest = function(type, msg) {
                if(this.trace === true && utils.isDefined(msg)) {
                    console.log(`|${type}> ${msg}`);
                }
            }
        } else {
            this.harvest = this.collect;
        }
        this.log = [];
    }

    collect(type, msg) {
        if(this.trace === true && utils.isDefined(msg)) {
            if(msg.toString().trim().length > 0) {
                this.log.push([type, msg]);
            }
        }
    }

    /**
     * Spies on the given handler of the flow with the methods in this spy.
     * @param flow
     * @param handlerName
     */
    _spy(flow, handlerName) {
        const that = this;
        if(_.isFunction(flow[handlerName])) {
            const original = flow[handlerName];
            flow[handlerName] = function(...a) {

                that[handlerName](...a);
                return original.call(flow, ...a);
            }
        } else {
            flow[handlerName] = function(...a) {
                that[handlerName](...a);
            };
        }
    }


    onQuit(msg, state) {
        this.hasQuit = true;
        this.quitMessage = msg;
        this.harvest("quit", msg);
    }

    onAccept(msg, transitionValue, state) {

        //if(!state.isFinal) {
        this.acceptMessages.push(msg);
        this.harvest("accept", msg);
        //}
    }

    onReject(msg, reason, state) {
        this.wasRejected = true;
        if(utils.isDefined(msg) && msg.trim().length > 0) {
            this.rejectionMessages.push(msg);
        } else {
            if(this.debugMessages === true) {
                msg = `Activated ${state.name}`;
                this.rejectionMessages.push(msg);
            }
        }
        if(!state.isFinal) {
            this.harvest("reject", msg);
        }
    }

    onDeactivate(msg, state) {
        if(!state.isFinal) {
            this.harvest("deactivate", msg);
        }
    }

    onExecute(msg, input, state) {
        if(utils.isDefined(msg)) {
            if(_.isString(msg) && msg.trim().length === 0) {
                return;
            }
            this.executeMessages.push(msg);
            this.harvest("execute", msg);
        }
    }

    onActivate(msg, state) {
        if(utils.isDefined(msg)) {
            if(_.isString(msg)) {
                if(msg.trim().length > 0) {
                    this.enterMessages.push(msg);
                }
            } else {
                this.enterMessages.push(msg);
            }
        } else {
            if(this.debugMessages === true) {
                msg = `Activated ${state.name}`;
                this.enterMessages.push(msg);
            }
        }
        this.stateSequence.push(state.name);
        this.harvest("activate", msg);
    }

    onInput(msg, state) {
        this.harvest("input", msg);
    }

    onInfo(msg, state) {
        this.harvest("info", msg);
    }

    addInfo(msg) {
        this.harvest("info", msg);
    }

    get lastEnterMessage() {
        return _.last(this.enterMessages);
    }

    get lastRejectionMessage() {
        return _.last(this.rejectionMessages);
    }

    get lastAcceptMessage() {
        return _.last(this.acceptMessages);
    }

    get lastExecuteMessage() {
        return _.last(this.executeMessages);
    }

    /**
     * Returns the essence of the flow's exchanges.
     */
    get summary() {
        return {
            hasQuit: this.hasQuit,
            wasRejected: this.wasRejected,
            enter: this.lastEnterMessage || "",
            reject: this.lastRejectionMessage || "",
            accept: this.lastAcceptMessage || "",
            execute: this.lastExecuteMessage || "",
            quit: this.quitMessage || "",
            log: this.log
        }
    }

    /**
     * Outputs the digest of the exchanges.
     * @return {string}
     */
    get digest() {
        if(this.immediate === true) {
            return;
        }
        let s = "\n\n=====================================";
        s += `\n\t${this.flow.name}`;
        s += "\n=====================================";
        for(let i = 0; i < this.log.length; i++) {
            const item = this.log[i];
            s += `\n|${item[0]}> ${item[1]}`;
        }
        s += "\n=====================================";
        return s;
    }

    get variables() {
        return this.flow.variables;
    }

    rewire(name, flow, obj) {
        flow[name] = function(...a) {
            obj[name](...a);
        }
    }

    bindHandlersTo(flow) {
        const that = this;
        that.rewire("onActivate", flow, that);
        that.rewire("onReject", flow, that);
        that.rewire("onAccept", flow, that);
        that.rewire("onDeactivate", flow, that);
        that.rewire("onExecute", flow, that);
        that.rewire("onInput", flow, that);
        that.rewire("onQuit", flow, that);
    }

    toSummary(question) {
        let content;
        const summary = this.flow._summarizeWorkflow();
        if(summary.trim().length === 0) {
            content = "Let's continue with this task." + "\n\n" + question;
        } else {
            content = "Let's continue with this task. Here is what you told me so far:\n\n" + summary + "\n\n" + question;
        }
        return [{
            DataType: "Text",
            Content: content
        }];
    }

    /**
     * Assembles a pod collection from the workflow spying.
     * @return {array<Pod>} A pod array.
     */
    toAnswer() {
        const r = this.summary;
        let result = null;
        if(r.hasQuit) { // wants to quit, but we need to know what to do with the rest of the flow now
            result = [{
                DataType: "Text",
                Content: r.quit
            }];
        } else {
            if(r.wasRejected) {
                result = [{
                    DataType: "Text",
                    Content: r.reject + " " + r.enter
                }];
            } else {

                if(_.isPlainObject(r.accept)) {
                    result = [r.accept];
                }
                else {
                    if(_.isString(r.accept || "") && _.isString(r.enter)) {
                        result = [{
                            DataType: "Text",
                            Content: (r.accept || "") + " " + r.enter
                        }];
                    } else {
                        // good thing to have multipod answers
                        if(_.isString(r.enter)) {
                            result = [
                                {
                                    DataType: "Text",
                                    Content: r.accept
                                },
                                {
                                    DataType: "Text",
                                    Content: r.enter
                                }
                            ];
                        } else {
                            // the enter is an entity or a plain object
                            result = [
                                {
                                    DataType: "Text",
                                    Content: r.accept
                                },
                                r.enter
                            ];
                        }
                    }
                }
            }
        }
        result = this._replaceSummaryVariable(result);
        return result;
    }

    /**
     * Though all variables have all been replaced by QTL by now,
     * there is the %%summary system variable which can pass there
     * and remain here.
     * It gets replaced by the summary of the workflow.
     * @param result
     * @return {*}
     * @private
     */
    _replaceSummaryVariable(result) {

        let rex = /%%summary/gi;
        const summary = this.flow._summarizeWorkflow();
        _.forEach(result, function(item) {
            if(!item.Content){
                return
            }
            if(utils.isDefined(item.Content.match(rex))) {
                item.Content = item.Content.replace(rex, summary);
            }
        });
        return result;
    }

}
module.exports = WorkflowSpy;
