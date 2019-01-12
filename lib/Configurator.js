let _ = require("lodash"),
    constants = require("./constants"),
    fs = require('fs-extra'),
    utils = require("./utils"),
    allowedPluginTypes = ["storage", "service", "interpreter", "command"],
    CommandBase = require("./Framework/CommandBase"),
    InterpreterBase = require("./Framework/InterpreterBase"),
    ServiceBase = require("./Framework/ServiceBase"),
    StorageBase = require("./Framework/StorageBase"),
    INTERNAL = "internal",
    EXTERNAL = "external",
    INLINE = "inline";

/**
 * Handles merging, validating, defaulting the configuration of Qwiery.
 * @class Configurator
 * @see {@tutorial Configuration}
 */
class Configurator {
    /**
     * Creates an instance of Configurator.
     * @param {any} settings
     *
     * @memberOf Configurator
     */
    constructor(settings) {
        if(utils.isUndefined(settings)) {
            throw new Error("Missing settings param in Configurator constructor.");
        }
        this._settings = Configurator.merge(settings);
        Configurator.validateCoreServices(this._settings);
        Configurator.validatePlugins(this._settings);
        Configurator.validateDefaultApp(this._settings);
        Configurator.validateApps(this._settings);
    }

    /**
     * Ensures that the given array of plugin definitions is OK.
     *
     * @static
     * @param {array} settings
     *
     * @memberOf Configurator
     */
    static validatePlugins(settings) {
        const plugins = settings.plugins;
        if(utils.isUndefined(plugins) || plugins.length === 0) {
            return;
        }
        if(!_.isArray(plugins)) {
            throw new Error("The 'plugins' settings should be an array.");
        }
        Configurator.validateCollection(plugins);
    }

    /**
     * Ensures the the given array or service definitions is OK.
     *
     * @static
     * @param {any} settings
     *
     * @memberOf Configurator
     */
    static validateCoreServices(settings) {
        const services = settings.system.coreServices;
        if(utils.isUndefined(services) || services.length === 0) {
            return;
        }
        if(!_.isArray(services)) {
            throw new Error("The 'coreServices' settings should be an array.");
        }
        Configurator.validateCollection(services);
    }

    /**
     * Gets the current settings (after merge, validation and all).
     *
     * @readonly
     *
     * @memberOf Configurator
     */
    get settings() {
        return this._settings;
    }

    /**
     * Replace, merge, import settings.
     */
    static importSettings(defaultSettings, blob) {
        if(utils.isUndefined(blob)) {
            return defaultSettings;
        }
        else if(_.isArray(blob)) {
            // means replace
            return blob;
        }
        else if(_.isString(blob)) {
            // means replace
            return blob;
        }
        else if(_.isPlainObject(blob)) {
            // here the strategy can indicate what to do
            if(!blob.items) {
                throw new Error("Expected items but found none.")
            }
            if(blob.strategy) {
                if(blob.strategy === "merge") {
                    return _.concat(defaultSettings, blob.items);
                } else {// means replace
                    return blob.items;
                }
            } else {
                // the default is merge
                return _.concat(defaultSettings, blob.items);
            }
        } else if(_.isFunction(blob)) {
            // the function does it all
            return blob(defaultSettings);
        }
    }

    /**
     * Merges the default settings with the user-defined ones.
     */
    static fuse(defaultSettings, settings) {
        const result = _.merge(_.cloneDeep(defaultSettings), settings);
        for(const key in defaultSettings) {
            if(defaultSettings.hasOwnProperty(key)) {
                switch(key) {
                    case "apps":

                    case "storageOptions":
                        result[key] = Configurator.importSettings(defaultSettings[key], settings[key]);
                        break;
                    case "defaults":
                        if(settings.defaults && settings.defaults.pipeline) {
                            result.defaults.pipeline = Configurator.importSettings(defaultSettings.defaults.pipeline, settings.defaults.pipeline);
                        }
                        break;
                    case "system":
                        if(settings.system && settings.system.coreServices) {
                            result.system.coreServices = Configurator.importSettings(defaultSettings.system.coreServices, settings.system.coreServices);
                        }
                        if(settings.system && settings.system.coreInterpreters) {
                            result.system.coreInterpreters = Configurator.importSettings(defaultSettings.system.coreInterpreters, settings.system.coreInterpreters);
                        }
                        break;
                    default:
                        break;
                }

            }
        }
        return result;
    }

    /**
     * Merges the given settings with the default ones.
     *
     * @static
     * @param {any} settings The given settings.
     * @returns {any} The merged settings.
     *
     * @memberOf Configurator
     */
    static merge(settings) {
        const defaultConfig = require("./config.default");
        return Configurator.fuse(_.cloneDeep(defaultConfig), settings);
    }

    /**
     * Ensures that the name is a proper (own) property of the object
     * with a non-null, non-empty value.
     * @static
     * @param {any} obj Any plain object or instance.
     * @param {string} memberName A property name.
     * @returns {boolean} `true` if the member is present and not nil.
     *
     * @memberOf Configurator
     */
    static hasValidMember(obj, memberName) {
        if(!obj.hasOwnProperty(memberName)) {
            return false;
        }
        if(_.isString(obj[memberName]) && obj[memberName].trim().length === 0) {
            return false;
        }
        return true;
    }

