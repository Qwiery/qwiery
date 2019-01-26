const
    utils = require('../../utils'),
    constants = require('../../constants'),
    WorkflowState = require('./WorkflowState'),
    StateTransition = require('./StateTransition'),
    WorkflowValidation = require('./WorkflowValidation'),
    path = require('path'),
    fs = require('fs-extra'),
    _ = require('lodash');

/**
 * Manages the loading of workflows and related elements.
 * @class WorkflowLoader
 */
class WorkflowLoader {
    constructor() {

    }

    load(definition, workflow) {
        this.flow = workflow;
        return this._loadDefinition(definition);
    }

    /***
     * Deserializes the given flow.
     * @param definition
     * @private
     */
    async _loadDefinition(definition) {
        const that = this;
        const flow = this.flow;
        if (flow.hasBeenLoaded === true) {
            return Promise.resolve();
        }
        let i;
        flow.name = definition.Name || utils.randomId();
        flow._isActive = definition.IsActive || false;
        if (definition.Id) {
            flow.id = definition.Id;
        }
        flow.isSuspended = definition.IsSuspended || false;
        flow.saveReminder = definition.SaveReminder || false;
        flow.neverSave = definition.NeverSave || false;
        flow.quitFlowMessage = definition.Quit || null;
        flow.reminderMessage = definition.Reminder;
        flow.currentStateName = definition.CurrentState;
        flow.previousStateName = definition.PreviousState || null;
        flow._variables = _.clone(definition.Variables || {});
        flow.effects = definition.Effects || {};
        if (utils.isDefined(definition.States)) {

            for (i = 0; i < definition.States.length; i++) {
                const statedef = definition.States[i];
                that._addState(statedef);
            }
        }

        if (utils.isDefined(definition.Transitions)) {
            for (i = 0; i < definition.Transitions.length; i++) {
                const trdef = definition.Transitions[i];
                that._addTransition(trdef);
            }
        }
        if (utils.isDefined(flow.currentStateName) && flow.stateNameExists(flow.currentStateName)) {
            flow.currentState = _.find(flow.states, {name: flow.currentStateName});
            await flow.currentState.activate(false); // don't raise the event here
            flow.hasBeenLoaded = true;
        } else {
            flow.hasBeenLoaded = true;
        }
    }

    /**
     * Instantiates the workflow state from the given definition.
     * @param stateDefinition
     * @return {*}
     */
    static createInstance(stateDefinition) {
        let type = stateDefinition.type;
        let modulePath = stateDefinition.path;
        let instance = null;
        const hasType = utils.isDefined(type);
        const hasPath = utils.isDefined(modulePath);
        if (hasPath) {// external
            modulePath = modulePath.replace('%plugins', path.join(process.cwd(), constants.QWIERYPACKAGEDIR, 'packages'));
            const exists = fs.existsSync(modulePath);
            if (!exists) {
                throw new Error(`Path to workflow state '${modulePath}' definition does not exist.`);
            }
            try {
                let classDefinition = require(modulePath);
                instance = new classDefinition(stateDefinition);
            } catch (e) {
                throw new Error(`Failed to load state '${type}': ${e.message}.`);
            }
        } else if (hasType) { // internal
            if (type.toLowerCase().slice(-5) === 'state') {
                type = type.slice(0, -5);
            }
            try {
                let classDefinition = require(path.join(__dirname, 'States', type));
                instance = new classDefinition(stateDefinition);
            } catch (e) {
                throw new Error(`Failed to load state '${type}': ${e.message}.`);
            }
        } else { // inline
            instance = stateDefinition;
        }
        return instance;
    }

    _addState(stateDefinition) {
        if (utils.isUndefined(stateDefinition)) {
            throw new Error('Cannot add undefined state to the workflow.');
        }
        // if(utils.isUndefined(stateDefinition.type) && utils.isUndefined(stateDefinition.type)) {
        //     throw new Error("No type specified on the workflow state definition.");
        // }
        if (utils.isUndefined(stateDefinition.name)) {
            throw new Error('No name specified on the workflow state definition.');
        }
        const newState = WorkflowLoader.createInstance(stateDefinition);
        if (utils.isDefined(newState)) {
            this._addStateInstance(newState);
        }

    }

    _addTransition(transitionDefinition) {
        if (utils.isUndefined(transitionDefinition)) {
            throw new Error('Cannot add undefined transition to the workflow.');
        }
        if (utils.isUndefined(transitionDefinition.from)) {
            throw new Error('Transition without \'from\' field.');
        }
        if (utils.isUndefined(transitionDefinition.to)) {
            throw new Error('Transition without \'to\' field.');
        }
        if (utils.isUndefined(transitionDefinition.value)) {
            transitionDefinition.value = true;
        }
        if (WorkflowValidation.transitionsExists(transitionDefinition, this.flow)) {
            throw new Error('Cannot add duplicate transition.');
        }
        WorkflowValidation.checkEndpointsExist(transitionDefinition, this.flow);
        this._addTransitionInstance(new StateTransition(transitionDefinition));
    }

    /**
     * Adds the given transition instance to the flow.
     * @param transition {WorkflowTransition} A workflow transition.
     * @private
     */
    _addTransitionInstance(transition) {
        WorkflowValidation.checkDuplicateTransition(transition, this);
        this.flow.transitions.push(transition);
    }

    /**
     * Adds the given state instance to the flow.
     * @param state {WorkflowState} A workflow state.
     * @private
     */
    _addStateInstance(state) {
        if (utils.isUndefined(state)) {
            throw new Error('Cannot add undefined state.');
        }
        WorkflowValidation.validateStateInstance(state, this);
        state.workflow = this.flow;
        if (state.isInitial === true) {
            if (utils.isDefined(this.initialState)) {
                throw new Error('Cannot add a second initial state to the workflow.');
            }
            this.flow.initialState = state;
        }
        this.flow.states.push(state);
        this._transferHandlersToState(state);
    }

    /**
     * Assigns the workflow handlers to the state instance.
     * @param state {WorkflowState} A state instance.
     * @private
     */
    _transferHandlersToState(state) {
        state.onActivate = this.flow.onActivate;
        state.onAccept = this.flow.onAccept;
        state.onReject = this.flow.onReject;
        state.onDeactivate = this.flow.onDeactivate;
        state.onExecute = this.flow.onExecute;
    }
}

module.exports = WorkflowLoader;
