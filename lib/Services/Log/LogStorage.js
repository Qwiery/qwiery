const utils = require('../../utils'),
    path = require('path'),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
const StorageDomainBase = require("../../Framework/StorageDomainBase");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
/**
 * Manages the storage of logging information.
 * 
 * @class LoggingStorage
 * @extends {StorageDomainBase}
 */
class LoggingStorage extends StorageDomainBase {
    constructor(storage) {
        super(storage);
    }

    init(instantiator) {
        super.init(instantiator);
        return this.createCollections(
            {
                collectionName: "Errors",
                schema: {
                    message: String,
                    stack: String,
                    date: Date
                }
            },
            {
                collectionName: "Feedback",
                schema: {
                    user: String,
                    comments: String,
                    date: Date
                }
            });
    }

    /**
     * Gets the last N errors.
     * @param n {Number} The number of errors to return.
     */
    getLastErrors(n = 10) {
        return this.Errors.find({}, {'date': true}, n);
    }

    /**
     * Adds and error to the Errors table.
     * @param err {Error} An error.
     * @returns {Promise}
     */
    error(err) {
        let e;
        if(_.isPlainObject(err)) {
            return this.Errors.insert(err);
        }
        if(_.isError(err)) {
            return this.Errors.insert({
                message: err.message,
                stack: err.stack,
                date: new Date()
            });
        }
    }

    /**
     * Adds feedback to the Feedback table
     * @param obj {object} An object with User and Commects properties.
     * @returns {Promise}
     */
    feedback(obj) {
        return this.Feedback.insert({
            comments: obj.comments || obj.Comments,
            user: obj.User || obj.user || "Unspecified",
            date: new Date()
        });
    }

    /**
     * Gets the last N feedback items.
     * @param n {Number} The number of feedback to return.
     */
    getLastFeedback(n = 10) {
        return this.Feedback.find({}, {'date': true}, n);
    }

    clearErrors() {
        return this.Errors.remove({});
    }
}
module.exports = LoggingStorage;