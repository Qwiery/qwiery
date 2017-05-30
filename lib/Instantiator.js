const path = require("path"),
    utils = require("./utils"),
    ServiceBase = require("./Framework/ServiceBase"),
    fs = require('fs'),
    _ = require('lodash'),
    assert = require('assert'),
    eventHub = require("./eventHub");

/**
 * Instantiates, locates, inits plugins.
 * @tutorial Plugins
 * @class Instantiator
 */
class Instantiator {
    /**
     * Creates a new instance.
     * @param settings {Object} The Qwiery settings.
     */
    constructor(settings) {
        this.settings = settings;
        this.services = {};
        this.storages = {};
        this.commands = {};
        this.interpreters = {};
        this.plugins = {};
        this.goLoadItAll();
    }

    /**
     * Loads the various pieces.
     */
    goLoadItAll() {
        this._loadCoreServices();
        this._loadPlugins();
        this._loadInterpreters();
    }

    /**
     * Loads the stuff defined in the `coreServices`.
     * @private
     */
    _loadCoreServices() {
        if(this.settings.system && this.settings.system.coreServices) {
            const coreServices = this.settings.system.coreServices;
            coreServices.forEach(s =>
                this._loadDefinition(s)
            );
        }
    }

    /**
     * Loads the stuff defined in the `plugins` section.
     * @private
     */
    _loadPlugins() {
        if(utils.isDefined(this.settings.plugins) && this.settings.plugins.length > 0) {
            this.settings.plugins.forEach(s => this._loadDefinition(s));
        }
    }

    /**
     * Loads the stuff in the `interpreters` section.
     * @private
     */
    _loadInterpreters() {

        if(utils.isDefined(this.settings.system.coreInterpreters) && this.settings.system.coreInterpreters.length > 0) {
            this.settings.system.coreInterpreters.forEach(s => this._loadDefinition(s, "Interpreters"));
        }
    }

    /**
     * Loads the given service.
     * @param nameOrObject {string|Object} See the [Plugins](lib/Documents/Plugins) documentation.
     * @private
     */
    /*
     {name: name of Qwiery core service, options:...}
     {path: path to external service, options:...}
     name (corresponds to name or core service
     */
    _loadDefinition(nameOrObject, moduleDirectory = "./Services/") {
        // note that the Configurator has added members'_pluginSource' and '_pluginIdentifier' unless it's just a string
        // if just a string it's automatically a core service
        const that = this;
        let fullPath = null;
        if(_.isString(nameOrObject)) { // core service
            if(nameOrObject.indexOf("/") > -1) {
                throw new Error("Given Core service is suspecious; contains '/'.");
            }
            fullPath = path.join(__dirname, moduleDirectory, nameOrObject);
            if(!fs.existsSync(fullPath)) {
                throw new Error("The service path '" + fullPath + "' does not exist.");
            }
            const descriptor = {
                pluginSource: "internal",
                path: fullPath,
                pluginIdentifier: nameOrObject
            };
            this._distribute(null, descriptor);
        } else {
            // just to be clear we are dealing with a plain object from now on
            const definition = nameOrObject;
            let descriptor;
            if(utils.isUndefined(definition._pluginSource)) {
                throw new Error("Use the Configurator class to parse the settings first, some necessary members are missing.");
            }
            switch(definition._pluginSource) {
                case "internal":
                    this._loadDefinition(definition.name);
                    break;
                case "external":
                    descriptor = {
                        pluginSource: "external",
                        path: definition.path,
                        pluginIdentifier: definition._pluginIdentifier
                    };
                    this._distribute(null, descriptor);
                    break;
                case "inline":
                    descriptor = {
                        pluginSource: "inline",
                        path: null,
                        pluginIdentifier: definition.name
                    };
                    definition.pluginIdentifier = definition.name;
                    definition.pluginSource = "inline";
                    // no need to instantiate a plain object
                    this._distribute(definition, descriptor);
                    break;
            }
        }

    }

