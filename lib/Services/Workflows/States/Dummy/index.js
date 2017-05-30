const WorkflowState = require("../../WorkflowState");

class DummyState extends WorkflowState {
    constructor(settings) {
        super(settings);
    }
}
module.exports = DummyState;