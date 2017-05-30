const StorageBase = require("../../lib/Framework/StorageBase");
const StorageProxy = require("../../lib/Framework/StorageProxy");
const loki = require("lokijs");
const path = require("path");
const utils = require("../../lib/utils");

/**
 * Most basic implementation of the StrageBase class.
 * It uses LokiJS but you can do things with direct file access if you prefer.
 * Or use MS SQL or SAP Hana or your favorite backend system.
 */
class BasicStorage extends StorageBase {
    constructor() {
        super("tester");
    }

    init(instantiator) {
        super.init(instantiator);

        const that = this;
        return new Promise(function(resolve, reject) {
            that._setupConnection().then(function() {
                resolve();
            });
        });
    }

    _setupConnection() {
        const that = this;
        return new Promise((resolve, reject) => {
            that.db = new loki(path.join(__dirname, `${+new Date()}.json`), {
                autosave: true,
                autoload: false,
                autosaveInterval: 2000
            });
            resolve();
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

    _getCreateCollection(collectionName, index) {
        if(utils.isUndefined(collectionName)) {
            throw new Error("Cannot create or fetch an empty storage collection.");
        }
        let collection = this.db.getCollection(collectionName);
        if(!collection) {
            if(utils.isDefined(index)) {
                let index = [];
                if(_.isArray(options)) {
                    index = _.concat(index, options);
                } else if(_.isString(options)) {
                    index.push(options);
                } else {
                    throw new Error("When fetching/creating a storage collection a unique index can only be specified through an index name or an array of names.");
                }
                collection = this.db.addCollection(collectionName, {
                    unique: index
                });
            } else {
                collection = this.db.addCollection(collectionName);
            }
        }
        return collection;
    }

    createCollection(specs) {
        let collectionName = specs.collectionName;
        if(utils.isUndefined(collectionName)) {
            throw new Error("Cannot create or fetch an empty storage collection; collectionName is not set.");
        }

        this._getCreateCollection(specs.collectionName, specs.index);
        return Promise.resolve();
    }

    insert(blob, collectionName) {
        let collection = this._getCreateCollection(collectionName);
        collection.insert(blob);
        return Promise.resolve();
    }

    update(blob, collectionName) {
        let collection = this._getCreateCollection(collectionName);
        collection.update(blob);
        return Promise.resolve();
    }

    find(specs = {}, collectionName) {
        let collection = this._getCreateCollection(collectionName);
        let found = collection.find(specs);
        return Promise.resolve(found);
    }

    findOne(specs = {}, collectionName) {
        let collection = this._getCreateCollection(collectionName);
        let found = collection.findOne(specs);
        return Promise.resolve(found);
    }

    getProxy(domainStorage) {
        return new StorageProxy(this, domainStorage);
    }
}
module.exports = BasicStorage;