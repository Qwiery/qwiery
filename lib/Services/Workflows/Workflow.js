/*
 Deal with running and managing workflows defined though QTL.

 For a tutorial related to creating workflows see http://www.qwiery.com/tutorials/what-is-the-weather/
 */

const
    utils = require('../../utils'),
    Qwiery = require('../../'),
    WorkflowLoader = require('./WorkflowLoader'),
    WorkflowValidation = require('./WorkflowValidation'),
    WorkflowSpy = require('./WorkflowSpy'),
    Language = require('../Language'),
    constants = require('../../constants.js'),
    _ = require('lodash');


/**
 * Defines a state-machine structure.
 */
class Workflow {
    /**
     * Creates an instance of Workflow.
     * @param {any} definition
     *
     * @memberOf Workflow
     */
    constructor(definition = null) {
        this.id = utils.randomId();
        /**
         * Is `true` if the whole flow has been initialized before and `false` if this is a fresh instance which has not been started yet.
         * @type {boolean}
         * @private
         */
        this._isActive = false;
        /**
         * The unique initial state instance.
         * @type {null}
         */
        this.initialState = null;
        /**
         * The collection of state instances.
         * @type {Array}
         */
        this.states = [];
        this.currentStateName = null;
        /**
         * The current active state.
         * @type {null}
         */
        this.currentState = null;
        this.isSuspended = false;
        /**
         * The collection of transition instances.
         * @type {Array}
         */
        this.transitions = [];
        this.session = null;
        this.onActivate = null;
        this.onAccept = null;
        this.onReject = null;
        this.onDeactivate = null;
        this.onExecute = null;
        this.onInfo = null;
        if (!_.isNil(definition)) {
            this.id = definition.id;
            this.onActivate = definition.onActivate || null;
            this.onAccept = definition.onAccept || null;
            this.onReject = definition.onReject || null;
            this.onDeactivate = definition.onDeactivate || null;
            this.onExecute = definition.onExecute || null;
            this.onQuit = definition.onQuit || null;
            this.onInput = definition.onInput || null;
            this.onInfo = definition.onInfo || null;
            this.timestamp = definition.Timestamp || new Date();
            this.definition = definition;
            WorkflowValidation.rephrase(definition);
            WorkflowValidation.validateFlow(definition);
        }
        this.constants = {
            discard: Language.getVariation(constants.DISCARDQUESTION),
            saveForLater: 'You have interrupted this task, d\'you want to save it for later?',
        }
    }

    /**
     * Turns the workflow into an active state.
     * @param session
     * @return {*}
     */
    async start(session, spy) {
        const that = this;
        if (_.isNil(spy)) {
            spy = new WorkflowSpy(this);
        } else {
            spy.bindHandlersTo(this);
            spy.flow = this;
        }

        const loader = new WorkflowLoader();
        await loader.load(that.definition, that);
        if (that._isActive) {
            await that._trigger(session, spy);
            return spy
        } else {
            await that._enter(session, spy);
            return spy;
        }

    }

    /***
     * Parses the given object and handles the %if, %eval... instructions.
     * @param obj
     */
    interprete(obj) {
        if (utils.isUndefined(obj)) {
            return Promise.resolve(null);
        }
        if (!this.services || !this.services.qtl) {
            return Promise.resolve(obj);
        }

        // dynamic preprocessing
        return this.services.qtl.mutate(obj, this.session, null, this.variables);
    }

    async _moveToState(newStateName) {
        const that = this;
        await that.currentState.deactivate();
        // state existence has been checked earlier, no need anymore here
        that.previousStateName = that.currentStateName;
        that.currentStateName = newStateName;
        that.currentState = that.findState(newStateName);
        return await that.currentState.activate();
    }

    findTransition(from, value) {
        return WorkflowValidation.findTransition(from, value, this);
    }

    findState(name) {
        return WorkflowValidation.findState(name, this);
    }

