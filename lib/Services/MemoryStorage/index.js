const StorageBase = require("../../Framework/StorageBase");
const StorageProxy = require("../../Framework/StorageProxy");
const loki = require("lokijs");
const path = require("path");
const utils = require("../../utils");
const _ = require("lodash");
/**
 * Memory+File storage implementation based LokiJS.
 * The 'filePath' sets the location where the dump is saved.
 */
class MemoryStorage extends StorageBase {
    constructor() {
        super("storage");
    }

    init(instantiator) {
        super.init(instantiator);
        const that = this;
        return new Promise(function(resolve, reject) {
            that._setupConnection(that.settings).then(function() {
                resolve();
            });
        });
    }

    mapSpecs(specs) {
        if(!specs) {
            return;
        }
        let keys = _.keys(specs);
        let lokiSpecs = specs;
        if(keys.length > 1) {
            lokiSpecs = {$and: []};
            _.forOwn(specs, function(v, k) {
                let condition = {};
                condition[k] = v;
                lokiSpecs.$and.push(condition);
            })
        }
        return lokiSpecs;
    }

    /**
     * Defines the file connection and if autoload is set to true the saved DB will be reloaded.
     *
     * @param {any} settings The storage settings.
     * @returns {Promise<T>} A promise.
     *
     * @memberOf MemoryStorage
     */
    _setupConnection(settings) {
        const that = this;
        let options = this.getPluginSettings();
        return new Promise((resolve, reject) => {
            that.db = new loki(options.filePath, {
                autosave: true,
                autoload: false,
                autosaveInterval: options.autosaveInterval
            });
            if(options.autoload === true) {
                that.db.loadDatabase({}, function() {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    close() {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.save().then(function() {
                that.db = null;
                resolve();
            });
        });
    }

    save() {
        const that = this;
        return new Promise((resolve, reject) => {
            that.db.saveDatabase(function(err) {
                if(err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    _getCreateCollection(storageName, indexSpec) {
        if(utils.isUndefined(storageName)) {
            throw new Error("Cannot create or fetch an empty storage collection.");
        }
        let collection = this.db.getCollection(storageName);
        if(!collection) {
            if(utils.isDefined(indexSpec)) {
                let index = [];
                if(_.isArray(indexSpec)) {
                    index = _.concat(index, indexSpec);
                } else if(_.isString(indexSpec)) {
                    index.push(indexSpec);
                } else {
                    throw new Error("When fetching/creating a storage collection a unique index can only be specified through an index name or an array of names.");
                }
                collection = this.db.addCollection(storageName, {
                    unique: index
                });
            } else {
                collection = this.db.addCollection(storageName);
            }
        }
        return collection;
    }

    createCollection(specs) {
        if(_.isString(specs)) {
            specs = {
                collectionName: specs,
                storageName: specs
            };
        }
        else {
            if(_.isNil(specs.collectionName)) {
                throw new Error("No collectionName specified.");
            }
            if(_.isNil(specs.storageName)) {
                specs.storageName = specs.collectionName;
            }
        }
        this._getCreateCollection(specs.storageName, specs.index);

        return Promise.resolve();
    }

    collectionExists(storageName) {
        let collection = this.db.getCollection(storageName);
        return Promise.resolve(utils.isDefined(collection));
    }

    insert(blob, storageName) {
        let collection = this._getCreateCollection(storageName);
        collection.insert(blob);
        return Promise.resolve();
    }

    update(blob, storageName, condition) {
        const that = this;
        return new Promise(function(resolve, reject) {
            let collection = that._getCreateCollection(storageName);
            collection.update(blob);
            resolve();
        });
    }

    upsert(blob, storageName, condition) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.findOne(condition, storageName).then(function(found) {
                let collection = that._getCreateCollection(storageName);
                if(utils.isDefined(found)) {
                    collection.update(_.assign(found, blob));
                    resolve();
                } else {
                    collection.insert(blob);
                    resolve();
                }
            });
        });
    }

    /**
     *
     * @param specs
     * @param storageName
     * @param sortField The field to sort ascending or an object of the shape \{thefield: true\} for descending sort on the given field, \{thefield: false\} for ascending sort
     * @param limit
     * @returns {Promise<R>|Promise<void>|Promise.<T>}
     */
    find(specs = {}, storageName, sortField, limit) {

        let collection = this._getCreateCollection(storageName);
        let chain = collection.chain().find(this.mapSpecs(specs));
        if(utils.isDefined(sortField)) {
            if(_.isString(sortField)) {
                chain = chain.simplesort(sortField, false);
            } else if(_.isPlainObject(sortField)) {
                let field = _.keys(sortField)[0];
                let desc = sortField[field] === true;
                chain = chain.simplesort(field, desc);
            }
        }
        if(utils.isDefined(limit)) {
            chain = chain.limit(limit);
        }
        return Promise.resolve(chain.data());
    }

    count(specs = {}, storageName) {
        let collection = this._getCreateCollection(storageName);
        let count = 0;
        // count({}) return 0 instead of the real value
        if(_.keys(specs).length === 0) {
            count = collection.count();
        } else {
            count = collection.count(this.mapSpecs(specs));
        }
        return Promise.resolve(count);
    }

    findOne(specs = {}, storageName) {
        let collection = this._getCreateCollection(storageName);
        let found = collection.findOne(this.mapSpecs(specs));
        return Promise.resolve(found);
    }

    remove(specs = {}, storageName) {
        const collection = this._getCreateCollection(storageName);
        const that = this;
        return new Promise(function(resolve, reject) {
            collection.chain().find(that.mapSpecs(specs)).remove();
            resolve();
        });
    }

    distinct(specs = {}, field, storageName) {
        const that = this;
        return new Promise(function(resolve, reject) {
            const result = [];
            // todo: another awkward way to do distinct
            that.find(specs, storageName).then(function(items) {
                for(let i = 0; i < items.length; i++) {
                    const item = items[i][field];
                    if(result.indexOf(item) === -1) {
                        result.push(item);
                    }
                }
                resolve(result);
            });
        });
    }
}
/**
 * @module MemoryStorage
 */
module.exports = MemoryStorage;