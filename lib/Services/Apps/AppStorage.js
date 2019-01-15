const utils = require('../../utils'),
    _ = require('lodash');
const StorageDomainBase = require("../../Framework/StorageDomainBase");

/**
 * Stores the (user) apps.
 * @class AppStorage
 */
class AppsStorage extends StorageDomainBase {

    /**
     * Inits this storage.
     *
     * @returns {Promise}
     *
     * @memberOf StorageDomainBase
     * @param instantiator {Instantiator} The Qwiery instantiator.
     */
    init(instantiator) {
        super.init(instantiator);
        return this.createCollections(
            {
                collectionName: "AppConfiguration",
                schema: {
                    id: String,
                    name: String,
                    description: String,
                    isPrivate: { type: Boolean, default: false },
                    pipeline: { type: [String], default: ["Spam", "NoAnswer", "Historization"] },
                    probingServices: { type: [String], default: [] },
                    categories: [String],
                    parsers: { type: [String], default: [] },
                    noAnswer: { type: String, default: "I'm sorry, I don't know" },
                    entityNotFound: { type: String, default: "The necessary data to answer this was not found." },
                    emotions: { type: Boolean, default: false },
                    personality: { type: String, default: "DaVinci" },
                    remindersThreshold: { type: Number, default: 0.3 }
                }
            },
            {
                collectionName: "UserApps",
                schema: {
                    apps: [{
                        id: String,
                        name: String
                    }],
                    quota: Number,
                    userId: String
                }
            });
    }

    /**
     * Removes the user app.
     * @param userId
     * @param appId
     * @returns {Promise}
     */
    removeUserApp(userId, appId) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.UserApps.findOne({ userId: userId }).then(function (user) {
                if (utils.isUndefined(user)) {
                    reject("The user does not own this app.")
                }
                else {
                    let r = _.filter(user.apps, function (x) {
                        return x.id !== appId;
                    });
                    if (user.apps.length !== r.length) {
                        user.apps = r;
                        user.quota += 1;
                        that.UserApps.update(user, { userId: userId }).then(function () {
                            resolve();
                        });
                    } else {
                        resolve();
                    }

                }
            });
        });
    }

    /**
     * Adds a user app.
     * @param userId {String} The user id.
     * @param appId {String} The app id.
     * @param appName {String} The name of the new app.
     * @returns {Promise}
     */
    addUserApp(userId, appId, appName) {
        if(!utils.isValidName(appId)){
            throw new Error("The given app id is not valid.");
        }
        if(!utils.isValidName(appName)){
            throw new Error("The given app name is not valid.");
        }
        const that = this;
        return new Promise(function (resolve, reject) {

            that.UserApps.findOne({ userId: userId }).then(function (user) {
                if (utils.isUndefined(user)) {
                    that.UserApps.insert({
                        userId: userId,
                        apps: [{
                            id: appId,
                            name: appName
                        }],
                        quota: that.settings.system.userAppQuota - 1
                    }).then(function () {
                        resolve();
                    });

                }
                else {
                    // do an upsert
                    let r = _.filter(user.apps, function (x) {
                        return x.id !== appId;
                    });
                    if (r.length === user.apps.length) {
                        user.quota -= 1;
                    }
                    r.push({
                        id: appId,
                        name: appName
                    });
                    user.apps = r;
                    that.UserApps.update(user, { userId: userId }).then(function () {
                        resolve();
                    });
                }
            });
        });
    }

    /**
     * Changes the quota of the specified user.
     * @param userId {String} The user identifier.
     * @param newQuota {Number} The new quota.
     * @return {Promise}
     */
    changeQuota(userId, newQuota = 100) {
        if (!_.isNumber(newQuota)) {
            throw new Error("A user's app quota should be a number.");
        }
        const that = this;
        return new Promise(function (resolve, reject) {
            that.UserApps.findOne({ userId: userId }).then(function (user) {
                if (utils.isUndefined(user)) {
                    that.UserApps.insert({
                        userId: userId,
                        apps: [],
                        quota: newQuota
                    }).then(function () {
                        resolve();
                    });
                }
                else {
                    user.quota = newQuota;
                    that.UserApps.update(user, { userId: userId }).then(function () {
                        resolve();
                    });
                }
            });
        });
    }

    getUserQuota(userId) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.UserApps.findOne({ userId: userId }).then(function (user) {
                if (utils.isUndefined(user)) {
                    resolve(0);
                }
                else {
                    resolve(user.quota);
                }
            });
        });
    }

    userOwnsApp(userId, appId) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.UserApps.findOne({ userId: userId }).then(function (user) {
                if (utils.isUndefined(user)) {
                    resolve(false);
                }
                else {
                    const found = _.find(user.apps, { id: appId });
                    resolve(utils.isDefined(found));
                }
            });
        });
    }

    getUserAppsIds(userId) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.UserApps.findOne({ userId: userId }).then(function (user) {
                if (utils.isUndefined(user)) {
                    resolve([]);
                }
                else {
                    let bots = [];
                    for (let i = 0; i < user.apps.length; i++) {
                        const bot = user.apps[i];
                        bots.push({
                            id: bot.id,
                            name: bot.name
                        });
                    }
                    resolve(bots);
                }
            });
        });
    }

    saveAppConfiguration(configuration) {
        if (utils.isUndefined(configuration.id)) {
            throw new Error("Missing 'id' on the configuration.");
        }
        return this.AppConfiguration.insert(configuration);
    }

    deleteAppConfiguration(appId) {
        return this.AppConfiguration.remove({ id: appId });
    }

    appExists(appId) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.AppConfiguration.findOne({ "id": appId }).then(function (item) {
                resolve(utils.isDefined(item));
            });
        });
    }

    isExistingAppName(name) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.AppConfiguration.findOne({ "name": name }).then(function (item) {
                resolve(utils.isDefined(item));
            });
        });
    }

    getAppIds() {
        const that = this;
        return new Promise(function (resolve, reject) {
            // todo: not a scalable thing here, fetching the whole lot
            that.AppConfiguration.find({}).then(function (all) {
                let ids = _.map(all, "id");
                resolve(ids);
            });
        });
    }

    getAppIdFromName(name) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.AppConfiguration.findOne({ "name": { $regex: "^" + name, $options: "i" } }).then(function (item) {
                resolve(utils.isDefined(item) ? item.id : null);
            });
        });
    }

    getAppNames() {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.AppConfiguration.find({}).then(function (all) {
                let r = _.map(all, function (x) {
                    return x.name;
                });
                resolve(r);
            });
        });
    }

    clearAll() {
        return this.AppConfiguration.remove({});
    }

    getAppCount() {
        return this.AppConfiguration.count({});
    }

    getAllAppConfigurations(name) {
        return this.AppConfiguration.find({});
    }

    getAppConfiguration(appId) {
        return this.AppConfiguration.findOne({ "id": appId });
    }
}
module.exports = AppsStorage;
