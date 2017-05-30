const fs = require('fs-extra'),
    utils = require('../../utils'),
    ServiceBase = require('../../Framework/ServiceBase'),
    path = require('path'),
    _ = require('lodash');

/**
 * Manages the apps of users (quota, access, etc.).
 * @class UserApps
 * @extends ServiceBase
 */
class UserApps extends ServiceBase {
    constructor(settings) {
        super("userapps");
    }

    /***
     * Checks the user quota whether he can add another app.
     * @param ctx
     * @returns {boolean}
     */
    userCanAddApp(ctx) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.appStorage.getUserQuota(ctx.userId).then(function (quota) {
                if (ctx.userId === "Sharon") {
                    resolve(true);
                } else if (ctx.userId === "Anonymous") {
                    resolve(false);
                }
                else {
                    resolve(quota > 0);
                }
            });
        });
    }

    userAppIds(ctx) {
        return this.appStorage.getUserAppsIds(ctx.userId);
    }

    changeQuota(ctx, newQuota) {
        return this.appStorage.changeQuota(ctx.userId, newQuota);
    }

    /***
     * How many apps can the user still create?
     * @param ctx
     * @returns {number}
     */
    getUserQuota(ctx) {
        return this.appStorage.getUserQuota(ctx.userId);
    }

    /***
     * Adds the appId to the user.
     * @param ctx A user identifier.
     * @param appId An application identifier.
     */
    addUserApp(ctx, appId, appName) {
        return this.appStorage.addUserApp(ctx.userId, appId, appName);
    }

    /***
     * Removes the appId from the user.
     * @param ctx A user identifier.
     * @param appId An application identifier.
     */
    removeUserApp(ctx, appId) {
        return this.appStorage.removeUserApp(ctx.userId, appId);
    }

    /***
     * Returns true if the given user own the app.
     * @param ctx
     * @param appId
     */
    userOwnsApp(ctx, appId) {
        return this.appStorage.userOwnsApp(ctx.userId, appId);
    }
}
module.exports = UserApps;