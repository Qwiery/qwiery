const utils = require('../../utils'),
    path = require('path'),
    _ = require('lodash');
const StorageDomainBase = require('../../Framework/StorageDomainBase');

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
                collectionName: 'Personalization',
                schema: {
                    personalizations: [{
                        key: String,
                        value: String
                    }],
                    userId: String
                }
            },
            {
                collectionName: 'EnginePersonalization',
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
    async getPersonalization(key, userId) {

        key = key.toLowerCase();
        let user = await this.Personalization.findOne({userId: userId});
        if (utils.isDefined(user)) {
            const found = _.find(user.personalizations, {key: key});
            return utils.isDefined(found) ? found.value : null;
        } else {
            return null;
        }
    }

    /**
     * Adds a personalization item.
     * @param key {String} The personalization key.
     * @param value {String} The personalization value.
     * @param userId {String} The user id.
     * @returns {Promise<T>}
     */
    async addPersonalization(key, value, userId) {
        const that = this;
        key = key.toLowerCase();

        let user = await that.Personalization.findOne({userId: userId});
        if (utils.isUndefined(user)) {
            return that.Personalization.insert({
                userId: userId,
                personalizations: [
                    {
                        key: key,
                        value: value
                    }
                ]
            });
        } else {
            const found = _.find(user.personalizations, {key: key});
            if (utils.isUndefined(found)) {
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

    /**
     * Add an app preference or personalization.
     * @param key {string} The key of the personalization.
     * @param appId {string} The app for which the key/value applies.
     * @returns {*}
     */
    async getEnginePersonalization(key, appId) {
        if (utils.isUndefined(appId)) {
            appId = 'default';
        }
        key = key.toLowerCase();
        let app = waitFor(this.EnginePersonalization.findOne({appId: appId}));
        if (utils.isUndefined(app)) {
            return null;
        } else {
            const found = _.find(app.personalizations, {key: key});
            if (utils.isDefined(found)) {
                return found.value;
            } else {
                return null;
            }
        }
    }

    async addEnginePersonalization(key, value, appId) {
        if (utils.isUndefined(appId)) {
            appId = 'default';
        }
        const that = this;

        return new Promise(function (resolve, reject) {
            that.EnginePersonalization.findOne({appId: appId}).then(function (app) {
                if (utils.isUndefined(app)) {
                    that.EnginePersonalization.insert({
                        appId: appId,
                        personalizations: [
                            {
                                key: key,
                                value: value
                            }
                        ]
                    }).then(function () {
                        resolve();
                    })
                } else {
                    const found = _.find(app.personalizations, {key: key});
                    if (utils.isUndefined(found)) {
                        app.topics.push({
                            key: key,
                            value: value
                        });
                    } else {
                        found.value = value;
                    }
                    that.EnginePersonalization.update(app, {appId: appId}).then(function () {
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
    async getUserPersonalizations(userId) {
        const user = await this.Personalization.findOne({userId: userId});
        if (utils.isDefined(user)) {
            return user.personalizations;
        } else {
            return null;
        }
    }

    /**
     * Remove the personalizations of the specified user.
     * @param userId
     * @returns {Promise.<T>}
     */
    async clearAllUserPersonalizations(userId) {
        const user = await this.Personalization.findOne({userId: userId});
        if (utils.isDefined(user)) {
            user.personalizations = [];
            this.Personalization.update(user, {userId: userId});
        }
    }

    clearUserPersonalization(key, userId) {
        return this.addPersonalization(key, null, userId);
    }
}

module.exports = PersonalizationStorage;
