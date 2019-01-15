const
    utils = require('../../utils'),
    Qwiery = require('../../'),
    _ = require('lodash');

const ServiceBase = require('../../Framework/ServiceBase');
const WorkflowStorage = require('./WorkflowStorage');
const Workflow = require('./Workflow');

/**
 * Manages the flow process.
 * @class WorkflowEngine
 */
class WorkflowEngine extends ServiceBase {
    constructor() {
        super('workflows');
    }

    init(instantiator) {
        super.init(instantiator);
        this.workflowStorage = new WorkflowStorage(this.storage);
        return this.workflowStorage.init(instantiator);
    }

    /***
     * Tries to make sense of the input with respect to saving or discarding the interrupted flow.
     * @param workflow
     * @param session
     */
    async resolveInterruptedWorkflow(workflow, session) {
        const input = session.Input.Raw;
        const that = this;

        const boolish = require('../Language').convertInputToBoolean(input);
        // a three-state result: undefined, true or false
        if (utils.isUndefined(boolish)) {
            session.Output.Answer = [{
                DataType: 'Text',
                Content: 'I did not understand clearly: d\'you want to save the interrupted task for later?'
            }];
            session.Handled = true;
            session.Trace.push({'HandledBy': 'Flows'});
            return session;
        } else if (boolish === true) {
            workflow.IsSuspended = true;
            workflow.IsActive = false;
            await (that.workflowStorage.upsertWorkflow(workflow, session.Context));
            session.Output.Answer = [{
                DataType: 'Text',
                Content: 'OK, I\'ll save if for later and will remind you about it.'
            }];
            session.Handled = true;
            session.Trace.push({'HandledBy': 'Flows'});
            return session;
        } else {
            await (that.workflowStorage.deleteWorkflow(workflow, session.Context));
            session.Output.Answer = [{
                DataType: 'Text',
                Content: 'No problem. All is forgotten about that task.'
            }];
            session.Handled = true;
            session.Trace.push({'HandledBy': 'Flows'});
            return session;
        }


    }

    /***
     * Single entry point to handle a workflow.
     * @param workflow JSON flow
     * @param session
     * @param spy
     * @returns {Promise<T>}
     */
    async runWorkflow(workflow, session, spy) {
        if (workflow instanceof Workflow) {
            throw new Error('Expected a workflow definition, not a Workflow instance.');
        }

        const that = this;
        let instance = null;

        if (_.isPlainObject(workflow)) {
            // that.communicator(workflow, options);
            instance = new Workflow(workflow);
        } else if (_.isString(workflow)) {
            let def = await (that.getLibraryItem(workflow));

            if (utils.isDefined(def)) {
                instance = new Workflow(def);
            } else {
                throw new Error(`The workflow '${workflow}' could not be found in the workflow library.`);
            }
        } else {
            throw new Error('The workflow is not defined properly. Neither a library name nor a workflow definition.');
        }


        //first time
        if (instance.IsActive) {
            throw new Error('that workflow is active already, use the continueWithWorkflow method instead.');
        }
        if (!instance.id) {
            instance.id = utils.randomId();
        }
        instance.services = that.services;
        instance.workflowStorage = that.workflowStorage;
        return await (instance.start(session, spy));
    }

    /***
     * Continues the given workflow which was saved as active and fetched via the getActiveWorkflow method
     * @param workflowDefinition Name of a flow from the library or a workflow definition.
     * @param session
     * @param spy
     */
    continueWithWorkflow(workflowDefinition, session, spy) {
        if (!workflowDefinition.IsActive) {
            throw new Error('The flow cannot be continued, it is not active.');
        }
        const wf = new Workflow(workflowDefinition);
        wf.services = this.services;
        wf.session = session;
        wf.workflowStorage = this.workflowStorage;
        return wf.start(session, spy);
    }

    /***
     * Resumes a suspended workflow which the user wishes to continue.
     * @param workflowDefinition
     * @param ctx {SecurityContext} The security context.
     */
    async resumeWorkflow(workflowDefinition, session, spy) {
        if (!workflowDefinition.IsSuspended) {
            throw new Error('The flow cannot be resumed, it is not suspended.');
        }
        workflowDefinition.IsSuspended = false;
        const that = this;


        const wf = new Workflow(workflowDefinition);
        wf.services = this.services;
        wf.session = session;
        wf.workflowStorage = this.workflowStorage;
        if (that.onInput) {
            that.onInput(session.Input.Raw, this);
        }
        let spion = await (wf.start(session, spy));
        return spion;
    }

