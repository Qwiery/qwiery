const
    utils = require('../../utils'),
    constants = require('../../constants'),
    path = require('path'),
    fs = require("fs-extra"),
    assert = require("assert"),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
const StorageDomainBase = require("../../Framework/StorageDomainBase");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
/**
 * Manages the storage of oracle rules.
 *
 * @class OracleStorage
 * @extends {StorageDomainBase}
 */
class OracleStorage extends StorageDomainBase {


    init(instantiator) {
        super.init(instantiator);
        if(this.storage.constructor.name === "MongoStorage") {
            const mongoose = require('mongoose');

            return this.createCollections({
                    collectionName: "Oracle",
                    schema: {
                        Id: String,
                        Questions: [String],
                        Topics: [String],
                        UserId: String,
                        Category: String,
                        Template: mongoose.Schema.Types.Mixed
                    }
                }
            );
        } else {
            return this.createCollections("Oracle");
        }
    }


    reset() {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.Oracle.count({}, function(err, count) {
                that.qtlCount = count || 0;
                //console.log("Found " + count + " templates.");
                resolve();
            })
        });
    }

    /**
     * Loads the oracle files into mongo.
     */
    loadFiles(dirPath) {
        const filenames = fs.readdirSync(dirPath);
        let count = 0;
        let actions = [];
        for(let i = 0; i < filenames.length; i++) {
            const filename = filenames[i];
            if(path.extname(filename) !== ".json") {
                continue;
            }

            const filePath = path.join(dirPath, filename);
            actions.push(this.loadFile(filePath));
        }
        return Promise.all(actions);
    }

    /**
     * Loads the given file containing one or more templates.
     * @param filePath
     * @returns {Promise.<Number>} Returns the amount of templates loaded.
     */
    loadFile(filePath) {
        const exists = fs.existsSync(filePath);
        let count = 0;
        if(exists) {
            const items = fs.readJsonSync(filePath, 'utf8');
            if(_.isArray(items)) {
                let actions = [];
                for(let j = 0; j < items.length; j++) {
                    const template = items[j];
                    if(!_.isArray(template.Questions)) {
                        template.Questions = [template.Questions];
                    }
                    actions.push(this.upsert(template));
                }
                return Promise.all(actions).then(function() {
                    return items.length;
                });
            }
            if(_.isPlainObject(items)) {
                if(!_.isArray(template.Questions)) {
                    template.Questions = [template.Questions];
                }
                return this.upsert(template).then(function() {
                    return 1;
                });
            }
            throw new Error(`Unexpected data in ${filePath}. Should be JSON.`);
        } else {
            throw new Error(`File '${filePath}' does not exist.`);
        }
    }

    /**
     * Finds the QTL with specified Id.
     * @param id The unique identifier of the QTL item.
     * @returns {*}
     */
    findId(id) {
        return this.Oracle.findOne({"Id": id});
    }

    /**
     * Removes the QTL with specified id across the index and saves the category it sits in.
     * This method is specific to global QTL, NOT app-specific.
     * @param id
     * @returns {boolean}
     */
    removeId(id) {
        return this.Oracle.remove({Id: id});
    }

    /**
     * Adds a single QTL item.
     * @param qtl A single QTL item.
     */
    addItem(qtl) {
        if(utils.isUndefined(qtl.Id) || qtl.Id === -1) {
            qtl.Id = utils.randomId();
        }
        return this.upsert(qtl);
    }

    /**
     * Adds an array of QTL items.
     * @param qtls
     */
    addItems(qtls) {
        if(!_.isArray(qtls)) {
            throw new Error("Parameter should be an array.");
        }
        const that = this;
        return new Promise(function(resolve, reject) {
            const all = [];
            _.forEach(qtls, function(item) {
                if(utils.isUndefined(item.Id) || item.Id === -1) {
                    item.Id = utils.randomId();
                }
                all.push(that.upsert(item));
            });
            Promise.all(all).then(function() {
                resolve();
            });
        });
    }

    /**
     * Loads the oracle datasets according to the global settings.
     *
     * @param globalSettings If not passed the method will load everything.
     */
    loadGlobalDatasets(globalSettings) {
        // not applicable to mongo storage
    }

    /**
     * Loads an app-specific set of QTL.
     * @param appId
     * @see unloadApp
     */
    loadAppDataset(appId) {
        // not applicable to mongo storage
    }

    /**
     * Gets the subset of the oracle based on
     * the hierarchy or organization in place.
     * For the flat-file JSON system there is a simple first-word subdivision.
     * @param question
     * @param categories If specified, the subset of categories to filter out. Format can be "Sports" or "Sports, Time" or and array of strings.
     * @returns {*}
     */
    getSubset(question, categories, userId) {

        // note that the UserId in graphdb holds the owner
        // while in the oracle it means whether it's user-specific or for everyone
        if(utils.isUndefined(userId)) {
            userId = "Everyone";
        }
        const that = this;
        return new Promise(function(resolve, reject) {
            if(utils.isUndefined(categories) || categories === "*" || (_.isArray(categories) && _.includes(categories, "*"))) {
                // things like 'search:stuff" don't always have a space
                that.Oracle.find({Questions: {$regex: "^" + OracleStorage._first(question), $options: "i"}, UserId: userId}).then(function(result) {
                    resolve(result)
                });
            } else {
                let filterOut = [];
                if(_.isString(categories)) {
                    if(categories.indexOf(",") > 0) {
                        const cats = categories.split(",");
                        _.forEach(cats, function(c) {
                            filterOut.push(c);
                        });
                    } else {
                        filterOut = [categories];
                    }
                } else if(_.isArray(categories)) {
                    filterOut = categories;
                } else {
                    throw new Error("Bot configuration is likely wrong. The 'categories' section cannot be interpreted as an oracle filter.");
                }

                that.Oracle.find({Questions: {$regex: "^" + OracleStorage._first(question), $options: "i"}, UserId: userId, Category: {$in: filterOut}}).then(function(result) {
                    resolve(result);
                });
            }
        });

    }

    /**
     * Removes a QTL belonging to an app.
     * @param id
     * @returns {boolean}
     */
    removeItemFromApp(id) {
        // var found = this.findId(id);
        // if(utils.isDefined(found)) {
        //     for(var i = 0; i < found.Keys.length; i++) {
        //         var key = found.Keys[i];
        //         _.remove(this._index[key], function(p) {
        //             return p.Id === id;
        //         });
        //         this.qtlCount--;
        //         if(this._index[key].length === 0) {
        //             delete this._index[key];
        //         }
        //     }
        //
        //     _.remove(this._categories[found.Category], function(p) {
        //         return p.Id === id;
        //     });
        //     if(this._categories[found.Category].length === 0) {
        //         delete this._categories[found.Category];
        //
        //     }
        //
        //     return true;
        // }
        // return false;
    }

    /**
     * Removes the QTL from a specific app.
     * @param appId
     * @see loadAppDataset
     */
    unloadApp(appId) {
        if(!utils.isDefined(this._categories[appId])) {
            return false;
        }
        const itemIds = _.map(this._categories[appId], function(t) {
            return t.Id;
        });
        for(let i = 0; i < itemIds.length; i++) {
            const id = itemIds[i];
            this.removeItemFromApp(id);
        }
        _.remove(this._appsLoaded, function(x) {
            return x === appId;
        });
        return true;
    }

    /**
     * Saves the specified global category.
     * @param categoryName
     */
    saveCategory(categoryName) {
        // does not apply to mongo storage
    }

    categoryExists(name) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.Oracle.findOne({"Category": name}).then(function(item) {
                resolve(utils.isDefined(item));
            });
        });
    }

    getCategory(name) {
        return this.Oracle.find({Category: name});
    }

    getCategoryNames() {
        return this.Oracle.distinct({}, "Category");
    }

    deleteCategory(name) {
        return this.Oracle.remove({Category: name});
    }

    saveAppDataset(dataset, appId) {
        if(utils.isUndefined(dataset) || !_.isArray(dataset)) {
            console.warn("Trying to save an empty app dataset.");
            return;
        }
        // replace the Category if one is set
        for(let i = 0; i < dataset.length; i++) {
            const item = dataset[i];
            item.Category = appId;
            item.Id = utils.randomId();
            item.UserId = "Everyone";
        }
        return this.addItems(dataset);
    }

    deleteAppDataset(appId) {
        return this.deleteCategory(appId);
    }

    /**
     * Returns the first QTL which duplicates one of the grabs given.
     * @param qtl
     * @returns {*}
     */
    checkDuplicates(qtl) {
        if(_.isString(qtl)) {
            return this._checkDuplicateString(qtl);
        }
        if(_.isArray(qtl)) {
            return this._checkDuplicateArray(qtl);
        }
        assert.ok(_.isPlainObject(qtl), "The QTL should be an object at this point.");

        if(utils.isUndefined(qtl.Id)) {
            qtl.Id = utils.randomId();
        }

        if(_.isString(qtl.Questions)) {
            return this._checkDuplicateString(qtl.Questions, qtl.Id);
        } else {
            return this._checkDuplicateArray(qtl.Questions, qtl.Id);
        }
    }

    _checkDuplicateArray(questions, id) {
        const all = [];
        for(let i = 0; i < questions.length; i++) {
            const grab = questions[i];
            all.push(this._checkDuplicateString(grab, id));
        }
        return new Promise(function(resolve, reject) {
            Promise.all(all).then(function(r) {
                const firstNotNull = _.find(r, function(u) {
                    return utils.isDefined(r);
                });
                resolve(firstNotNull);
            });
        });
    }

    /**
     *
     * @param id {string} The id to compare with; a duplicate should not have this id.
     * @param input
     * @returns {*}
     * @private
     */
    _checkDuplicateString(input, id) {
        const cleanInput = utils.normalizeInput(input);
        if(utils.isDefined(id)) {
            return this.Oracle.findOne({"Questions": cleanInput, Id: {$ne: id}});
        } else {
            return this.Oracle.findOne({"Questions": cleanInput});
        }
    }


    random() {

        const that = this;
        return new Promise(function(resolve, reject) {
            // todo: really bad way of taking a random item; use skip with mongo and offset with lokijs
            that.Oracle.find({}).then(function(all) {
                const rand = Math.floor(Math.random() * all.length);
                resolve(all[rand]);
            });
        });
    }

    /**
     * Removes the given QTL.
     * @param q
     */
    removeFromIndex(q) {
        // does not apply to mongo storage
    }

    addToIndex(q) {
        // does not apply to mongo storage
    }

    changeCategory(q, previousCategory, newCategory) {
        q.Category = newCategory;
        return this.upsert(q);
    }

    /**
     * Pushes an item in the tree.
     * @param item
     */
    _distributeItem(item, appId) {
        // does not apply to mongo storage
    }

    /**
     * Creates an index of the questions based on the first word.
     */
    _distribute(qtlStack, appId) {
        // does not apply to mongo storage
    }

    _loadGlobalFile(filename) {
        // does not apply to mongo storage
    }

    /**
     *
     * @param qtl
     * @param intput
     * @returns {*}
     * @private
     */
    _checkDuplicateItem(qtl, intput) {
        const cleanGrab = utils.normalizeInput(intput);
        const that = this;
        return new Promise(function(resolve, reject) {
            that.Oracle.findOne({"Questions": cleanGrab, Id: {$ne: qtl.Id}}, function(err, item) {
                if(err) {
                    reject(err);
                } else {
                    resolve(item);
                }
            });
        });
    }

    /**
     * Takes the first word to use it as the indexing string.
     * @param question
     * @returns {string}
     * @private
     */
    static _first(question) {
        return utils.normalizeInput(question).split(/[\s:]+/)[0].toLowerCase();
    }

    /**
     * Simple flat index creation based on the first word of the utterance.
     * @param item
     * @param utterance
     * @private
     */
    _pushItem(item, utterance) {
        // does not apply to mongo storage
    }

    /**
     * Loads the oracle files into mongo.
     */
    loadFilesIntoMongo() {
        console.time("OracleLoading");
        const dirPath = path.join(__dirname, '../../Server/Data/Oracle/Global/');
        const filenames = fs.readdirSync(dirPath);
        let count = 0;
        for(let i = 0; i < filenames.length; i++) {
            const filename = filenames[i];
            if(path.extname(filename) !== ".json") {
                continue;
            }

            const filePath = path.join(__dirname, '../../Server/Data/Oracle/Global/' + filename);
            const exists = fs.existsSync(filePath);
            if(exists) {
                const items = fs.readJsonSync(filePath, 'utf8');
                for(let j = 0; j < items.length; j++) {
                    const template = items[j];
                    if(!_.isArray(template.Questions)) {
                        template.Questions = [template.Questions];
                    }
                    storage.oracle.upsert(template);
                    console.log(count++);
                }
            }
        }
        console.timeEnd("OracleLoading");
    }

    /**
     * Upserts the given template in mongo
     * @param template
     * @returns {Promise|Promise<T>}
     */
    upsert(template) {
        if(utils.isUndefined(template)) {
            throw new Error("Undefined parameter.")
        }
        if(utils.isUndefined(template.Id) || template.Id === -1) {
            template.Id = utils.randomId();
        }
        if(utils.isUndefined(template.Category)) {
            template.Category = "temp";
        }
        if(utils.isUndefined(template.UserId)) {
            template.UserId = "Everyone";
        }
        const that = this;
        return new Promise(function(resolve, reject) {
            that.Oracle.find({Id: template.Id}).then(function(found) {
                if(utils.isDefined(found) && found.length > 0) {
                    if(found.length > 1) {
                        reject("More than one item with Id '" + template.Id + "'.")
                    } else {
                        that.Oracle.update(template, {Id: template.Id}).then(function() {
                            resolve();
                        });
                    }
                } else {
                    that.Oracle.insert(template).then(function() {
                        resolve();
                    });
                }
            });
        });
    }

}
module.exports = OracleStorage;