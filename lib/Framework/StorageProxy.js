const utils = require("../utils");
/**
 * Simplifies the access to a storage domain.
 *
 * @class StorageProxy
 */
class StorageProxy {
    constructor(storage, domain) {
        this.storage = storage;
        this.storageName = domain.storageName;
    }

    insert(blob) {
        return this.storage.insert(blob, this.storageName);
    }

    find(specs, sortSpec, limit) {
        return this.storage.find(specs, this.storageName, sortSpec, limit);
    }

    findOne(specs) {
        return this.storage.findOne(specs, this.storageName);
    }

    count(specs) {
        return this.storage.count(specs, this.storageName);
    }

    remove(specs) {
        return this.storage.remove(specs, this.storageName);
    }

    update(blob, condition) {
        if(utils.isUndefined(condition)) {
            throw new Error("Very likely that the storage implementation needs the condition to be specified in order to update the item.");
        }
        return this.storage.update(blob, this.storageName, condition);
    }

    upsert(blob, condition) {
        if(utils.isUndefined(condition)) {
            throw new Error("Very likely that the storage implementation needs the condition to be specified in order to update the item.");
        }
        return this.storage.upsert(blob, this.storageName, condition);
    }

    distinct(specs, field) {
        return this.storage.distinct(specs, field, this.storageName);
    }
}

module.exports = StorageProxy;