const Qwiery = require("../../../lib");

class RandomState extends Qwiery.WorkflowState {
    constructor(settings) {
        super(settings);
    }

    execute(input) {
        this.setVariable(Math.random(), "randomNumber");
        return this.accept(true);
    }
}
module.exports = RandomState;