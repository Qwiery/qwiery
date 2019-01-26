const utils = require('../../utils');

class WorkflowStateOptions {
    constructor() {
        this._id = utils.randomId();


        /**
         * The unique name of this state inside the workflow.
         * The uniqueness is checked when the workflow is instantiated.
         */
        this._name = utils.randomId();
        /**
         * The message to the caller when this state gets activated.
         *
         */
        this._enterMessage = null;
        /**
         * The message to the caller when this activate state is triggered and
         * executes its logic.
         */
        this._executeMessage = null;
        /**
         * The message to the caller when this state has accepter transition and
         * is being deactivated by the workflow.
         */
        this._deactivateMessage = null;
        /**
         * The message to the caller when after execution the state accepts to let the transition
         * happen to another state.
         */
        this._acceptMessage = null;
        /**
         * The message to the caller when after execution the state rejects the input
         * and notifies the workflow that it wish to remain in the current active state.
         */
        this._rejectMessage = null;
        /**
         * Event handler called when this state is activated.
         */
        this._onActivate = null;
        /**
         * Event handler called when this state is executed.
         */
        this._onExecute = null;
        /**
         * Event handler called when this state is deactivated.
         */
        this._onDeactivate = null;
        /**
         * Event handler called when this state accepts the input and about to transition.
         */
        this._onAccept = null;
        /**
         * Event handler called when this state rejects the input and remains in the current state.
         */
        this._onReject = null;

        /**
         * Parameters attached to this state.
         */
        this._parameters = {};
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get enterMessage() {
        return this._enterMessage;
    }

    set enterMessage(value) {
        this._enterMessage = value;
    }

    get executeMessage() {
        return this._executeMessage;
    }

    set executeMessage(value) {
        this._executeMessage = value;
    }

    get deactivateMessage() {
        return this._deactivateMessage;
    }

    set deactivateMessage(value) {
        this._deactivateMessage = value;
    }

    get acceptMessage() {
        return this._acceptMessage;
    }

    set acceptMessage(value) {
        this._acceptMessage = value;
    }

    get rejectMessage() {
        return this._rejectMessage;
    }

    set rejectMessage(value) {
        this._rejectMessage = value;
    }

    get onActivate() {
        return this._onActivate;
    }

    set onActivate(value) {
        if (!_.isNil(value) && !_.isFunction(value)) {
            throw new Error('The value of onActivate should be a function or nil.');
        }
        this._onActivate = value;
    }

    get onDeactivate() {
        return this._onDeactivate;
    }

    set onDeactivate(value) {
        if (!_.isNil(value) && !_.isFunction(value)) {
            throw new Error('The value of onDeactivate should be a function or nil.');
        }
        this._onDeactivate = value;
    }

    get onAccept() {
        return this._onAccept;
    }

    set onAccept(value) {
        if (!_.isNil(value) && !_.isFunction(value)) {
            throw new Error('The value of onAccept should be a function or nil.');
        }
        this._onAccept = value;
    }

    get onReject() {
        return this._onReject;
    }

    set onReject(value) {
        if (!_.isNil(value) && !_.isFunction(value)) {
            throw new Error('The value of onReject should be a function or nil.');
        }
        this._onReject = value;
    }

    get parameters() {
        return this._parameters;
    }

    set parameters(value) {
        this._parameters = value;
    }
}

module.exports = WorkflowStateOptions;
