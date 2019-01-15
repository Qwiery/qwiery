const utils = require('../../utils'),
    path = require('path'),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
const StorageDomainBase = require("../../Framework/StorageDomainBase");
const PersonalizationStorage = require("./PersonalizationStorage");

/**
 * Manages the personalization of users and the engine.
 *
 * @class Personalization
 * @extends {ServiceBase}
 * @see {@tutorial Personalization}
 */
class Personalization extends ServiceBase {
    /**
     * Creates an instance of Personalization.
     * @param {any} settings
     *
     * @memberOf Personalization
     */
    constructor(settings) {
        super();
        this.pluginName = "personalization";
    }

    /**
     * @inheritdoc
     */
    init(instantiator) {
        super.init(instantiator);
        this.personalization = new PersonalizationStorage(this.storage);
        return this.personalization.init(instantiator);
    }

    /**
     * Returns the value of the personalization key.
     *
     * @param {string} key The personalization key.
     * @param {SecurityContext} ctx The security context.
     * @returns {Promise}
     *
     * @memberOf Personalization
     */
    getPersonalization(key, ctx) {
        return this.personalization.getPersonalization(key, ctx.userId);
    }
    /**
     * Adds a personalization key-value pair.
     *
     * @param {string} key The personalization key.
     * @param {SecurityContext} ctx The security context.
     * @param {string} value The value of the personalization.
     * @returns {Promise}
     *
     * @memberOf Personalization
     */
    addPersonalization(key, value, ctx) {
        return this.personalization.addPersonalization(key.toString().trim(), value.toString().trim(), ctx.userId);
    }

    /**
     * Gets the personalization of the engine for the specified key.
     *
     * @param {string} key The customization key.
     * @returns {Promise}
     *
     * @memberOf Personalization
     */
    getEnginePersonalization(key) {
        return this.personalization.getEnginePersonalization(key);
    }

    /**
        * Adds a personalization key-value pair.
        *
        * @param {string} key The personalization key.
        * @param {string} value The value of the personalization.
        * @returns {Promise}
        *
        * @memberOf Personalization
        */
    addEnginePersonalization(key, value) {
        return this.personalization.addEnginePersonalization(key, value);
    }

    /**
     * Gets all the personalization key-value pairs for the current user.
     *
     * @param {SecurityContext} ctx The security context.
     * @returns {Promise}
     *
     * @memberOf Personalization
     */
    getUserPersonalizations(ctx) {
        return this.personalization.getUserPersonalizations(ctx.userId);
    }

    /**
     * Removes all personalization of the current user.
     *
     * @param {SecurityContext} ctx The security context.
     * @returns {Promise}
     *
     * @memberOf Personalization
     */
    clearAllUserPersonalizations(ctx) {
        return this.personalization.clearAllUserPersonalizations(ctx.userId);
    }

    /**
     * Removes the value of the specified personalization key.
     *
     * @param {SecurityContext} ctx The security context.
     * @param {string} key The personalization key.
     * @returns {Promise}
     *
     * @memberOf Personalization
     */
    clearUserPersonalization(key, ctx) {
        return this.personalization.clearUserPersonalization(key, ctx.userId);
    }

}

module.exports = Personalization;
