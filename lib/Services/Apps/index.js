const
    utils = require('../../utils'),
    ServiceBase = require('../../Framework/ServiceBase'),
    UserApps = require('./UserApps'),
    AppStorage = require('./AppStorage'),
    _ = require('lodash');

/**
 * Manages apps and services offered by Qwiery.
 * @extends ServiceBase
 * @class Apps
 */
class Apps extends ServiceBase {
    constructor(settings) {
        super();
        this.pluginName = 'apps';
        this.configTemplate = {
            'id': null,
            'name': null,
            'description': 'No description given.',
            'pipeline': [
                'Spam',
                'Oracle',
                'NoAnswer',
                'Historization'
            ],
            'probingServices': [],
            'categories': null,
            'parsers': [],
            'noAnswer': 'I\'m sorry, I don\'t know.',
            'ENTITYORPROCESSNOTFOUND': 'The necessary data to answer this was not found.',
            'emotions': false,
            'personality': 'DaVinci',
            'remindersThreshold': 0.3
        };
        this.appTemplate = {
            config: {
                'id': null,
                'name': null,
                'description': 'No description given.',
                'pipeline': [
                    'Spam',
                    'Oracle',
                    'NoAnswer',
                    'Historization'
                ],
                'probingServices': [],
                'categories': null,
                'parsers': [],
                'noAnswer': 'I\'m sorry, I don\'t know.',
                'ENTITYORPROCESSNOTFOUND': 'The necessary data to answer this was not found.',
                'emotions': false,
                'personality': 'DaVinci',
                'remindersThreshold': 0.3
            },
            oracle: []
        };
    }

    init(instantiator) {
        super.init(instantiator);
        this.appStorage = new AppStorage(this.services.storage);
        this.appStorage.init(instantiator);
        this.userApps = new UserApps();

        this.userApps.init(instantiator);
        this.userApps.appStorage = this.appStorage;
        return Promise.resolve();
    }


