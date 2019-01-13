const Qwiery = require('../lib'),
    utils = require('../lib/utils'),
    _ = require('lodash');

var path = require('path'),
    fs = require('fs-extra'),
    ctx = {userId: 'Sharon'};

const qwiery = new Qwiery({
    system: {
        coreServices: [
            {
                name: 'MongoStorage',
                'connection': 'mongodb://localhost:27017/QwieryDB',
                'options': {}
            }, 'Graph', 'Identity', 'Oracle']
    }
});
const services = qwiery.services;
const identity = services.identity;

exports.upsertUserWithoutEnoughInfo = function (test) {

    /* to create a user you need either
     - a username for local auth
     - an object coming from the social authenticator
     */
    test.throws(function () {
        identity.upsertUser({'whatever': 44})
    }, Error, 'Registering a user with insufficient property.');

    test.done();
};


exports.upsertUserSetsId = async function (test) {
    test.expect(4);
    const user = await identity.upsertUser({'apiKey': 'Carl', local: {email: 'carl@qwiery.com'}});
    test.ok(utils.isDefined(user.id));
    test.ok(utils.isUndefined(user.Gender));
    // update the user
    user.apiKey = 'M';
    await identity.upsertUser(user);
    const found = await identity.getById(user.id);
    test.ok(utils.isDefined(found));
    test.ok(utils.isDefined(found.apiKey) && found.apiKey === 'M');
    test.done();

};

exports.getByFacebookId = async function (test) {
    test.expect(1);
    const user = await identity.upsertUser({'facebook': {'id': 'bibi'}});
    const user2 = await identity.getByFacebookId('bibi');
    test.ok(utils.isDefined(user2));
    test.done();
};

exports.getByGoogleId = async function (test) {
    test.expect(1);
    await identity.upsertUser({'google': {'id': 'lili'}});
    const user = await identity.getByGoogleId('lili')
    test.ok(utils.isDefined(user));
    test.done();
};

exports.getByEmail = async function (test) {
    await identity.upsertUser({
        apiKey: 'Sharon',
        id: 'Sharon',
        creationDate: new Date(),
        local: {
            email: 'sharon@qwiery.com',
            password: '123456'
        }
    });
    const user = await identity.getByEmail('sharon@qwiery.com');
    test.ok(utils.isDefined(user));
    console.log('User with email \'%s\' has id \'%s\'', 'sharon@qwiery.com', user.id);
    test.done();
};


exports.facebookId = async function (test) {

    const id = utils.randomId();
    let all = await (identity.getAllUsers());
    let startCount = all.length;
    const user = {
        id: id,
        apiKey: 'key_' + id,
        local: {
            'email': 'me@qwiery.com',
            'password': 'This will never be used'
        },
        'facebook': {
            'email': 'me@tfbnw.net',
            'first_name': 'Akan',
            'last_name': 'Fraskin',
            'name': 'Akan Fraskin',
            'timezone': 4,
            'verified': false,
            'id': '100005929021723'
        }
    };
    await (identity.upsertUser(user));
    test.ok(await (identity.exists(id)));
    let found = await (identity.getByEmail('me@qwiery.com'));
    test.ok(utils.isDefined(found));
    test.equal(found.local.email, user.local.email);
    found = await (identity.getByFacebookId('100005929021723'));
    test.ok(utils.isDefined(found));
    all = await (identity.getAllUsers());
    test.equal(all.length, startCount + 1);

    user.facebook.id = '53003';
    await (identity.upsertUser(user));
    found = await (identity.getByFacebookId('53003'));
    test.ok(utils.isDefined(found));
    all = await (identity.getAllUsers());
    test.equal(all.length, startCount + 1);
    test.done();
};
