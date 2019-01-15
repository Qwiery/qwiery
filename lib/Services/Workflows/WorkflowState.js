const
    utils = require('../../utils'),
    language = require('../../Services/Language'),
    _ = require('lodash');

/**
 * A state in a workflow.
 * @class WorkflowState
 */
class WorkflowState {
    /**
     * Creates an instance of WorkflowState.
     *
     * @memberOf WorkflowState
     * @param options
     */
    constructor(options) {
        this.id = utils.randomId();
        /**
         * The unique name of this state inside the workflow.
         * The uniqueness is checked when the workflow is instantiated.
         */
        this.name = utils.randomId();
        /**
         * The message to the caller when this state gets activated.
         *
         */
        this.enterMessage = null;
        /**
         * The message to the caller when this activate state is triggered and
         * executes its logic.
         */
        this.executeMessage = null;
        /**
         * The message to the caller when this state has accepter transition and
         * is being deactivated by the workflow.
         */
        this.deactivateMessage = null;
        /**
         * The message to the caller when after execution the state accepts to let the transition
         * happen to another state.
         */
        this.acceptMessage = null;
        /**
         * The message to the caller when after execution the state rejects the input
         * and notifies the workflow that it wish to remain in the current active state.
         */
        this.rejectMessage = null;
        this._isActive = false;
        /**
         * Event handler called when this state is activated.
         */
        this.onActivate = null;
        /**
         * Event handler called when this state is executed.
         */
        this.onExecute = null;
        /**
         * Event handler called when this state is deactivated.
         */
        this.onDeactivate = null;
        /**
         * Event handler called when this state accepts the input and about to transition.
         */
        this.onAccept = null;
        /**
         * Event handler called when this state rejects the input and remains in the current state.
         */
        this.onReject = null;
        this.sideEffect = null;
        /**
         * The workflow owning this state.
         */
        this.workflow = null;
        /**
         * Parameters attached to this state.
         */
        this.parameters = {};


        // transfer the options to this instance
        _.assign(this, options);
    }

    /**
     * Gets whether this state is active.
     * @return {boolean} `true` if this is the active state of the flow.
     */
    get isActive() {
        return this._isActive;
    }


    /**
     * Sets a variable on the workflow level.
     * This should be used by states to consolidate results of a flow. When a flow has terminated
     * all variables sit in the `variables` collection of the flow.
     * @param {any} value The value to store.
     * @param {string} [varname] The optional name of the variable. If not set the name of the state will be used.
     *
     * @memberOf WorkflowState
     */
    setVariable(value, varname) {
        if (!this.workflow) {
            return; // happens only with unit tests really
        }
        if (utils.isUndefined(this.workflow.variables)) {
            this.workflow.variables = {};
        }
        if (utils.isUndefined(varname)) {
            this.workflow.variables[this.name] = value;

        } else {
            this.workflow.variables[varname] = value;
        }
    }

    /**
     * Returns the value of the variable sitting in the `variables` collection of the flow.
     *
     * @param {string} varname The name of the variable.
     *
     * @memberOf WorkflowState
     */
    getVariable(varname) {
        if (utils.isUndefined(this.workflow.variables)) {
            this.workflow.variables = {};
        }
        return this.workflow.variables[varname]
    }

    /***
     * This should return true is the flow has to be saved after activation.
     * @param raiseEvent When the flow is reloaded fron JSON the active state should be reactivated but not raise events, in this case this param needs to be false.
     * @returns {Promise<boolean>} The boolean indicates whether the flow can serialized itself after this action. Defaults to true.
     */
    async activate(raiseEvent = true) {
        const that = this;

        if (that.onActivate && (raiseEvent === undefined || raiseEvent === true)) {
            if (that.workflow) {
                const message = await (that.workflow.interprete(that.enterMessage));
                that.onActivate(message, that);
            } else {
                if (_.isString(that.enterMessage)) {
                    that.onActivate(that.enterMessage, that);
                } else {
                    that.onActivate('Cannot interprete some stuff because the context of the workflow state is not set.', that);
                }
            }

        }
        that._isActive = true;
        return true; // true means here that it's OK to save the flow after this state has been activated
    }

