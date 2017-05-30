const utils = require('../../utils'),
    path = require('path'),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
const StorageDomainBase = require("../../Framework/StorageDomainBase");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');

/**
 * Manages the workflow data.
 *
 * @class WorkflowStorage
 * @extends {StorageDomainBase}
 */
class WorkflowStorage extends StorageDomainBase {

init(instantiator) {
    super.init(instantiator);
    return this.createCollections(
        {
            collectionName: "Workflows",
            schema: {
                id: String,
                workflow: Object,
                isActive: Boolean,
                isSuspended: Object,
                userId: String
            },
            index: "id"
        },
        {
            collectionName: "WorkflowLibrary",
            schema: {
                id: String,
                workflow: Object,
                userId: String
            },
            index: "id"
        });
}

    getInterruptedWorkflow(ctx) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.Workflows.findOne({isActive: true, isSuspended: "undecided", userId: ctx.userId}).then(function(item) {
                if(utils.isUndefined(item)) {
                    resolve(null);
                } else {
                    resolve(item.workflow);
                }
            });
        });
    }

    getSuspendedWorkflows(ctx) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.Workflows.find({isActive: false, isSuspended: true, userId: ctx.userId}).then(function(items) {
                if(utils.isUndefined(items)) {
                    resolve(null);
                } else {
                    const mapped = _.map(items, function(x) {
                        return x.workflow;
                    });
                    resolve(mapped);
                }
            });
        });

    }

    getSuspendedWorkflow(id, ctx) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.Workflows.findOne({id: id, isActive: false, isSuspended: true, userId: ctx.userId}).then(function(item) {
                if(utils.isUndefined(item)) {
                    resolve(null);
                } else {
                    resolve(item.workflow);
                }
            });
        });
    }

    workflowIdExists(id, ctx) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.Workflows.findOne({id: id, userId: ctx.userId}).then(function(item) {
                resolve(utils.isDefined(item));
            });
        });
    }

    getActiveWorkflow(ctx) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.Workflows.findOne({isActive: true, isSuspended: false, userId: ctx.userId}).then(function(item) {
                if(utils.isUndefined(item)) {
                    resolve(null);
                } else {
                    resolve(item.workflow);
                }
            });
        });
    }

    upsertWorkflow(workflow, ctx) {
        const uw = {
            id: workflow.Id,
            isActive: workflow.IsActive,
            isSuspended: workflow.IsSuspended,
            workflow: workflow,
            userId: ctx.userId
        };
        return this.Workflows.upsert(uw, {id: workflow.Id});
    }

    deleteWorkflow(workflowId, ctx) {
        return this.Workflows.remove({id: workflowId, userId: ctx.userId});
    }

    getWorkflowById(workflowId, ctx) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.Workflows.findOne({id: workflowId, userId: ctx.userId}).then(function(item) {
                if(utils.isUndefined(item)) {
                    resolve(null);
                } else {
                    resolve(item.workflow);
                }
            });
        });
    }

    deleteAllUserWorkflows(ctx) {
        return this.Workflows.remove({userId: ctx.userId});
    }

    deleteById(id) {
        return this.Workflows.remove({id: id});
    }

    /**
     * Returns the library item with the specified id.
     * @param id {string} An identifier.
     * @return {*}
     */
    getLibraryItem(id) {
        return this.WorkflowLibrary.findOne({id: id});
    }

    /**
     * Upserts a workflow for the library.
     * @param item {any} A library item.
     * @return {*}
     */
    upsertLibraryItem(item) {
        if(utils.isUndefined(item.userId)) {
            item.userId = "Everyone";
        }
        if(utils.isUndefined(item.id)) {
            item.id = utils.randomId();
        }
        if(utils.isUndefined(item.workflow)) {
            throw new Error("Are you sure this is a workflow library item?");
        }
        return this.WorkflowLibrary.upsert(
            {
                id: item.id,
                workflow: item.workflow,
                userId: item.userId
            },
            {
                id: item.id
            }
        );
    }
}

module.exports = WorkflowStorage;