const
    utils = require("../../utils");
/**
 * A transition between two states.
 * @param definition {any} A JSON workflow definition.
 * @class StateTransition
 */
class StateTransition {
    constructor(definition) {
        if (utils.isUndefined(definition.from)) {
            throw new Error("Missing 'from' in StateTransition.");
        }
        this.from = definition.from;
        if (utils.isUndefined(definition.to)) {
            throw new Error("Missing 'to' in StateTransition.");
        }
        this.to = definition.to;
        this.value = utils.isUndefined(definition.value) ? true : definition.value;
    }
    /**
     * Serializes this instance.
     * 
     * @memberOf StateTransition
     */
    toJSON() {
        return {
            from: this.from,
            to: this.to,
            value: this.value
        }
    }
}
module.exports = StateTransition;