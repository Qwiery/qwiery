const WorkflowState = require("../../WorkflowState"),
    _ = require('lodash'),
    utils = require("../../../../utils"),
    constants = require("../../../../constants");

/**
 * This state allows the user to select from a list of options.
 * @class ChoiceState
 */
class ChoiceState extends WorkflowState {
    constructor(settings) {

        settings = _.merge(settings, {
            rejectMessage: WorkflowState.getVariation(constants.BADCHOICE)
        });
        super(settings);
        let r = "";
        if(utils.isUndefined(this.choices)) {
            throw new Error("The ChoiceState should have one or more options in a 'choices' array.");
        }
        if(!_.isArray(this.choices)) {
            throw new Error("The ChoiceState should have one or more options in a 'choices' array.");
        }
        if(this.choices.length === 0) {
            throw new Error("The ChoiceState should have one or more options in a 'choices' array.");
        }
        for(let i = 0; i < this.choices.length; i++) {
            const option = this.choices[i];
            r += `[${i + 1}] ${option}\n`;
        }
        this.enterMessage = r;
    }

    execute(input) {
        if(!this.workflow) {
            return Promise.resolve(); // only happens with unittesting standalone states
        }
        // only one of the options will be accepted
        let optionNumber = utils.parseNumber(input);
        if(utils.isUndefined(optionNumber)) {
            // dealing with stubborn users
            if(utils.isUndefined(this.reintrance)) {
                this.reintrance = 0;
            } else {
                this.reintrance += 1;
            }
            if(this.reintrance >= 4) {
                this.workflow.forgetIt(WorkflowState.getVariation(constants.STUBBORN));
            } else {
                return this.reject();
            }
        }
        if(optionNumber < 1 || optionNumber > this.choices.length) {
            return this.reject();
        }
        // the user can pick 1, 2, ...
        // but we store 0 ,1, ...
        optionNumber -= 1;
        if(this.isFinal) {
            this.setVariable("Done", this.variable);
        } else {
            this.setVariable(optionNumber, this.variable);
            // note that a '-' is interpreted as minus, hence the '_'
            this.setVariable(this.choices[optionNumber], this.variable + "_value");
        }

        return this.accept();

    }

    toJSON() {
        let json = super.toJSON();
        json.choices = this.choices;
        return json;
    }
}
module.exports = ChoiceState;
