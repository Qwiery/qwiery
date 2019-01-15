const _ = require('lodash');
const ServiceBase = require('../../Framework/ServiceBase');
const LogStorage = require('./LogStorage');

/**
 * Logging of diverse bits.
 *
 * @class Log
 * @extends {ServiceBase}
 */
class Log extends ServiceBase {
    constructor() {
        super('log');
    }

    /**
     * Initializes this service.
     */
    init(instantiator) {
        super.init(instantiator);
        this.log = new LogStorage(this.storage);
        return this.log.init(instantiator);
    }

    getLastErrors(n = 10) {
        return this.log.getLastErrors(n);
    }

    /**
     * Adds and error to the Errors table.
     * @param err {Error} An error.
     * @returns {Promise}
     */
    error(err) {
        return this.log.error(err);
    }

    /**
     * Adds feedback to the Feedback table
     * @param obj {object} An object with User and Commects properties.
     * @returns {Promise}
     */
    feedback(obj) {
        return this.log.feedback(obj);
    }

    /**
     * Gets the last N feedback items.
     * @param n {Number} The number of feedback to return.
     */
    getLastFeedback(n = 10) {
        return this.log.getLastFeedback(n)
    }

    clearErrors() {
        return this.log.clearErrors();
    }
}

module.exports = Log;
