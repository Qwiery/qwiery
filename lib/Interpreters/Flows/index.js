const constants = require("../../constants"),
    utils = require("../../utils"),
    _ = require("lodash"),
    InterpreterBase = require("../../Framework/InterpreterBase");

/**
 * This captures the active flow of the user and puts it inline,
 * blocking all other interpreters.
 * @class Flows
 */
class Flows extends InterpreterBase {
    constructor() {
        super("flows");
    }

    async processMessage(session) {
        if (utils.isUndefined(this.services.workflows)) {
            return session;
        }
        if (session.Handled) {
            return session;
        }
        const that = this;
        let newSession = null;

        const ctx = session.Context;
        const interruptedWorkflow = await (that.services.workflows.getInterruptedWorkflow(ctx));
        let resolution;
        if (utils.isDefined(interruptedWorkflow)) {
            // the user has to tell what to do with the interrupted flow: discard or save?
            newSession = await (that.services.workflows.resolveInterruptedWorkflow(interruptedWorkflow, session));
            session.Trace.push({
                "Module": "Flows",
                "What": `Handled by the workflow service.`,
                "Details": ""
            });
            return newSession;
        } else if (session.Input.Raw.indexOf("run:workflow:") === 0) {
            const id = session.Input.Raw.replace("run:workflow:", "").trim();
            const suspendedFlow = await (that.services.workflows.getSuspendedWorkflow(id, ctx));
            session.Trace.push({
                "Module": "Flows",
                "What": `Handled by the workflow service.`
            });
            if (utils.isDefined(suspendedFlow)) {
                let spy = await (that.services.workflows.resumeWorkflow(suspendedFlow, session));
                session.Output.Answer = spy.toSummary(spy.lastEnterMessage);
            } else {
                session.Output.Answer = [{
                    DataType: "Text",
                    Content: "The requested workflow does not exist."
                }];

            }
            session.Handled = true;
            session.Trace.push({
                "Module": "Flows",
                "What": `Handled by the workflow service.`
            });
            return session;
        } else {
            const activeWorkflow = await (that.services.workflows.getActiveWorkflow(ctx));

            if (utils.isDefined(activeWorkflow)) {
                // so, let's continue with that workflow, shall we?
                let spy = await (that.services.workflows.continueWithWorkflow(activeWorkflow, session));
                session.Output.Answer = spy.toAnswer();
                session.Handled = true;
                session.Trace.push({"HandledBy": "Flows"});
                return session;
            } else {
                // no workflow-related things happened
                return session;
            }
        }
    }
}

module.exports = Flows;
