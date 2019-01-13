const utils = require('../lib/utils');
const _ = require('lodash');
const path = require('path');
const testUtils = require('./TestUtils');
exports.basics = async function (test) {
    let instantiator = await (testUtils.getInstantiator('mongo'));
    let st = instantiator.services.storage;
    st.createCollection({
        collectionName: 'Stuff',
        schema: {
            name: String,
            id: String
        }
    });
    let blob = {
        id: utils.randomId(),
        name: 'Theresa'
    };
    test.throws(function () {
        st.insert(blob)
    }, Error);
    await (st.insert(blob, 'Stuff'));
    let found = await (st.findOne({id: blob.id}, 'Stuff'));
    test.ok(utils.isDefined(found));
    found.name = 'Lia';
    await (st.update(found, 'Stuff', {id: found.id}));
    found = await (st.findOne({id: blob.id}, 'Stuff'));
    test.equal(found.name, 'Lia');
    await (st.remove({id: blob.id}, 'Stuff'));
    found = await (st.findOne({id: blob.id}, 'Stuff'));
    test.ok(utils.isUndefined(found));
    test.done();

};

exports.distinct = async function (test) {
    let instantiator = await (testUtils.getInstantiator('mongo'));
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

    let instantiator = await (testUtils.getInstantiator('mongo'));
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
