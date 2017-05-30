const WorkflowState = require("../../WorkflowState"),
    _ = require('lodash'),
    utils = require("../../../../utils"),
    constants = require("../../../../constants"),
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await');

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


    activate(raiseEvent = true) {
        const that = this;

        function runner() {
            if(that.onActivate && (raiseEvent === undefined || raiseEvent === true)) {
                if(that.workflow) {
                    const message = waitFor(that.workflow.interprete(that.enterMessage, that.workflow));
                    that.onActivate(message, that);
                } else {
                    that.onActivate(that.enterMessage, that);
                }
            }
            if(raiseEvent === false) {
                that._isActive = true;
                return false;
            }
            that.setVariable("Hello there!", that.variable || "SideEffect");
            that._isActive = false;
            // that moves the flow to the next state
            waitFor(that.accept(true));
            return false;
        }

        return async(runner)();


    }
}
module.exports = TransientState;