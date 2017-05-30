const WorkflowState = require("../../WorkflowState");
const _ = require('lodash');
const utils = require("../../../../utils");
class PersonalizationCheckState extends WorkflowState {
    constructor(settings) {
        settings = _.merge(settings, {
            rejectMessage: "Nope, not OK.",
            acceptMessage: "Good, now I know :)"
        });
        super(settings);
    }


    activate(raiseEvent = true) {
        var that = this;

        if(raiseEvent === false) {
            that._isActive = true;
            return Promise.resolve(false);
        }


        if(utils.isUndefined(that.personalizationName) || that.personalizationName.length === 0) {
            throw new Error("Missing 'personalizationName' on PersonalizationCheckState.");
        }

        return new Promise(function(resolve, reject) {

            var config = require("../../config");
            var ctx = that.workflow.session.Context;
            // first time checking in the personalization
            var services = require("../../services");
            services.personalization.getPersonalization(that.personalizationName, ctx).then(function(varValue) {
                if(utils.isUndefined(varValue) || varValue.trim().length === 0) {
                    if(that.onActivate && (raiseEvent === undefined || raiseEvent === true)) {
                        that.onActivate(that.enterMessage, that);
                    }
                    that._isActive = true;
                    resolve(true);
                } else {
                    that.setVariable(varValue, this.variable);
                    that.setVariable(varValue, that.personalizationName);
                    that._isActive = false;
                    // this moves the flow to the next state
                    that.accept(true).then(function() {
                        resolve(false)
                    });
                }
            });

        });
    }

    execute(input) {

        var that = this;
        var ctx = that.workflow.session.Context;
        return new Promise(function(resolve, reject) {
            // input not empty is checked in any transition
            // todo: validate the input for the type of question
            if(this.services.personalization) {
                this.services.personalization.addPersonalization(that.personalizationName, input, ctx).then(function() {

                    that.setVariable(input, that.personalizationName);
                    that.accept(true).then(function() {
                        resolve();
                    });
                });
            }

        });
    }

    toJSON() {
        let json = super.toJSON();
        json.personalizationName = this.personalizationName;
        return json;
    }
}
module.exports = PersonalizationCheckState;