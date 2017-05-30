const utils = require("../utils");
const _ = require("lodash");
/**
 * Base class for all Qwiery plugins.
 * @class FrameworkBase
 */
class FrameworkBase {
    /**
     * Creates an instance of FrameworkBase.
     * @param {string} pluginName The (unique) name of the plugin as used in the API. For example, if this is a service and the pluginName is `funny` the instance will be accessible as `this.services.funny`.
     * @see ServiceBase
     * @see StorageBase
     * @see Graph
     * @memberOf FrameworkBase
     */
    constructor(pluginName) {
        this.pluginName = pluginName;
    }

    /**
     * Initializes this plugin.
     *
     * @param {Instantiator} instantiator An instance of the `Instantiator` class.
     * @returns {Promise}
     *
     * @memberOf FrameworkBase
     */
    init(instantiator) {
        // the settings can also be specified in the init method,
        // so we'll allow undefined/null here
        this.settings = instantiator.settings;
        this.services = instantiator.services;
        this.interpreters = instantiator.interpreters;
        this.commands = instantiator.commands;
        if(this.services.storage) {
            this.storage = this.services.storage;
        }
        return Promise.resolve();
    }

    /**
     * Returns the definition of the plugin.
     * Note that an inline plugin cannot use this method since it does not inherit
     * from this class.
     * @returns {*}
     */
    getPluginSettings() {
        let item, i;
        if(utils.isUndefined(this.pluginIdentifier)) {
            return {};
        }
        let coreServices = this.settings.system.coreServices;
        for(i = 0; i < coreServices.length; i++) {
            item = coreServices[i];
            // if defined as a string there are no options set anyway
            if(_.isPlainObject(item) && item.name === this.pluginIdentifier) {
                return item;
            }
        }
        let plugins = this.settings.plugins;
        for(i = 0; i < plugins.length; i++) {
            item = plugins[i];
            // plugin has a path, cannot have a name
            if(_.isPlainObject(item) && item._pluginIdentifier === this.pluginIdentifier) {
                return item;
            }
        }
        return {};
    }

    /**
     * Checks is the given collectionName exists and
     * creates things if not.
     * @param descriptor Contains at least a 'collectionName' and 'schema' property. Optionally an 'index'. Not all storage implementation use this info, the collectionName is in some cases enough.
     * @returns {Promise}
     */
    createCollectionIfNotPresent(descriptor) {
        if(!descriptor.collectionName) {
            throw new Error("Missing collectionName.")
        }
        if(!descriptor.schema) {
            throw new Error("Missing schema.")
        }
        return new Promise(function(resolve, reject) {
            that.storage.collectionExists(descriptor.collectionName).then(function(yn) {
                if(yn === false) {
                    that.storage.createCollection(descriptor).then(function() {
                        resolve()
                    });
                }
            });
        });
    }
}

module.exports = FrameworkBase;