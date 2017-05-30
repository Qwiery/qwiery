const WorkflowState = require("../../WorkflowState");
const _ = require('lodash');
const utils = require("../../../../utils");
const constants = require("../../../../constants");
class YesNoState extends WorkflowState {
    constructor(settings) {
        settings = _.assign(settings, {
            rejectMessage: WorkflowState.getVariation(constants.YESORNO)
        });
        super(settings);
    }

    execute(input) {
        if(!this.workflow) {
            return Promise.resolve(); // only happens with unittesting standalone states
        }
        // only yes and no types of answers will be accepted
        const booleanInput = require("../../../Language").convertInputToBoolean(input);
        if(utils.isUndefined(booleanInput)) {
            if(utils.isUndefined(this.reintrance)){
                this.reintrance = 0;
            }else{
                this.reintrance += 1;
            }
            if(this.reintrance >= 4) {
                this.workflow.forgetIt(WorkflowState.getVariation(constants.STUBBORN));
            } else {
                return this.reject();
            }
        }
        else {
            if(this.isFinal) {
                this.setVariable("Done", this.variable);
            } else {
                this.setVariable(booleanInput, this.variable);
            }

            return this.accept(booleanInput);
        }
    }

    toJSON() {
        let json = super.toJSON();
        json.reintrance = this.reintrance;
        return json;
    }
}
module.exports = YesNoState;