    /***
     * Adds the given application.
     *
     * This is the main entry to adding an app and will call various business methods; checking the quota of the user,
     * saving the various files needed and so on.
     *
     * @param appConfig The application configuration of the form
     *
     * {
     *  config:  {...}
     *  oracle: [...]
     * }
     * @param ctx
     */
    addApp(appConfig, ctx) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that._validateAppConfig(appConfig).then(function (foundError) {
                if (foundError !== null) {
                    reject(foundError);
                    return;
                }

                Apps._addMissingConfigurationBits(appConfig, ctx);
                let checks = [that.isExistingAppName(appConfig.config.name), that.userApps.userCanAddApp(ctx)];
                Promise.all(checks).then(function (r) {
                    let exists = r[0], canAdd = r[1];
                    if (exists === true) {
                        reject(`The app name ${appConfig.config.name} already exists.`);
                    }
                    if (canAdd) {
                        that.userApps.addUserApp(ctx, appConfig.config.id, appConfig.config.name).then(function () {
                            // saving the oracle set which defines to what the app will answer
                            if (!that.services.oracle) {
                                throw new Error('App cannot be added because the Oracle service is not included in the configuration.   ');
                            }
                            that.services.oracle.saveAppDataset(appConfig.oracle, appConfig.config.id).then(function () {
                                // the configuration of the app
                                that.appStorage.saveAppConfiguration(appConfig.config).then(function () {
                                    console.log('App \'' + appConfig.config.id + '\' was created by user \'' + ctx.userId + '\'.');
                                    resolve(appConfig.config.id);
                                });
                            });
                        });
                    } else {
                        reject('User has reached apps quota.')
                    }
                });

            });

        });
    }

    /***
     * Main method to remove an app.
     * @param appId
     * @param ctx
     */
    async deleteApp(appId, ctx) {

        // does it exist?
        if (!this.isAppId(appId)) {
            throw new Error('App \'' + appId + '\' does not exist.');
        }
        const that = this;

        if (!that.userApps.userOwnsApp(ctx, appId)) {
            throw new Error('User \'' + ctx.userId + '\' does not own app \'' + appId + '\'.');
        }

        // if loaded in memory, let's remove
        await (that.storage.Oracle.deleteCategory(appId));

        // delete the configuration of the app
        await (that._deleteAppConfiguration(appId));

        // finally, the user reference
        await (that.userApps.removeUserApp(ctx, appId));

        console.log('App \'' + appId + '\' was deleted by user \'' + ctx.userId + '\'.');
    }

    /**
     * Corrects the given configuration.
     *
     * @static
     * @param {Object} appConfig The submitted configuration.
     *
     * @memberof Apps
     */
    static _addMissingConfigurationBits(appConfig) {

        appConfig.config.id = utils.randomId();
        if (!appConfig.config.categories) {
            appConfig.config.categories = [];
        }
        // the oracle category for an app is the same as its id
        // an app can have some of the Global categories but only one own category.
        appConfig.config.categories.push(appConfig.config.id);

        if (!appConfig.config.pipeline) {
            appConfig.config.pipeline = [];
        }
        if (!appConfig.config.probingServices) {
            appConfig.config.probingServices = [];
        }
        if (!appConfig.config.description) {
            appConfig.config.description = 'No description available.';
        }
        if (!appConfig.config.parsers) {
            appConfig.config.parsers = [];
        }
        if (!appConfig.config.noAnswer) {
            appConfig.config.noAnswer = 'I\'m sorry, I don\'t know.';
        }
        if (!appConfig.config.ENTITYORPROCESSNOTFOUND) {
            appConfig.config.ENTITYORPROCESSNOTFOUND = 'The necessary data to answer this was not found.';
        }
        if (!appConfig.config.emotions) {
            appConfig.config.emotions = false;
        }
        if (!appConfig.config.personality) {
            appConfig.config.personality = 'DaVinci';
        }
        if (!appConfig.config.remindersThreshold) {
            appConfig.config.remindersThreshold = 0.3;
        }
    }

    async _validateAppConfig(appConfig) {
        const that = this;

        const prefix = 'Error in app configuration: ';
        if (!appConfig.config) {
            return prefix + 'no config section.';
        } else if (!appConfig.oracle) {
            return prefix + 'no oracle section.';
        } else if (!_.isArray(appConfig.oracle)) {
            return prefix + 'oracle section should be an array.';
        } else if (!_.isPlainObject(appConfig.config)) {
            return prefix + 'config section should be a plain object.';
        } else if (appConfig.config.id) {
            return prefix + 'app has an id, but this is set automatically.';
        } else if (!appConfig.config.name) {
            return prefix + 'app has no name.';
        } else if (!utils.isValidName(appConfig.config.name.trim())) {
            return prefix + 'the app name should be alphanumerical.';
        } else if (appConfig.config.name.trim().toLowerCase() === 'default') {
            return prefix + 'the app name cannot be \'default\'.';
        } else if (await (that.isExistingAppName(appConfig.config.name))) {
            return prefix + 'an app with the same name exists already.';
        }
        return null;
    }

    /***
     * Returns the configuration of the app.
     *
     * @param obj
     * @returns {*}
     */
    getAppConfiguration(obj) {

        let appId;
        if (_.isObject(obj)) {
            appId = obj.appId;
        } else if (_.isString(obj)) {
            appId = obj;
        } else {
            throw new Error('Tried to fetch the app configuration but the given parameter was unexpected.');
        }
        appId = appId || 'default';

        // if the config is "all" we fetch things from the Storage
        // if in the array there is only a string it means it refers to the id in the storage
        const config = this.settings;
        if (_.isString(config.apps) && (config.apps.toLowerCase() === 'all' || config.apps.toLowerCase() === '*')) {
            return this.appStorage.getAppConfiguration(appId)
        } else {
            // try first if the literal objects contain it
            const found = _.find(config.apps, function (x) {
                return x.id.toLowerCase() === appId.toLowerCase();
            });
            if (utils.isDefined(found)) {
                // fallback to the default
                found.pipeline = found.hasOwnProperty('pipeline') && utils.isDefined(found.pipeline) ? found.pipeline : _.cloneDeep(config.defaults.pipeline);
                found.parsers = found.parsers || config.defaults.parsers;
                found.noAnswer = found.noAnswer || config.defaults.noAnswer;
                found.categories = found.hasOwnProperty('categories') && utils.isDefined(found.categories) ? found.categories : config.defaults.categories;
                return Promise.resolve(found);
            } else {
                return Promise.resolve(null);
            }
        }
    }

    /***
     * Returns the name of the current app.
     * @param ctx {SecurityContext} The security context.
     * @returns {Promise<String>}
     */
    getAppName(ctx) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.getAppConfiguration(ctx).then(function (c) {
                if (utils.isDefined(c)) {
                    resolve(c.name);
                } else {
                    resolve(null);
                }
            });
        });

    }

    _saveAppConfiguration(configuration) {
        return this.appStorage.saveAppConfiguration(configuration);
    }

    _deleteAppConfiguration(appId) {
        return this.appStorage.deleteAppConfiguration(appId);
    }

    /**
     * Returns whether the given app id exists.
     *
     * @param {String} appId An app identifier.
     * @returns
     *
     * @memberof Apps
     */
    isAppId(appId) {
        return this.appStorage.appExists(appId);
    }

    /**
     * Returns whether the given app id already exists.
     *
     * @param {String} appId An app identifier.
     * @returns
     *
     * @memberof Apps
     */
    appExists(appId) {
        return this.appStorage.appExists(appId);
    }

    /**
     * Returns whether the given name is the name of an app in the backend.
     *
     * @param {String} name An app name.
     * @returns
     *
     * @memberof Apps
     */
    isExistingAppName(name) {
        return this.appStorage.isExistingAppName(name);
    }

    /**
     * Returns all app identifiers.
     *
     * @returns {Array<String>} All ids.
     *
     * @memberof Apps
     */
    getAppIds() {
        return this.appStorage.getAppIds();
    }

    /**
     * Returns the id of the app with the given name.
     *
     * @param {String} name The name of a supposedly existing app.
     * @returns {Promise<String>} The id of the app.
     *
     * @memberof Apps
     */
    getAppIdFromName(name) {
        // if the config is "all" we fetch things from the Storage
        // if in the array there is only a string it means it refers to the id in the storage
        const config = this.settings;
        if (_.isString(config.apps) && (config.apps.toLowerCase() === 'all' || config.apps.toLowerCase() === '*')) {
            return this.appStorage.getAppIdFromName(name);
        } else {
            // try first if the literal objects contain it
            const found = _.find(config.apps, function (x) {
                return x.name.toLowerCase() === name.toLowerCase();
            });
            if (utils.isDefined(found)) {
                return Promise.resolve(found.id);
            } else {
                Promise.resolve(null);
            }
        }
    }

    /***
     * Gets all the names of the registered apps.
     * @returns {Array}
     */
    getAppNames() {
        return this.appStorage.getAppNames(name);
    }

    /***
     * Returns how many applications have been registered.
     * @returns {Number}
     */
    getAppCount() {
        return this.appStorage.getAppCount();
    }

    /**
     * Fetches all the configurations.
     *
     * @returns {Promise<Array>} All configs.
     *
     * @memberof Apps
     */
    getAllAppConfigurations() {
        return this.appStorage.getAllAppConfigurations();
    }
}

module.exports = Apps;
