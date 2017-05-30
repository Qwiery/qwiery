const WorkflowState = require("../../WorkflowState"),
    _ = require('lodash'),
    utils = require("../../../../utils"),
    constants = require("../../../../constants"),
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await');
class QAState extends WorkflowState {
    constructor(settings) {
        settings = _.merge(settings, {
            rejectMessage: WorkflowState.getVariation(constants.NOTEMPTYALLOWED)
        });
        super(settings);
    }

    execute(input) {
        const that = this;

        function runner() {

            if(that.isFinal) {
                that.setVariable("Done", that.variable);
            } else {
                that.setVariable(input, that.variable);
            }
            if(that.onExecute) {
                if(that.workflow) {
                    const message = waitFor(that.workflow.interprete(that.executeMessage));
                    that.onExecute(message, input, that);
                } else {
                    if(_.isString(that.executeMessage)) {
                        that.onExecute(that.executeMessage, input, that);
                    }
                    else {
                        that.onExecute("Cannot interprete some stuff because the context of the workflow state is not set.", that);
                    }
                }
            }

            return that.accept(true);
        }

        if(!this._isActive) {
            throw new Error("Cannot execute since the state is not active.");
        }
        if(utils.isUndefined(input) || input.trim().length === 0) {
            return this.reject();
        } else {
            return async(runner)();
        }

    }
}
module.exports = QAState;