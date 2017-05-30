const utils = require('../../utils'),
    path = require('path'),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
const StorageDomainBase = require("../../Framework/StorageDomainBase");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
/**
 * Storage specific to the Personalization service.
 * 
 * @class PersonalizationStorage
 * @extends {StorageDomainBase}
 */
class PersonalizationStorage extends StorageDomainBase {

    init(instantiator) {
        super.init(instantiator);
        return this.createCollections(
            {
                collectionName: "Personalization",
                schema: {
                    personalizations: [{
                        key: String,
                        value: String
                    }],
                    userId: String
                }
            },
            {
                collectionName: "EnginePersonalization",
                schema: {
                    personalizations: [{
                        key: String,
                        value: String
                    }],
                    appId: String
                }
            });
    }

    /**
     * Returns the personalization.
     * @param key {String} The personalization key.
     * @param userId {String} The user id.
     * @returns {Promise<T>}
     */
    getPersonalization(key, userId) {

        const that = this;
        key = key.toLowerCase();
        function runner() {
            let user = waitFor(that.Personalization.findOne({userId: userId}));
            if(utils.isDefined(user)) {
                const found = _.find(user.personalizations, {key: key});
                return utils.isDefined(found) ? found.value : null;
            } else {
                return null;
            }
        }

        return async(runner)();
    }

    /**
     * Adds a personalization item.
     * @param key {String} The personalization key.
     * @param value {String} The personalization value.
     * @param userId {String} The user id.
     * @returns {Promise<T>}
     */
    addPersonalization(key, value, userId) {
        const that = this;
        key = key.toLowerCase();
        function runner() {
            let user = waitFor(that.Personalization.findOne({userId: userId}));
            if(utils.isUndefined(user)) {
                return that.Personalization.insert({
                    userId: userId,
                    personalizations: [
                        {
                            key: key,
                            value: value
                        }
                    ]
                });
            }
            else {
                const found = _.find(user.personalizations, {key: key});
                if(utils.isUndefined(found)) {
                    user.personalizations.push({
                        key: key,
                        value: value
                    });
                } else {
                    found.value = value;
                }
                return that.Personalization.update(user, {userId: userId});
            }
        }

        return async(runner)();
    }

    /**
     * Add an app preference or personalization.
     * @param key {string} The key of the personalization.
     * @param appId {string} The app for which the key/value applies.
     * @returns {*}
     */
    getEnginePersonalization(key, appId) {
        if(utils.isUndefined(appId)) {
            appId = "default";
        }
        const that = this;
        key = key.toLowerCase();
        function runner() {
            let app = waitFor(that.EnginePersonalization.findOne({appId: appId}));
            if(utils.isUndefined(app)) {
                return null;
            }
            else {
                const found = _.find(app.personalizations, {key: key});
                if(utils.isDefined(found)) {
                    return found.value;
                } else {
                    return null;
                }
            }
        }

        return async(runner)();
    }

    addEnginePersonalization(key, value, appId) {
        if(utils.isUndefined(appId)) {
            appId = "default";
        }
        const that = this;

        return new Promise(function(resolve, reject) {
            that.EnginePersonalization.findOne({appId: appId}).then(function(app) {
                if(utils.isUndefined(app)) {
                    that.EnginePersonalization.insert({
                        appId: appId,
                        personalizations: [
                            {
                                key: key,
                                value: value
                            }
                        ]
                    }).then(function() {
                        resolve();
                    })
                }
                else {
                    const found = _.find(app.personalizations, {key: key});
                    if(utils.isUndefined(found)) {
                        app.topics.push({
                            key: key,
                            value: value
                        });
                    } else {
                        found.value = value;
                    }
                    that.EnginePersonalization.update(app, {appId: appId}).then(function() {
                        resolve();
                    });
                }
            });
        });

    }

    /**
     * Returns all the personalizations of the specified user.
     * @param userId {string} The user id.
     * @returns {Promise<array>}
     */
    getUserPersonalizations(userId) {
        const that = this;

        function runner() {
            const user = waitFor(that.Personalization.findOne({userId: userId}));
            if(utils.isDefined(user)) {
                return user.personalizations;
            } else {
                return null;
            }
        }

        return async(runner)();

    }

    /**
     * Remove the personalizations of the specified user.
     * @param userId
     * @returns {Promise.<T>}
     */
    clearAllUserPersonalizations(userId) {
        const that = this;

        function runner() {
            const user = waitFor(that.Personalization.findOne({userId: userId}));
            if(utils.isDefined(user)) {
                user.personalizations = [];
                that.Personalization.update(user, {userId: userId});
            }
        }

        return async(runner)();
    }

    clearUserPersonalization(key, userId) {
        return this.addPersonalization(key, null, userId);
    }
}
module.exports = PersonalizationStorage;