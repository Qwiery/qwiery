const WorkflowState = require("../../WorkflowState"),
    _ = require('lodash'),
    utils = require("../../../../utils"),
    constants = require("../../../../constants"),
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await');
class DecisionState extends WorkflowState {
    constructor(settings) {
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
            that._isActive = false;
            const transitionValue = waitFor(that.workflow.interprete(that.transition, that.workflow));
            let convertedValue = utils.tryConvertToBoolean(transitionValue);
            // that moves the flow to the next state
            waitFor(that.accept(convertedValue));
            return false;
        }

        return async(runner)();
    }

    toJSON() {
        let json = super.toJSON();
        json.transition = this.transition;
        return json;
    }
}
module.exports = DecisionState;