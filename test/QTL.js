const Qwiery = require('../lib'),
    utils = require('../lib/utils'),
    OracleService = require('../lib/Services/Oracle'),
    QTL = require('../lib/Services/QTL'),
    _ = require('lodash');

const path = require('path'),
    fs = require('fs-extra');
const settings = {
    'defaultPipeline': [
        'Oracle'
    ],
    'defaultApp': 'Todi',
    apps: [
        {
            'id': 'Todi',
            'name': 'Todi'
        }
    ],
    system: {
        coreServices: [
            {
                name: 'MongoStorage',
                'connection': 'mongodb://localhost:27017/QwieryDB',
                'options': {}
            },
            'Graph',
            'Oracle',
            'Topics',
            'System',
            'Personalization'],
        coreInterpreters: ['Edictor']
    }
};
const qwiery = new Qwiery(settings);
const services = qwiery.services,
    personalization = services.personalization,
    constants = require('../lib/constants');
const Mutator = require('../lib/Services/QTL/mutator');
const p = Mutator.mutate;
const ctx = {userId: 'Sharon'};
const context = {
    getVariable: function (m) {
        return personalization.getPersonalization(m, ctx);
    },
    getSystemVariable: function (m) {
        return services.system.getSystemVariable(m, ctx)
    },
    getEntity: function (id) {
        return services.graph.getEntity(id, ctx);
    },
    ctx: ctx
};

exports.replaceGetters = async function (test) {

    await personalization.addPersonalization('Username', 'Sharon', ctx);
    let r = await p('My name is %username.', context);
    test.equal(r, 'My name is Sharon.');

    let obj = {
        'x': 'Name: %Username',
        'y': 68
    };
    r = await p(obj, context);
    test.equal(r.x, 'Name: Sharon');
    test.equal(r.y, 68);
    const key = utils.randomId();
    const value = utils.randomId();

    await personalization.addPersonalization(key, value, ctx);
    await utils.sleep(500);
    r = await p(`This %${key.toLowerCase()} is now replaced.`, context);
    test.equal(r, 'This ' + value + ' is now replaced.');

    obj = {
        v: '%%version'
    };
    r = await p(obj, context);
    const pckg = fs.readJsonSync(path.join(__dirname, '../package.json'));
    test.deepEqual(r, {v: pckg.version});
    test.done();
};

exports.replaceEntity = async function (test) {

    let obj = {'%join': [{'%entity': {'DataType': constants.podType.Thought, 'Id': 'Ludwig'}}, 'was a genius.']};
    let r = await p(obj, context);
    test.equal(r, 'Ludwig von Beethoven was a genius.');
    test.done();
};


