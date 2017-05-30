const ServiceBase = require("./ServiceBase");
const StorageProxy = require("./StorageProxy");
/**
 * Base class for storage implementations.
 * A storage is just a special service type however and
 * it's loaded as such.
 * @class StorageBase
 * @interface
 */
class StorageBase extends ServiceBase {

    /**
     * Fetch/create the specified collection.
     * This allows implementations to create a table or resource for the caller.
     *
     *
     * @memberOf StorageBase
     * @virtual
     * @param specs
     */
    createCollection(specs) {
        throw new Error("This method should be but is not implemented by the storage.");
    }

    /**
     * Returns whether the given collection exists.
     * @param collectionName
     */
    collectionExists(collectionName){
        throw new Error("This method should be but is not implemented by the storage.");
    }

    /**
     * Inserts the given blob in the storage.
     *
     * @param {any} blob The JSON data.
     * @param {any} collectionName The collection in which to insert the data.
     *
     * @memberOf StorageBase
     */
    insert(blob, collectionName) {
        throw new Error("This method should be but is not implemented by the storage.");
    }

    /**
     * Updates the given blob in the storage.
     *
     * @param {any} blob The JSON data.
     * @param {any} collectionName The collection in which to insert the data.
     *
     * @memberOf StorageBase
     */
    update(blob, collectionName) {
        throw new Error("This method should be but is not implemented by the storage.");
    }

    /**
     * Finds data in the storage based on the given specs.
     *
     * @param {any} specs The criteria.
     * @param {any} collectionName The collection in which to insert the data.
     *
     * @memberOf StorageBase
     */
    find(specs = {}, collectionName) {
        throw new Error("This method should be but is not implemented by the storage.");
    }

    /**
     * Finds a single entry in the storage based on the given specs.
     *
     * @param {any} specs The criteria.
     * @param {any} collectionName The collection in which to insert the data.
     *
     * @memberOf StorageBase
     */
    findOne(specs = {}, collectionName) {
        throw new Error("This method should be but is not implemented by the storage.");
    }

    /**
     * Return a convenience class calling this storage.
     * 
     * @param {StorageDomainBase} domainStorage An instance of StorageDomainBase.
     * @returns {StorageProxy} A proxy to the underlying storage.
     * 
     * @memberOf StorageBase
     */
    getProxy(domainStorage) {
        return new StorageProxy(this, domainStorage);
    }

    /**
     * Closes the connection to the underlying storage system.
     *
     * @virtual
     * @memberOf StorageBase
     */
    close() {
    }

    /**
     * Save the current state of the storage, if applicable to the implementation.
     *
     *
     * @memberOf StorageBase
     */
    save() {
    }
}
/**
 * @module StorageDomainBase
 */
module.exports = StorageBase;