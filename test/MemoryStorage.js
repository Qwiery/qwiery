const utils = require('../lib/utils');
const _ = require('lodash');
const testUtils = require('./TestUtils');
const path = require('path');
const fs = require('fs-extra');

exports.basics = async function (test) {
    let instantiator = await (testUtils.getInstantiator('memory'));
    let st = instantiator.services.storage;
    test.equal(st.constructor.name, 'MemoryStorage');
    let blob = {
        id: utils.randomId(),
        name: 'Eggy'
    };
    test.throws(function () {
        await(st.insert(blob))
    }, Error);
    await (st.insert(blob, 'Stuff'));
    let found = await (st.findOne({id: blob.id}, 'Stuff'));
    test.ok(utils.isDefined(found));
    found.name = 'Jenny';
    await (st.update(found, 'Stuff'));
    found = await (st.findOne({id: blob.id}, 'Stuff'));
    test.equal(found.name, 'Jenny');
    await (st.remove({id: blob.id}, 'Stuff'));
    found = await (st.findOne({id: blob.id}, 'Stuff'));
    test.ok(utils.isUndefined(found));
    test.done();

};

exports.autoload = async function (test) {
    let settings = {
        system: {
            'coreServices': [
                {
                    'name': 'MemoryStorage',
                    'filePath': path.join(__dirname, 'TestUtils', `${'AutoLoad' + (+new Date())}.json`),
                    'autosaveInterval': 5000,
                    'autoload': true
                }
            ],
            coreInterpreters: []
        }
    };
    const Configurator = require('../lib/Configurator');
    const Instantiator = require('../lib/Instantiator');
    let conf = new Configurator(settings);
    let ins = new Instantiator(conf.settings);
    // IMPORTANT: pluginIdentifiers are lowercased
    await ins.whenPluginLoaded('memorystorage');
    // this will only work with the memory storage, mongo will not allow it
    ins.services.storage.createCollection('Stuff');
    ins.services.storage.insert({name: 'Kenzo'}, 'Stuff');
    await ins.services.storage.save();
    test.ok(fs.existsSync(settings.system.coreServices[0].filePath));

    // again, expecting to have to loaded data now
    conf = new Configurator(settings);
    ins = new Instantiator(conf.settings);
    await ins.whenPluginLoaded('memorystorage');
    const stuff = await ins.services.storage.find({}, 'Stuff');
    // so if autoload works there is an item from the previous instantiation
    test.ok(utils.isDefined(stuff) && _.isArray(stuff) && stuff.length >= 1);
    test.done();
};


exports.distinct = async function (test) {

    let instantiator = await (testUtils.getInstantiator('memory'));
    let st = instantiator.services.storage;
    st.createCollection({
        collectionName: 'Many',
        schema: {
            name: String,
            id: String,
            category: String
        }
    });
    for (let i = 0; i < 40; i++) {
        let blob = {
            id: utils.randomId(),
            name: 'Item' + i,
            category: Math.random() < .5 ? 'A' : 'B'
        };
        await (st.insert(blob, 'Many'));
    }
    const cats = await (st.distinct({}, 'category', 'Many'));

    test.equal(cats.length, 2);
    test.done();

};

exports.collectionExists = async function (test) {

    let instantiator = await (testUtils.getInstantiator('memory'));
    let st = instantiator.services.storage;
    let collectionName = utils.randomId();
    let exists = await (st.collectionExists(collectionName));
    test.equal(exists, false);
    await (st.createCollection({
        collectionName: collectionName,
        schema: {
            name: String,
            id: String
        }
    }));
    exists = await (st.collectionExists(collectionName));
    test.equal(exists, true);
    test.done();
};