    /**
     * Effectively instantiates the given definition.
     * @param descriptor {Object} What to instantiate.
     * @private
     */
    _instantiate(descriptor) {

        const pluginClass = Instantiator.requireDescriptor(descriptor);
        // set the type
        const baseClass = Reflect.getPrototypeOf(pluginClass).name;
        const allowedBaseClasses = ["ServiceBase", "CommandBase", "InterpreterBase", "StorageBase"];
        if(!_.includes(allowedBaseClasses, baseClass)) {
            throw new Error(`A plugin should inherit from one of these base classes: ${allowedBaseClasses.join(", ")}`);
        }

        const instance = new pluginClass(this.settings);
        const pluginName = instance.pluginName;
        Instantiator._validatePluginName(pluginName);

        // this one is necessary to figure out where it was defined in the config
        instance.pluginIdentifier = descriptor.pluginIdentifier;
        instance.pluginType = baseClass.toLowerCase().replace("base", "");
        instance.pluginSource = descriptor.pluginSource;
        if(instance.init) {
            instance.isInitialized = false;
            instance.init(this).then(function() {
                instance.isInitialized = true;
                eventHub.raisePluginLoaded(descriptor.pluginIdentifier);
            });
        }


        this._pushInstance(instance.pluginType, pluginName, instance, descriptor.pluginIdentifier);
    }

    /**
     * Returns when the plugin is instantiated and initialized.
     * @param pluginIdentifier {string} The lower-cased identifier. This is the name (internal and inline) or the path (external plugin) of the plugin lower-cased.
     * @returns {Promise}
     */
    whenPluginLoaded(pluginIdentifier) {
        if(this.plugins[pluginIdentifier]) {
            if(this.plugins[pluginIdentifier].isInitialized) {
                // it's already loaded and initialized
                return Promise.resolve();
            }
        }
        // have to wait a bit
        return new Promise(function(resolve, reject) {
            eventHub.whenPluginLoaded(pluginIdentifier).then(function() {
                return resolve();
            });
        });
    }

    /**
     * Differentiates between an inline instance and the definition of something to
     * be instantiated.
     * @param instance
     * @param descriptor
     * @private
     */
    _distribute(instance, descriptor) {
        if(descriptor.pluginSource === "inline") {
            // type and name are mandatory
            this._pushInstance(instance.type, instance.name, instance, descriptor.pluginIdentifier);
        } else {
            this._instantiate(descriptor);
        }
    }

    /**
     * Places the given instance in the appropriate bucket.
     * @param type
     * @param name
     * @param instance
     * @param identifier
     * @private
     */
    _pushInstance(type, name, instance, identifier) {

        const allowedTypes = ["service", "command", "interpreter", "storage"];
        if(!_.includes(allowedTypes, type)) {
            throw new Error(`A plugin should inherit from one of these base classes: ${allowedBaseClasses.join(", ")}`);
        }
        if(utils.isUndefined(identifier) || identifier.trim().length === 0) {
            throw new Error("Attempt to add a plugin without an identifier.");
        }
        identifier = identifier.toLowerCase();
        if(utils.isUndefined(this.plugins[identifier])) {
            this.plugins[identifier] = instance;
        } else {
            throw new Error(`Plugin with identifier '${instance.pluginIdentifier}' appears multiple times.`);
        }
        // bit of remapping to make things somewhat more readable
        switch(type) {
            case "command":
                if(utils.isUndefined(this.commands[name])) {
                    this.commands[name] = instance;
                } else {
                    throw new Error(`Command plugin with name, pluginName or path '${instance.pluginIdentifier}' appears multiple times.`);
                }
                break;
            case "interpreter":
                if(utils.isUndefined(this.interpreters[name])) {
                    this.interpreters[name] = instance;
                } else {
                    throw new Error(`Interpreter plugin with name, pluginName or path '${instance.pluginIdentifier}' appears multiple times.`);
                }
                break;
            case "storage": // storage is just a special kind of service
            case "service":
                if(utils.isUndefined(this.services[name])) {
                    this.services[name] = instance;
                } else {
                    throw new Error(`Service plugin with name, pluginName or path '${instance.pluginIdentifier}' appears multiple times.`);
                }
                break;
        }
    }

    /**
     * Checks whether the name is acceptable for a service.
     * @param name {string} The proposed service name.
     * @private
     */
    static _validatePluginName(name) {
        if(utils.isUndefined(name)) {
            throw new Error("A plugin should have a valid 'pluginName' property.");
        }
        if(!utils.isAlphaNumeric(name)) {
            throw new Error("A service should have a valid 'pluginName' property. Use only letters and numbers.");
        }
    }

    static requireDescriptor(descriptor) {
        try {
            const service = require(descriptor.path);
            if(utils.isDefined(service)) {
                return service;
            }
        }
        catch(e) {
            throw new Error(`Failed to load the service '${descriptor.path}'. Check path and/or imports.`);
        }
        throw new Error(`Service '${descriptor.path}' could not be found, please check the path.`);
    }
}

module.exports = Instantiator;