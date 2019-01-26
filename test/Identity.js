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

exports.upsertUserWithoutEnoughInfo = async function (test) {

    /* to create a user you need either
     - a username for local auth
     - an object coming from the social authenticator
     */
    // 'Registering a user with insufficient property.
    try {
        await identity.upsertUser({'whatever': 44});
        test.ok(false);
    } catch (e) {
        test.ok(true);
    }

    test.done();
};


exports.upsertUserWithoutAccount = async function (test) {


    // 'Registering a user with no FB, G or local account
    try {
        await identity.upsertUser({
            apiKey: utils.randomId(),
            local: null,
            facebook: null,
            google: null,
            twitter: undefined,
            id: utils.randomId(),
            username: utils.randomId(),
            error: null,
            role: undefined
        });
        test.ok(false);
    } catch (e) {
        test.ok(true);
    }

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

exports.mergeFacebookConnect = async function (test) {
    const id = utils.randomId();
    const fbid = utils.randomId();
    const apiKey = utils.randomId();
    const facebookObject = {
        'email': 'swa@tfbnw.net',
        'first_name': 'Sharon',
        'last_name': 'Ambjorn',
        'name': 'Sharon Ambjorn',
        'timezone': 2,
        'verified': false,
        'id': fbid,
        'picture': 'https://graph.facebook.com/100007729021723/picture',
        'thumbnail': 'https://graph.facebook.com/100007729021723/picture'
    };
    const clientTicket = {
        apiKey: apiKey,
        local: {
            'email': 'me@qwiery.com',
            'password': 'This will never be used'
        },
        facebook: null,
        google: null,
        twitter: undefined,
        id: id,
        username: 'Swa',
        error: null,
        role: undefined
    };
    await identity.upsertUser(clientTicket);
    // connecting a new user via FB
    const user = await identity.connectFacebook(clientTicket, facebookObject);
    test.ok(!_.isNil(user));
    test.ok(!_.isNil(user.facebook));
    test.equal(user.facebook.id, fbid);
    test.done();
};

exports.clashingFacebookConnect = async function (test) {
    const id = utils.randomId();
    const fbid = utils.randomId();
    const apiKey = utils.randomId();
    const facebookObject = {
        'email': 'aaa@tfbnw.net',
        'first_name': 'Nadia',
        'last_name': 'Alkin',
        'name': 'Nadia Alkin',
        'timezone': 2,
        'verified': false,
        'id': fbid
    };
    const clientTicket = {
        apiKey: apiKey,
        facebook: {
            'email': 'aaa@tfbnw.net',
            'first_name': 'Nadia',
            'last_name': 'Alkin',
            'name': 'Nadia Alkin',
            'timezone': 2,
            'verified': false,
            'id': fbid
        },
        google: null,
        twitter: undefined,
        id: id,
        username: 'Swa',
        error: null,
        role: undefined
    };
    await identity.upsertUser(clientTicket);
    // returns the server user
    let user = await identity.connectFacebook(clientTicket, facebookObject);
    test.ok(!_.isNil(user));
    test.equal(user.facebook.email, clientTicket.facebook.email);

    // trying to connect with clashing FB
    facebookObject.id = utils.randomId();
    try {
        await identity.connectFacebook(clientTicket, facebookObject);
        test.ok(false);
    } catch (e) {
        test.ok(true);
    }
    test.done();
};

exports.newFacebookConnect = async function (test) {
    const fbid = utils.randomId();
    const facebookObject = {
        'email': 'sharon_eieskkg_ambjorn@tfbnw.net',
        'first_name': 'Sharon',
        'last_name': 'Ambjorn',
        'name': 'Sharon Ambjorn',
        'timezone': 2,
        'verified': false,
        'id': fbid,
        'picture': 'https://graph.facebook.com/100007729021723/picture',
        'thumbnail': 'https://graph.facebook.com/100007729021723/picture'
    };
    // connecting a new user via FB
    let user = await identity.connectFacebook(null, facebookObject);
    test.ok(!_.isNil(user));
    test.ok(!_.isNil(user.facebook));
    user = await identity.getById(user.id);
    test.ok(!_.isNil(user));
    // the two objects are not completely equal because Mongo adds stuff like $init to it
    test.deepEqual(user.facebook.id, facebookObject.id);
    test.done();
};
