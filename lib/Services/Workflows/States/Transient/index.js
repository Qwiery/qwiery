const WorkflowState = require("../../WorkflowState"),
    _ = require('lodash');

/**
 * This state allows for side-effects.
 * When the state gets activated it will executes some bits of code and then
 * move on to the next state.
 * @class TransientState
 */
class TransientState extends WorkflowState {
    constructor(settings) {
        settings = _.assign(settings, {
            rejectMessage: null,
            acceptMessage: null
        });
        super(settings);
    }


    async activate(raiseEvent = true) {
        const that = this;

        if (that.onActivate && (raiseEvent === undefined || raiseEvent === true)) {
            if (that.workflow) {
                const message = await (that.workflow.interprete(that.enterMessage, that.workflow));
                that.onActivate(message, that);
            } else {
                that.onActivate(that.enterMessage, that);
            }
        }
        if (raiseEvent === false) {
            that._isActive = true;
            return false;
        }
        that.setVariable("Hello there!", that.variable || "SideEffect");
        that._isActive = false;
        // that moves the flow to the next state
        await (that.accept(true));
        return false;

    }
}
module.exports = TransientState;