    /**
     * Deactivates this state.
     * Note that it does not engage the process of activating the next state, it only set this state to non-active.
     * @returns {Promise}
     *
     * @memberOf WorkflowState
     */
    async deactivate() {
        const that = this;

        if (that.onDeactivate) {

            if (that.workflow) {
                const message = await (that.workflow.interprete(that.deactivateMessage));
                that.onDeactivate(message, that);
            } else {
                if (_.isString(that.deactivateMessage)) {
                    that.onDeactivate(that.deactivateMessage, that);
                } else {
                    that.onDeactivate('Cannot interprete some stuff because the context of the workflow state is not set.', that);
                }
            }
        }
        that._isActive = false;
    }

    /**
     * Executes the logic of this state for the given input.
     *
     * @param {any} input The input triggering this state.
     *
     * @memberOf WorkflowState
     */
    async execute(input) {
        if (!this._isActive) {
            throw new Error('Cannot execute since the state is not active.');
        }
        const that = this;

        if (that.isFinal) {
            that.setVariable('Done', that.variable);
        } else {
            that.setVariable(input, that.variable);
        }
        if (that.onExecute) {
            if (that.workflow) {
                const message = await (that.workflow.interprete(that.executeMessage));
                that.onExecute(message, input, that);
            } else {
                if (_.isString(that.executeMessage)) {
                    that.onExecute(that.executeMessage, input, that);
                } else {
                    that.onExecute('Cannot interprete some stuff because the context of the workflow state is not set.', that);
                }
            }
        }

        return that.accept(true);

    }

    /**
     * Accepts the execution and notifies the flow it can be deactivated.
     *
     * @param {any} [transitionValue=true] The value used to determines the transition to use to the next state.
     * @returns {Promise}
     *
     * @memberOf WorkflowState
     */
    async accept(transitionValue = true) {
        const that = this;

        if (that.onAccept) {
            if (that.workflow) {
                const message = await (that.workflow.interprete(that.acceptMessage));
                //console.log(that.acceptMessage + ">>"+message);
                that.onAccept(message, transitionValue, that);
            } else {
                if (_.isString(that.acceptMessage)) {
                    that.onAccept(that.acceptMessage, transitionValue, that);
                } else {
                    that.onAccept('Cannot interprete some stuff because the context of the workflow state is not set.', transitionValue, that);
                }
            }
        }
        if (that.workflow) {
            await (that.workflow._acceptedExecution(transitionValue, that));
        }
    }

    /**
     * Rejects the execution of this state, notifying the flow it wishes to remain the active state.
     *
     * @param {any} reason The reason why the state rejects the transition.
     *
     * @memberOf WorkflowState
     */
    async reject(reason) {


        const that = this;

        if (that.onReject) {
            if (that.workflow) {
                const message = await (that.workflow.interprete(that.rejectMessage));
                that.onReject(reason || message, reason, that);
            } else {
                if (_.isString(that.rejectMessage)) {
                    that.onReject(reason || that.rejectMessage, reason, that);
                } else {
                    that.onReject('Cannot interprete some stuff because the context of the workflow state is not set.', that);
                }
            }
        }
        if (that.workflow) {
            await (that.workflow._rejectedExecution());
        }

    }

    /**
     * Serializes this instance.
     *
     * @returns {any}
     *
     * @memberOf WorkflowState
     */
    toJSON() {
        let {
            name,
            id,
            type,
            enterMessage,
            executeMessage,
            deactivateMessage,
            acceptMessage,
            rejectMessage,
            isInitial,
            isFinal,
            sideEffect,
            _isActive,
            variable
        } = this;
        return {
            name,
            id,
            type,
            enterMessage,
            executeMessage,
            deactivateMessage,
            acceptMessage,
            rejectMessage,
            isInitial,
            isFinal,
            sideEffect,
            _isActive,
            variable,
            parameters: {}
        };
    }

    static getVariation(type) {
        return language.getVariation(type);
    }
}

module.exports = WorkflowState;
