const StorageBase = require('../../Framework/StorageBase');
const StorageProxy = require('../../Framework/StorageProxy');
const loki = require('lokijs');
const path = require('path');
const _ = require('lodash');
const utils = require('../../utils');
const assert = require('assert');
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false); //https://github.com/Automattic/mongoose/issues/7108
/**
 * Mongo storage implementation.
 */
class MongoStorage extends StorageBase {
    constructor() {
        super('storage');
        this.collections = {};
        this._isConnected = false;

        this.db = null;
    }

    init(instantiator) {
        super.init(instantiator);
        if (this._isConnected) {
            return Promise.resolve();
        }
        return this._setupConnection(this.settings);
    }

    /**
     * Initiates the connection to Mongo.
     * @param settings {*} Either a settings object or just the URI to the mongo db.
     * @returns {Promise.<T>}
     * @private
     */
    _setupConnection(settings) {
        const that = this;
        let dbURI, dbOptions;

        let options = this.getPluginSettings();
        if (this._isConnected) {
            return Promise.resolve();
        }
        mongoose.Promise = global.Promise;
        return new Promise(function (resolve, reject) {
            // that.mongoose.connection.on('connected', function() {
            //     console.log('Mongoose connected to ' + dbURI);
            //     that._isConnected = true;
            //     resolve();
            // });
            mongoose.connection.on('error', function (err) {
                console.log('Mongoose connection error: ' + err);
            });
            // that.mongoose.connection.on('disconnected', function() {
            //     console.log('Mongoose disconnected');
            //     that._isConnected = false;
            //     that.mongoose = null;
            // });
            process.on('SIGINT', function () {
                mongoose.connection.close(function () {
                    //console.log('Mongoose disconnected through app termination');
                    process.exit(0);
                });
                that._isConnected = false;
            });
            if (_.isString(options)) {
                dbURI = options;
            } else {

                dbURI = options.connection;
                dbOptions = _.cloneDeep(options);
            }


            // that.mongoose.connect(dbURI, {
            //     server: {socketOptions: {keepAlive: 300000, connectTimeoutMS: 30000}},
            //     replset: {socketOptions: {keepAlive: 300000, connectTimeoutMS: 30000}}
            // }).then(
            //     () => {
            //         that._isConnected = true;
            //         resolve()
            //     },
            //     err => {
            //         reject(err)
            //     }
            // );
            that.db = mongoose.createConnection(dbURI, {
                keepAlive: 300000,
                connectTimeoutMS: 30000,
                useNewUrlParser: true
            });
            that._isConnected = true;
            resolve()
        });


    }

    /*
     {
     storageName:
     schema:
     index:
     }
     * */
    createCollection(specs) {
        if (_.isString(specs)) {
            specs = {
                collectionName: specs,
                storageName: specs
            };
        } else {
            if (_.isNil(specs.collectionName)) {
                throw new Error('No collectionName specified.');
            }
            if (_.isNil(specs.storageName)) {
                specs.storageName = specs.collectionName;
            }
        }

        if (utils.isUndefined(specs.schema)) {
            throw new Error('Cannot create a Mongo collection without a schema.');
        }
        if (utils.isDefined(this.db.models[specs.storageName])) {
            return Promise.resolve();
        }
        const schema = new mongoose.Schema(specs.schema, {collection: specs.storageName});
        this.collections[specs.storageName] = this.db.model(specs.storageName, schema);

        return Promise.resolve();
    }

    collectionExists(storageName) {
        const that = this;
        return new Promise(function (resolve, reject) {
            resolve(that.db.base.modelSchemas.hasOwnProperty(storageName));
        });
    }

    getCollection(storageName) {
        if (utils.isUndefined(storageName)) {
            throw new Error('Cannot create or fetch an empty storage collection.');
        }
        if (_.isNil(this.collections[storageName])) {
            throw new Error(`The collection '${storageName}' has not been created.`);
        }
        return this.collections[storageName];
    }

    insert(blob, storageName) {
        let collection = this.getCollection(storageName);
        let item = new collection(blob);
        return new Promise(function (resolve, reject) {
            item.save(function (err, topi, affected) {
                if (err) reject(err);
                else resolve(topi);
            })
        });

    }

    update(blob, storageName, condition = {}) {
        let collection = this.getCollection(storageName);
        const that = this;
        return new Promise(function (resolve, reject) {
            collection.findOneAndUpdate(condition, blob, {upsert: true}, function (err, doc) {
                if (err) reject(err);
                else resolve(doc);
            });

        });
    }

    upsert(blob, storageName, condition) {
        return this.update(blob, storageName, condition);
    }

    find(specs = {}, storageName, sortField, limit = 10000) {
        let collection = this.getCollection(storageName);
        return new Promise(function (resolve, reject) {
            let sorter = {};
            if (utils.isDefined(sortField)) {
                if (_.isString(sortField)) {
                    sorter[sortField] = 1;
                } else {
                    let field = _.keys(sortField)[0];
                    let desc = sortField[field] === true;
                    // mongoose descending is -1
                    sorter[field] = desc ? -1 : 1;
                }
            }
            collection.find(specs).sort(sorter).limit(limit).exec(function (err, items) {
                if (err) {
                    reject(err);
                } else {
                    resolve(items);
                }
            });

        });
    }

    count(specs = {}, storageName) {
        let collection = this.getCollection(storageName);
        return new Promise(function (resolve, reject) {
            collection.countDocuments(specs, function (err, count) {
                resolve(count);
            });
        });
    }

    findOne(specs = {}, storageName) {
        const collection = this.getCollection(storageName);
        return new Promise(function (resolve, reject) {
            assert(utils.isDefined(collection), `Could not fetch ${storageName} collection.`);
            collection.findOne(specs).then(function (item) {
                resolve(item);
            });
        });
    }

    remove(specs = {}, storageName) {
        const collection = this.getCollection(storageName);
        return new Promise(function (resolve, reject) {
            collection.deleteMany(specs, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    distinct(specs = {}, field, storageName) {
        const collection = this.getCollection(storageName);

        return new Promise(function (resolve, reject) {
            collection.find(specs).distinct(field, function (err, items) {
                if (err) {
                    reject(err);
                } else {
                    resolve(items);
                }
            })
        });
    }

    /**
     * Explicitly closes the MongoDB connection.
     */
    close() {
        this._isConnected = false;
        this._busyConnecting = false;
        const that = this;
        return new Promise(function (resolve, reject) {
            that.db.disconnect().then(function () {
                resolve();
            });
        });
    }

    save() {

    }

}

module.exports = MongoStorage;
