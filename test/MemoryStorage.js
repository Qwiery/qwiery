const StorageBase = require("../lib/Framework/StorageBase");
const ServiceBase = require("../lib/Framework/ServiceBase");
const utils = require("../lib/utils");
const _ = require("lodash");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
const testUtils = require("./TestUtils");
const path = require("path");
const fs = require("fs-extra");

exports.basics = function(test) {
    const that = this;

    function runner() {

        let instantiator = waitFor(testUtils.getInstantiator("memory"));
        let st = instantiator.services.storage;
        test.equal(st.constructor.name, "MemoryStorage");
        let blob = {
            id: utils.randomId(),
            name: "Eggy"
        };
        test.throws(function() {
            waitFor(st.insert(blob))
        }, Error);
        waitFor(st.insert(blob, "Stuff"));
        let found = waitFor(st.findOne({id: blob.id}, "Stuff"));
        test.ok(utils.isDefined(found));
        found.name = "Jenny";
        waitFor(st.update(found, "Stuff"));
        found = waitFor(st.findOne({id: blob.id}, "Stuff"));
        test.equal(found.name, "Jenny");
        waitFor(st.remove({id: blob.id}, "Stuff"));
        found = waitFor(st.findOne({id: blob.id}, "Stuff"));
        test.ok(utils.isUndefined(found));
        test.done();
    }

    return async(runner)();

};

exports.autoload = function(test) {
    let settings = {
        system: {
            "coreServices": [
                {
                    "name": "MemoryStorage",
                    "filePath": path.join(__dirname, "TestUtils", `${"AutoLoad" + (+new Date())}.json`),
                    "autosaveInterval": 5000,
                    "autoload": true
                }
            ],
            coreInterpreters:[]
        }
    };
    const Configurator = require("../lib/Configurator");
    const Instantiator = require("../lib/Instantiator");
    let conf = new Configurator(settings);
    let ins = new Instantiator(conf.settings);
    // IMPORTANT: pluginIdentifiers are lowercased
    ins.whenPluginLoaded("memorystorage").then(function() {
        // this will only work with the memory storage, mongo will not allow it
        ins.services.storage.createCollection("Stuff");
        ins.services.storage.insert({name: "Kenzo"}, "Stuff");
        ins.services.storage.save().then(function() {
            test.ok(fs.existsSync(settings.system.coreServices[0].filePath));

            // again, expecting to have to loaded data now
            conf = new Configurator(settings);
            ins = new Instantiator(conf.settings);
            ins.whenPluginLoaded("memorystorage").then(function() {
                ins.services.storage.find({}, "Stuff").then(function(stuff) {
                    // so if autoload works there is an item from the previous instantiation
                    test.ok(utils.isDefined(stuff) && _.isArray(stuff) && stuff.length >= 1);
                    test.done();

                });
            });

        });

    });

};


exports.distinct = function(test) {

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator("memory"));
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
        let instantiator = waitFor(testUtils.getInstantiator("memory"));
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