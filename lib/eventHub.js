const
    constants = require("./constants"),
    EventEmitter = require('events').EventEmitter;

/**
 * Central hub for events across Qwiery.
 *
 * @class EventHub
 * @extends {EventEmitter}
 */
class EventHub extends EventEmitter {
    /**
     * Creates an instance of EventHub.
     *
     * @memberOf EventHub
     */
    constructor() {
        super();
        this.setMaxListeners(0);
    }

    /**
     * Raises the given event name.
     *
     * @param {String} name The name of the event.
     * @param {any} [arg] An optional argument.
     *
     * @memberOf EventHub
     */
    _raise(name, arg) {
        this.emit(name, arg);
    }

    /**
     * Promise version of the @on event listener.
     *
     * @param {String} name The event to listen to.
     * @returns {Promise<String>}
     *
     * @memberOf EventHub
     */
    when(name) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.on(name, function(arg) {
                resolve(arg)
            });
        });
    }

    /**
     * Listen to the 'PluginLoaded' event and returns when the name of the given plugin
     * was hit. That is, the promise returns when the plugin with the given name
     * has been instantiated and initialized.
     *
     * @param {String} pluginName The name of the plugin
     * @returns {Promise}
     *
     * @memberOf EventHub
     */
    whenPluginLoaded(pluginName) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.on("PluginLoaded", function(name) {
                if(name === pluginName) {
                    resolve()
                }
            });
        });
    }

    whenPackageLoaded() {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.on(constants.PACKAGELOADED, function(name) {
                resolve(name)
            });
        });
    }

    /**
     * Raises the 'PluginLoaded' event, meaning that the plugin is instantiated and initialized (i.e. the init() method returned from its async initializing).
     * The argument specifies the name of the plugin which has been loaded.
     *
     * @param {any} name
     *
     * @memberOf EventHub
     */
    raisePluginLoaded(name) {
        if(name) {
            this._raise("PluginLoaded", name);
        }
    };

    raisePackageLoaded(name) {
        if(name) {
            this._raise(constants.PACKAGELOADED, name);
        }
    };
}
module.exports = new EventHub();