    /**
     * Ensures that the given array is a collection of service/interpreter definitions.
     * How plugins should be defined and what properties are required is explained in the [Plugins overview]{@tutorial Plugins}
     * @param settings
     * @see {@tutorial Plugins}
     */
    static validateCollection(collection) {

        // let's accept a settings block as well and rewire
        if(_.isPlainObject(collection) && collection.plugins) {
            collection = collection.plugins;
        }
        if(!_.isArray(collection)) {
            throw new Error("Validation on a non-array object.");
        }

        for(let i = 0; i < collection.length; i++) {
            let definition = collection[i];
            if(_.isString(definition)) {
                // plugin._pluginSource = INTERNAL;
                definition = definition.toLowerCase();
                continue;
            }
            const hasPath = Configurator.hasValidMember(definition, "path");
            const hasName = Configurator.hasValidMember(definition, "name");
            const hasType = Configurator.hasValidMember(definition, "type");
            // at this point we need a name or a path, if neither the definition is not valid
            if(!hasPath && !hasName) {
                throw new Error(`Specification at position ${i} is not a valid plugin definition.`)
            }
            if(hasPath && hasType) {
                throw new Error(`The plugin definition at position ${i} cannot have both a path and a type specification.`);
            }
            if(hasPath) { // with a path you have an external plugin
                if(!fs.existsSync(definition.path)) {
                    throw new Error(`The plugin path '${definition.path}' at position ${i} does not exist.`);
                }
                definition._pluginSource = EXTERNAL;
                // the name is used or the path
                if(hasName) {
                    // lowercasing
                    definition.name = definition.name.trim().toLowerCase();
                    definition._pluginIdentifier = definition.name;
                } else {
                    definition._pluginIdentifier = definition.path.toLowerCase();
                }
            } else { // internal or inline
                definition.name = definition.name.trim().toLowerCase();
                if(!utils.isAlphaNumeric(definition.name)) {
                    throw new Error("A plugin name should be alphanumeric.");
                }
                if(hasType) {
                    definition.type = definition.type.toLowerCase();
                    if(!_.includes(allowedPluginTypes, definition.type)) {
                        throw new Error(`A plugin should specify one of the following types: ${allowedPluginTypes.join(', ')}.`);
                    }
                    definition._pluginSource = INLINE;
                    definition._pluginIdentifier = definition.name;
                    // check the inline plugin has the required members
                    switch(definition.type) {
                        case "storage":
                            utils.checkImplementation(StorageBase, definition);
                            break;
                        case "service":
                            utils.checkImplementation(ServiceBase, definition);
                            break;
                        case "interpreter":
                            utils.checkImplementation(InterpreterBase, definition);
                            break;
                        case "command":
                            utils.checkImplementation(CommandBase, definition);
                            break;
                        default:
                            throw new Error(`Plugin at index ${i} should have either a 'path' specification or a type implementation.`);
                    }

                } else {
                    definition._pluginSource = INTERNAL;
                    definition._pluginIdentifier = definition.name.toLowerCase();
                }
            }


        }

        // check duplicate declaration
        for(let i = 0; i < collection.length; i++) {
            let pluginIdentifier = utils.isDefined(collection[i]._pluginIdentifier) ? collection[i]._pluginIdentifier : collection[i].toLowerCase();
            if(i < collection.length - 1) {
                for(let j = i + 1; j < collection.length; j++) {
                    let d = utils.isDefined(collection[j]._pluginIdentifier) ? collection[j]._pluginIdentifier : collection[j].toLowerCase();
                    if(pluginIdentifier === d) {
                        throw new Error(`Duplicate plugin declaration at positions ${i} and ${j}.`);
                    }
                }
            }
        }
    }

    /**
     * Validates the array of apps.
     *
     * @static
     * @param {array} settings
     *
     * @memberOf Configurator
     */
    static validateApps(settings) {
        if(utils.isUndefined(settings.apps)) {
            throw new Error("No 'apps' section defined.");
        }
        if((!_.isArray(settings.apps)) && (_.isString(settings.apps) && settings.apps.trim() !== "*")) {
            throw new Error("The 'apps' section should be either an array or '*' (specificying all backend apps).");
        }
        if(settings.apps.length === 0) {
            throw new Error("The 'apps' section cannot be an empty array.");
        }
        for(let i = 0; i < settings.apps.length; i++) {
            const item = settings.apps[i];
            if(_.isString(item)) {
                // presumably the name of a backend app
                // in which case all is specified there
                continue;
            }
            //--------------- an inline app ----------------------------
            if(!_.isPlainObject(item)) {
                throw new Error(`The 'apps' array should be either strings or plain objects. Item at position ${i} is incorrect.`);
            }
            if(utils.isUndefined(item.name)) {
                throw new Error(`App specification at position ${i} does not have a name property.`);
            }
            item.name = item.name.trim();
            if(item.name.length === 0) {
                throw new Error(`The name of app specification at position ${i} is empty.`);
            }
            if(utils.isUndefined(item.id)) {
                throw new Error(`The inline app specification at position ${i} does not have an id.`);
            }
        }
    }

    /**
     * Ensures that a valid default app has been set.
     *
     * @static
     * @param {any} settings
     *
     * @memberOf Configurator
     */
    static validateDefaultApp(settings) {
        if(utils.isUndefined(settings.defaultApp)) {
            throw new Error("A 'defaultApp' has not been set.")
        } else {
            settings.defaultApp = settings.defaultApp.trim();
        }
        // but does the given one exist?
        // if "*" it should be checked via the service but this
        // service has not been loaded at this point.
        if(settings.apps !== "*") {
            let found = _.find(settings.apps, function(x) {
                // can be defined as a string or as JSON
                if(_.isString(x)) {
                    return x === settings.defaultApp;
                } else {
                    return x.name === settings.defaultApp;
                }
            });
            if(utils.isUndefined(found)) {
                throw new Error("The specified 'defaultApp' is not part of the 'apps'.");
            }
        }
    }

}

module.exports = Configurator;
