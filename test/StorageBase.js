const StorageBase = require("../lib/Framework/StorageBase");
const ServiceBase = require("../lib/Framework/ServiceBase");
const utils = require("../lib/utils");
const _ = require("lodash");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
/**
 * Pure memory storage implementation.
 */
class MostBasicStorage extends StorageBase {
    constructor() {
        super("basic");
        this.collections = {};
    }

    close() {

    }

    save() {

    }

    createCollection(specs) {
        let collectionName = specs;

        if(_.isPlainObject(specs)) {
            collectionName = specs.collectionName;
        }
        if(utils.isUndefined(collectionName) || collectionName.trim().length === 0) {
            throw new Error("Collection name is not acceptable.")
        }

        if(utils.isUndefined(this.collections[collectionName])) {
            this.collections[collectionName] = [];
        }
    }

    insert(blob, collectionName) {
        this.createCollection(collectionName);
        this.collections[collectionName].push(blob);
    }

    update(blob, collectionName) {
        this.createCollection(collectionName);
        let index = this.collections[collectionName].indexOf(blob);
        if(index >= 0) {
            this.collections[collectionName].splice(index, 1);
        }
        this.insert(blob, collectionName);
    }

    find(specs = {}, collectionName) {
        this.createCollection(collectionName);
        return _.filter(this.collections[collectionName], specs);
    }

    findOne(specs = {}, collectionName) {
        this.createCollection(collectionName);
        return _.find(this.collections[collectionName], specs);
    }


}

exports.isService = function(test) {
    const st = new StorageBase();
    test.ok(st instanceof ServiceBase);
    test.done();
};

exports.basicStorage = function(test) {
    let st = new MostBasicStorage();
    let blob = {
        id: utils.randomId(),
        name: "Eggy"
    };
    test.throws(function() {
        st.insert(blob)
    }, Error);
    st.insert(blob, "Stuff");
    let found = st.findOne({id: blob.id}, "Stuff");
    test.ok(utils.isDefined(found));
    found.name = "Luddy";
    st.update(found, "Stuff");
    found = st.findOne({id: blob.id}, "Stuff");
    test.equal(found.name, "Luddy");
    test.done();
};

// exports.testStorage = function(test) {
//     const that = this;
//
//     function runner() {
//         let st = new TestStorage();
//         await(st.init({services: {}}));
//         let blob = {
//             id: utils.randomId(),
//             name: "Eggy"
//         };
//         test.throws(function() {
//             st.insert(blob)
//         }, Error);
//         st.insert(blob, "Stuff");
//         let found = await(st.findOne({id: blob.id}, "Stuff"));
//         test.ok(utils.isDefined(found));
//         found.name = "Luddy";
//         await(st.update(found, "Stuff"));
//         found = await(st.findOne({id: blob.id}, "Stuff"));
//         test.equal(found.name, "Luddy");
//         await(st.save());
//         test.done();
//     }
//
//     return async(runner)();
//
// };