const _ = require("lodash");
const utils = require("../utils");
const StorageBase = require("../Framework/StorageBase");
const Instantiator = require("../Instantiator");

/**
 * Base class for domains (graph, oracle...) of the main storage implementation.
 * @class StorageDomainBase
 */
class StorageDomainBase {
    /**
     * Creates an instance of StorageDomainBase.
     * @param {StorageBase} parentStorage
     *
     * @memberOf StorageDomainBase
     */
    constructor(parentStorage) {
        if(utils.isUndefined(parentStorage)) {
            throw new Error(`Missing storage in the ctor of the ${this.constructor.name} instance.`);
        }
        if(!(parentStorage instanceof StorageBase)) {
            throw new Error(`The class ${this.constructor.name} is not instantiate with a StorageBase parent instance.`);
        }
        /**
         * Pointer to the parent/root storage.
         */
        this.storage = parentStorage;
    }

    /**
     * Inits this storage.
     *
     * @returns {Promise}
     *
     * @memberOf StorageDomainBase
     * @param instantiator {Instantiator} The Qwiery instantiator.
     */
    init(instantiator) {
        if(!(instantiator instanceof Instantiator)) {
            throw new Error(`The class ${this.constructor.name} is not initialized with an Instantiator parent instance.`);
        }
        this.settings = instantiator.settings;
        this.services = instantiator.services;
        this.interpreters = instantiator.interpreters;
        return Promise.resolve();
    }

    /**
     * Creates one or more collections.
     * @param colls {Array} One or more collection definitions.
     * @return {Promise<R[]>|Promise<U[]>|Promise.<*>}
     * @see createCollection
     */
    createCollections(...colls) {
        let actions = [];
        for(let i = 0; i < colls.length; i++) {
            const specs = colls[i];
            actions.push(this.createCollection(specs));
        }
        return Promise.all(actions);
    }

    /**
     * {
     *  collectionName:
     *  storageName (optional)
     * }
     * @param specs
     * @returns {*}
     */
    createCollection(specs) {
        if(_.isString(specs))// just a name
        {
            this.storageName = specs;
            this.collectionName = specs;
        }
        else if(_.isPlainObject(specs)) {
            if(utils.isUndefined(specs.collectionName)) {
                throw new Error("Missing 'collectionName' on collection creation specification.");
            }
            if(utils.isDefined(specs.storageName)) {
                this.storageName = specs.storageName;
            } else {
                this.storageName = specs.collectionName;
                specs.storageName = specs.collectionName;
            }
            this.collectionName = specs.collectionName;
        } else {
            throw new Error("Collection specification should be a string or an object of the form {collectionName:...}.");
        }
        this.storage[this.storageName] = this;
        this[this.collectionName] = this.storage.getProxy(this);
        return this.storage.createCollection(specs);
    }
}

module.exports = StorageDomainBase;