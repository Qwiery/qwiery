const WorkflowState = require("../../WorkflowState"),
    _ = require('lodash'),
    utils = require("../../../../utils");

class DecisionState extends WorkflowState {
    constructor(settings) {
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
        that._isActive = false;
        const transitionValue = await (that.workflow.interprete(that.transition, that.workflow));
        let convertedValue = utils.tryConvertToBoolean(transitionValue);
        // that moves the flow to the next state
        await (that.accept(convertedValue));
        return false;
    }

    toJSON() {
        let json = super.toJSON();
        json.transition = this.transition;
        return json;
    }
}
module.exports = DecisionState;
