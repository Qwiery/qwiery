const WorkflowState = require("../../WorkflowState"),
    _ = require('lodash'),
    utils = require("../../../../utils"),
    constants = require("../../../../constants"),
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await');
class CheckAnswerState extends WorkflowState {
    constructor(settings) {
        settings = _.merge(settings, {
            rejectMessage: constants.TRYAGAIN,
            acceptMessage: constants.CORRECT
        });
        super(settings);
    }


    activate(raiseEvent = true) {

        if(raiseEvent === false) {
            this._isActive = true;
            return Promise.resolve(false);
        }

        const that = this;

        function runner() {
            if(that.onActivate && (raiseEvent === undefined || raiseEvent === true)) {
                if(that.workflow) {
                    const message = waitFor(that.workflow.interprete(that.enterMessage));
                    that.onActivate(message, that);
                } else {
                    if(_.isString(that.enterMessage)) {
                        that.onActivate(that.enterMessage, that);
                    }
                    else {
                        that.onActivate("Cannot interprete some stuff because the context of the workflow state is not set.", that);
                    }
                }

            }
            that.count = 0;
            that.errorCount = 0;
            that._isActive = true;
            return true; // true means here that it's OK to save the flow after this state has been activated
        }

        return async(runner)();
    }

    execute(input) {

        if(!this.workflow) {
            return Promise.resolve(); // only happens with unittesting standalone states
        }
        if(utils.isUndefined(input)) {
            return this.reject(this.getVariation(constants.NOINPUT));
        }
        const givenNumber = parseInt(input.toString().trim());
        const expectedNumber = parseInt(this.parameters.expectedAnswer.toString().trim());
        if(!_.isNumber(expectedNumber)) {
            throw new Error(`Parameter ${this.parameters.expectedAnswer} should be a number in the flow definition.`);
        }

        try {


            if(!_.isNumber(givenNumber) || _.isNaN(givenNumber)) {
                this.errorCount++;
                if(this.errorCount >= 3) {
                    return this.reject("You are persistent. Try with a number please.")
                }
                return this.reject(WorkflowState.getVariation(constants.SPECIFYNUMBER))
            }

            if(expectedNumber === givenNumber) {
                this.accept(true);
            } else {
                this.count++;
                let msg = "";
                if(this.count === 8) {
                    msg = "Ouch, thought is was easier to guess."
                }
                if(Math.abs(expectedNumber - givenNumber) <= 5) {
                    msg = "Very close.";
                }
                if(givenNumber < expectedNumber) {
                    msg += "Higher."
                }
                else if(expectedNumber < givenNumber) {
                    msg += "Lower."
                }
                return this.reject(msg);
            }

        }
        catch(e) {
            return this.reject(e.message);
        }

    }

    toJSON() {
        let json = super.toJSON();
        json.parameters.expectedAnswer = this.parameters.expectedAnswer;
        json.count = this.count;
        json.errorCount = this.errorCount;
        return json;
    }
}
module.exports = CheckAnswerState;