    forgetIt(forceMessage) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that._deleteWorkflow().then(function () {
                if (utils.isDefined(forceMessage)) {
                    that._quit(forceMessage);
                } else {
                    let message = utils.isDefined(that.quitFlowMessage) ? that.quitFlowMessage : that.constants.discard;
                    that._quit(message);
                }

                resolve();
            });
        });
    }

    get isActive() {
        return this._isActive;
    }

    /**
     * Serializes this instance.
     *
     * @returns {any}
     *
     * @memberOf Workflow
     */
    toJSON() {
        let i;
        const flow = {
            Id: this.id,
            Name: this.name,
            IsActive: this._isActive,
            Variables: this._variables,
            CurrentState: this.currentStateName,
            PreviousState: this.previousStateName,
            IsSuspended: this.isSuspended,
            Quit: this.quitFlowMessage,
            SaveReminder: this.saveReminder,
            Reminder: this.reminderMessage,
            Effects: this.effects,
            Timestamp: this.timestamp,
            States: [],
            Transitions: []
        };
        for (i = 0; i < this.states.length; i++) {
            const state = this.states[i];
            flow.States.push(state.toJSON());
        }
        for (i = 0; i < this.transitions.length; i++) {
            const transition = this.transitions[i];
            flow.Transitions.push(transition.toJSON());
        }
        return flow;
    }

    /**
     * Picks out the 'var_' prefixed items in the given input and uses the variable in the given workflow to
     * replace them.
     * @param message {string} Some input string.
     * @param workflow {Workflow} A workflow instance.
     * @return {string} The replaced string.
     * @private
     */
    static _replaceVariables(message, workflow) {
        if (utils.isUndefined(workflow)) {
            throw new Error('Missing workflow instance.')
        }
        if (!(workflow instanceof Workflow)) {
            throw new Error('Expecting a Workflow instance.');
        }
        //replacing acquired variables
        const varnames = message.match(/(var\_)\w*/gi);
        if (varnames && varnames.length > 0) {
            _.forEach(varnames, function (p) {
                p = p.trim().replace(/(var\_)/gi, '');
                const found = workflow._variables[p];
                if (found) message = message.replace(new RegExp('var_' + p, 'gi'), found);
            })
        }
        return message;
    }

    /**
     * Gets the variables collected by this flow.
     * @return {*|{}}
     */
    get variables() {
        return this._variables;
    }

    /**
     * Runs the flow with the given input.
     * Nothing is saved, this runs the flow in memory without leaving a trace.
     * @param inputs {string|array<string>} A single string or an array of inputs.
     * @return {Promise<WorkflowSpy>} A WorkflowSpy instance gives access to all flow data.
     */
    run(inputs) {
        if (_.isString(inputs)) {
            inputs = [inputs];
        }
        return Workflow.run(this, inputs);
    }

    stateNameExists(name) {
        return WorkflowValidation.stateNameExists(name, this);
    }

    /**
     * Runs the flow with the given input.
     * Nothing is saved, this runs the flow in memory without leaving a trace.
     * @param def {any} A workflow definition.
     * @param inputs {string|array<string>} A single string or an array of inputs.
     * @return {Promise<WorkflowSpy>} A WorkflowSpy instance gives access to all flow data.
     */
    static run(def, inputs) {
        if (_.isString(inputs)) {
            inputs = [inputs];
        }
        return new Promise(function (resolve, reject) {
            const flow = (def instanceof Workflow) ? def : new Workflow(def);
            const spy = new WorkflowSpy(flow, {trace: true, debugMessages: true, immediate: false});

            function next() {
                if (flow.isSuspended !== false) {
                    flow._info('Flow is suspended, no further processing.');
                    resolve(spy);
                } else {
                    if (inputs.length > 0) {

                        const input = inputs.shift();
                        const session = Qwiery.newSession(input.toString());
                        flow.start(session).then(function () {
                            next();
                        });
                    } else {
                        resolve(spy);
                    }
                }
            }

            next();
        });
    }

    /***
     * Fetches the activation message from the current state without executing it with the session's Input.
     * This needs to be called the first time the flow is ran or after suspension.
     * @param session
     * @param spy
     * @returns {Promise<string>}
     */
    async _enter(session, spy) {
        if (this._isActive) {
            throw new Error('Cannot enter an active flow, use the \'start\' method instead.');
        }

        const that = this;

        that.session = session;

        if (that.onInput) {
            that.onInput(session.Input.Raw, this);
        }
        if (that.states.length === 0) {
            return 'Nothing to run, the workflow has no states.'
        }
        // the workflow is active if there is an active state
        that._isActive = true;
        that.isSuspended = false;


        if (utils.isUndefined(that.currentStateName) || that.currentStateName.length === 0) {
            await (that._moveToInitialState());
        }

        // a single-state should never be saved
        if (that.currentState.isInitial && that.currentState.isFinal) {
            that.neverSave = true;
            await (that.currentState.activate());
            await (that._checkAndHandleFinalState());
        } else {
            const dosave = await (that.currentState.activate());
            if (dosave) {
                await (that._upsertWorkflow());
            }
        }
        return spy;
    }

    async _trigger(session, spy) {

        const that = this;

        // the workflow is active if there is an active state
        that._isActive = true;
        that.isSuspended = false;
        that.session = session;
        if (that.onInput) {
            that.onInput(session.Input.Raw, this);
        }
        if (utils.isUndefined(that.currentState)) {
            throw new Error('This should not happen, use the \'start\' method to get rolling. Check that the WorkflowLoader was used to deserialize the flow.');
        }

        // does the user want to quit that flow?
        const doesQuit = await (that._isQuitting());
        if (!doesQuit) {
            await (that._executeCurrentState());
        }
        return spy;
    }

    /***
     * Uses the 'onInfo' handler (if defined on workflow level)f or notifications.
     * @param msg A message.
     * @private
     */
    _info(msg) {
        if (this.onInfo) {
            this.onInfo(msg);
        }
    }

    _upsertWorkflow() {
        if (this.neverSave === true) {
            this._info('The \'neverSafe\' flag blocked upserting the workflow.');
            return Promise.resolve();
        }
        const jsonFlow = this.toJSON();
        if (this.workflowStorage) {
            return this.workflowStorage.upsertWorkflow(jsonFlow, this.session.Context);
        } else {
            return Promise.resolve();
        }
    }

    _quit(message) {
        if (this.onQuit) {
            this.onQuit(message);
        }
    }

    _deleteWorkflow() {
        if (this.workflowStorage) {
            return this.workflowStorage.deleteWorkflow(this.id, this.session.Context);
        } else {
            return Promise.resolve();
        }
    }

    /***
     * Activate the initial state (which can perform initializations)
     * and set then the current state to the one pointed out by the initial state.
     * @private
     */
    _moveToInitialState() {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.currentState = that.initialState;
            that.previousStateName = null;
            that.currentStateName = that.initialState.name;
            resolve();
        });
    }

    async _isQuitting() {
        const that = this;
        const input = that.session.Input.Raw;
        const isQuit = require('../Language').isQuit(input);
        if (isQuit) {
            let message;
            // user quits the workflow, are we supposed to save it as a task?
            if (utils.isDefined(that.saveReminder) && that.saveReminder === true) {
                if (utils.isUndefined(that.reminderMessage)) {
                    throw new Error('Workflow \'' + that.name + '\'should be reminded but missing the Reminder.');
                }
                // that forces the user to tell what to do with the interrupted flow
                that.isSuspended = 'undecided';
                message = that.quitMessage || that.constants.saveForLater;
                that._quit(message);

                that._upsertOrDelete().then(function () {
                    return true;
                });
            } else {
                // the flow can be forgotten altogether
                await that.forgetIt();
                return true;
            }

        } else {
            return false;
        }
    }

    _executeCurrentState() {
        return this.currentState.execute(this.session.Input.Raw)
    }

    _summarizeWorkflow() {
        let summary = '';
        _.forEach(this._variables, function (v, k) {
            if (utils.isDefined(v) && v.toString().trim().length > 0) {
                summary += '\n\t- ' + k + ': ' + v;
            }
        });
        return summary;
    }

    _acceptedExecution(transitionValue, state) {
        const that = this;
        return new Promise(function (resolve, reject) {
            // the execution of the final state does not change the flow
            if (state.isFinal) {
                that._upsertOrDelete().then(function () {
                    resolve();
                });
                // that._checkAndHandleFinalState().then(function() {
                //     that._upsertOrDelete().then(function() {
                //         resolve();
                //     });
                // });
            } else {
                if (utils.isUndefined(transitionValue)) {
                    throw new Error('Accepted execution did not give a transition to perform.');
                }
                const tr = that.findTransition(that.currentStateName, transitionValue);
                if (utils.isUndefined(tr)) {
                    reject(new Error('Unknown transition given, from \'' + that.currentStateName + '\' with value \'' + transitionValue + '\'.'));
                } else {
                    that._moveToState(tr.to).then(function (doContinue) {
                        if (doContinue === false) {
                            resolve();
                        } else {
                            that._checkAndHandleFinalState().then(function () {
                                that._upsertOrDelete().then(function () {
                                    resolve();
                                });
                            });
                        }

                    });
                }

            }
        });
    }

    /***
     * Handles the case that the currentstate is final. If this is the case
     * The final state is automatically executed.
     * It does not upsert or delete the flow, use _upsertOrDelete for this.
     * @returns {Promise}
     * @private
     */
    async _checkAndHandleFinalState() {
        const that = this;
        if (this.currentState.isFinal === true) {
            await that._executeCurrentState();
            await that.currentState.deactivate();
            that._isActive = false;
            that.currentState = null;
            that.currentStateName = null;
            that.previousStateName = null;

        }
    }

    /**
     * Will upsert the flow is active otherwise delete it since in that case it has terminated.
     * @return {Promise}
     * @private
     */
    _upsertOrDelete() {
        if (this._isActive) {
            return this._upsertWorkflow();
        } else {
            // todo: need to add to a Trace?
            return this._deleteWorkflow();
        }
    }


    /**
     * Called by a state rejecting the execution thus saving the flow without modification.
     * @return {Promise}
     * @private
     */
    _rejectedExecution() {
        return this._upsertOrDelete();
    }

}


module.exports = Workflow;
