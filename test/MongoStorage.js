const StorageBase = require("../lib/Framework/StorageBase");
const ServiceBase = require("../lib/Framework/ServiceBase");
const utils = require("../lib/utils");
const _ = require("lodash");
const MongoStorage = require("../lib/Services/MongoStorage");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
const path = require("path");
const testUtils = require("./TestUtils");
exports.basics = function(test) {
    const that = this;

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator("mongo"));
        let st = instantiator.services.storage;
        st.createCollection({
            collectionName: "Stuff",
            schema: {
                name: String,
                id: String
            }
        });
        let blob = {
            id: utils.randomId(),
            name: "Theresa"
        };
        test.throws(function() {
            st.insert(blob)
        }, Error);
        waitFor(st.insert(blob, "Stuff"));
        let found = waitFor(st.findOne({id: blob.id}, "Stuff"));
        test.ok(utils.isDefined(found));
        found.name = "Lia";
        waitFor(st.update(found, "Stuff", {id: found.id}));
        found = waitFor(st.findOne({id: blob.id}, "Stuff"));
        test.equal(found.name, "Lia");
        waitFor(st.remove({id: blob.id}, "Stuff"));
        found = waitFor(st.findOne({id: blob.id}, "Stuff"));
        test.ok(utils.isUndefined(found));
        test.done();
    }

    return async(runner)();

};

exports.distinct = function(test) {

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator("mongo"));
        let st = instantiator.services.storage;
        st.createCollection({
            collectionName: "Many",
            schema: {
                name: String,
                id: String,
                category: String
            }
        });
        for(let i = 0; i < 40; i++) {
            let blob = {
                id: utils.randomId(),
                name: "Item" + i,
                category: Math.random() < .5 ? "A" : "B"
            };
            waitFor(st.insert(blob, "Many"));
        }
        const cats = waitFor(st.distinct({}, "category", "Many"));

        test.equal(cats.length, 2);
        test.done();
    }

    return async(runner)();

};

exports.collectionExists = function(test) {

    const that = this;

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator("mongo"));
        let st = instantiator.services.storage;
        let collectionName = utils.randomId();
        let exists = waitFor(st.collectionExists(collectionName));
        test.equal(exists, false);
        waitFor(st.createCollection({
            collectionName: collectionName,
            schema: {
                name: String,
                id: String
            }
        }));
        exists = waitFor(st.collectionExists(collectionName));
        test.equal(exists, true);
        test.done();
    }

    return async(runner)();
};