    getReminder(workflow) {
        let reminder = workflow.Reminder || 'Unfinished task.';
        let re = (/(?:^|\W)\$(\w+)(?!\w)/g), match, tobereplaced;
        while (match = re.exec(reminder)) {
            tobereplaced = match[1];
            if (workflow.Variables[tobereplaced]) {
                reminder = reminder.replace(new RegExp('\\$' + tobereplaced, 'gi'), workflow.Variables[tobereplaced]);
            } else {
                reminder = reminder.replace(new RegExp('\\$' + tobereplaced, 'gi'), 'Not set yet');
            }
        }
        return reminder;
    }

    /***
     * The suspended flows the user need to finish or discard.
     * @param ctx {SecurityContext} The security context.
     * @returns {Array}
     */
    getSuspendedWorkflows(ctx) {
        return this.workflowStorage.getSuspendedWorkflows(ctx);
    }

    /***
     * Fetches a suspended workflow with the given id.
     * @param id
     * @param ctx {SecurityContext} The security context.
     * @returns {Array}
     */
    getSuspendedWorkflow(id, ctx) {
        return this.workflowStorage.getSuspendedWorkflow(id, ctx);
    }

    /***
     * The interrupted flow can be discarded or saved for later.
     * In any case, if there is one present the user has to tell what to do with it.
     * @param ctx {SecurityContext} The security context.
     */
    getInterruptedWorkflow(ctx) {
        return this.workflowStorage.getInterruptedWorkflow(ctx);
    }

    /**
     * Fetches the unique active flow of the user, if any.
     * @param ctx {SecurityContext} The security context.
     * @return {*}
     */
    getActiveWorkflow(ctx) {
        return this.workflowStorage.getActiveWorkflow(ctx);
    }

    /**
     * Returns the workflow with the given id.
     * @param id {string} An identifier.
     * @param ctx {SecurityContext} The security context.
     * @return {*}
     */
    getWorkflowById(id, ctx) {
        return this.workflowStorage.getWorkflowById(id, ctx);
    }

    /**
     * Upserts a workflow for the library.
     * @param item {any} A library item.
     * @return {*}
     */
    upsertLibraryItem(item) {
        return this.workflowStorage.upsertLibraryItem(item);
    }

    /**
     * Returns the library item with the specified id.
     * @param id {string} An identifier.
     * @return {*}
     */
    getLibraryItem(id) {
        return this.workflowStorage.getLibraryItem(id);
    }

    /**
     * This will run the given workflow with the given inputs.
     * @param def {any} A workflow definition.
     * @param inputs {string|array<string>} One or more inputs.
     * @see Workflow.run
     * @return {*}
     */
    run(def, inputs) {
        if (_.isString(inputs)) {
            inputs = [inputs];
        }
        if (inputs.length === 0) {
            return Promise.resolve([]);
        }
        const that = this;
        let input = inputs.shift();
        let session = Qwiery.newSession(input);
        let options = {trace: true};
        let flowId = null;

        return new Promise(function (resolve, reject) {
            that.runWorkflow(def, session).then(function (spy) {
                flowId = spy.flow.id;

                function next() {
                    if (inputs.length > 0) {
                        input = inputs.shift();
                        session = Qwiery.newSession(input);
                        // realworld this should be 'getActiveWorkflow' but this clashes with the parallel unit tests and the
                        // fact that a user has only one active workflow at any point. The multiple saved active flows interfere.
                        // Hence the usage of the flow id instead of the active one.
                        that.getWorkflowById(flowId, session.Context).then(function (activeFlow) {
                            if (!activeFlow.IsActive) {
                                throw new Error('The workflow is supposedly active. Check your logic.');
                            }
                            // if there are more inputs than the flow can swallow, ie. the flow terminated before the inputs were consumed
                            if (utils.isUndefined(activeFlow)) {
                                spy.addInfo('The last input was not consumed because the flow terminated.')
                            } else {
                                that.continueWithWorkflow(activeFlow, session, spy).then(function () {
                                    if (spy.flow.isActive && inputs.length === 0) {
                                        that.workflowStorage.deleteWorkflow(flowId, session.Context);
                                        resolve(spy);
                                    } else {
                                        next();
                                    }
                                });
                            }
                        });
                    } else {
                        if (spy.flow.isActive === true) {
                            that.workflowStorage.deleteWorkflow(flowId, session.Context);
                        }
                        resolve(spy);
                    }
                }

                next();
            });
        });


    }
}

module.exports = WorkflowEngine;
