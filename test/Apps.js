const
    utils = require('../lib/utils'),
    Qwiery = require('../lib'),
    _ = require('lodash'),
    testUtils = require('./TestUtils'),
    AppStorage = require('../lib/Services/Apps/AppStorage'),
    Apps = require('../lib/Services/Apps'),
    ctx = {userId: utils.randomId()};

let settings = {
    system: {
        userAppQuota: 33
    }
};

exports.justStorage = async function (test) {
    let instantiator = await (testUtils.getInstantiator());
    let p = new AppStorage(instantiator.services.storage);
    await (p.init(instantiator));

    let appId = utils.randomId();
    let appName = utils.randomId();
    await (p.addUserApp(ctx.userId, appId, appName));
    let ownsit = await (p.userOwnsApp(ctx.userId, appId));
    test.equal(ownsit, true);
    let ids = await (p.getUserAppsIds(ctx.userId));
    test.equal(ids.length, 1);
    await (p.removeUserApp(ctx.userId, appId));
    ownsit = await (p.userOwnsApp(ctx.userId, appId));
    test.equal(ownsit, false);

    test.done();
};

exports.changeQuota = async function (test) {
    let settings = {
        system: {
            userAppQuota: 33
        }
    };
    let instantiator = await (testUtils.getInstantiator());
    let p = new AppStorage(instantiator.services.storage);
    await (p.init(instantiator));

    let rq = parseInt(Math.random() * 1000);
    await (p.changeQuota(ctx.userId, rq));
    let quota = await (p.getUserQuota(ctx.userId));
    console.log('New quota set: ' + rq);
    test.equal(quota, rq);
    test.done();
};

exports.saveApp = async function (test) {
    let settings = {
        system: {
            userAppQuota: 633
        }
    };

    let instantiator = await (testUtils.getInstantiator());
    let p = new AppStorage(instantiator.services.storage);
    await (p.init(instantiator));

    let conf = {
        id: utils.randomId(),
        name: utils.randomId()
    };
    await (p.saveAppConfiguration(conf));

    let exists = await (p.appExists(conf.id));
    test.equal(exists, true);
    exists = await (p.isExistingAppName(conf.name));
    test.equal(exists, true);

    let ids = await (p.getAppIds());
    test.equal(_.last(ids), conf.id);
    let id = await (p.getAppIdFromName(conf.name));
    test.equal(id, conf.id);

    let appNames = await (p.getAppNames());
    test.equal(appNames.length, ids.length);
    let appCount = await (p.getAppCount());
    test.equal(appCount, ids.length);

    let confFound = await (p.getAppConfiguration(conf.id));
    test.equal(confFound.id, conf.id);
    test.equal(confFound.name, conf.name);

    await (p.deleteAppConfiguration(conf.id));
    exists = await (p.appExists(conf.id));

    test.equal(exists, false);
    test.done();
};

exports.addUserApp = async function (test) {
    const that = this;

    let instantiator = await (testUtils.getInstantiator());
    let p = new AppStorage(instantiator.services.storage);
    await (p.init(instantiator));

    // reset quota from previous runs if changed
    await (p.changeQuota('Jake', settings.system.userAppQuota));
    await (p.addUserApp('Jake', 'q1', 'myapp'));
    let owns = await (p.userOwnsApp('Jake', 'q1'));
    test.ok(owns);
    let quota = await (p.getUserQuota('Jake'));
    test.equal(quota, settings.system.userAppQuota - 1);
    await (p.changeQuota('Jake', 22));
    quota = await (p.getUserQuota('Jake'));
    test.equal(quota, 22);
    let ids = await (p.getUserAppsIds('Jake'));
    let before = ids.length;
    await (p.removeUserApp('Jake', 'q1'));
    ids = await (p.getUserAppsIds('Jake'));
    test.equal(ids.length, before - 1);
    test.done();
};

exports.appConf = async function (test) {
    const that = this;

    let instantiator = await (testUtils.getInstantiator());
    let p = new AppStorage(instantiator.services.storage);
    await (p.init(instantiator));

    let id = utils.randomId();
    const conf = {
        id: id,
        name: 'my special app'
    };
    await (p.saveAppConfiguration(conf));
    let yn = await (p.appExists(id));
    test.ok(yn === true);

    yn = await (p.isExistingAppName(conf.name));
    test.ok(yn === true);

    let ids = await (p.getAppIds());
    test.equal(ids.length, 1);

    let nid = await (p.getAppIdFromName(conf.name));
    test.equal(nid, conf.id);

    let names = await (p.getAppNames());
    test.equal(names.length, 1);
    test.equal(names[0], conf.name);

    await (p.deleteAppConfiguration(id));
    names = await (p.getAppNames());
    test.equal(names.length, 0);
    test.done();
};

exports.addUserApp = async function (test) {
    const that = this;

    let instantiator = await (testUtils.getInstantiator());
    let p = new AppStorage(instantiator.services.storage);
    await (p.init(instantiator));

    // reset quota from previous runs if changed
    await (p.changeQuota('Jake', settings.system.userAppQuota));
    await (p.addUserApp('Jake', 'q1', 'myapp'));
    let owns = await (p.userOwnsApp('Jake', 'q1'));
    test.ok(owns);
    let quota = await (p.getUserQuota('Jake'));
    test.equal(quota, settings.system.userAppQuota - 1);
    await (p.changeQuota('Jake', 22));
    quota = await (p.getUserQuota('Jake'));
    test.equal(quota, 22);
    let ids = await (p.getUserAppsIds('Jake'));
    let before = ids.length;
    await (p.removeUserApp('Jake', 'q1'));
    ids = await (p.getUserAppsIds('Jake'));
    test.equal(ids.length, before - 1);
    test.done();
};

exports.appConf = async function (test) {
    const that = this;

    let instantiator = await (testUtils.getInstantiator());
    let p = new AppStorage(instantiator.services.storage);
    await (p.init(instantiator));
    await (p.clearAll());

    let id = utils.randomId();
    const conf = {
        id: id,
        name: 'my special app'
    };
    await (p.saveAppConfiguration(conf));
    let yn = await (p.appExists(id));
    test.ok(yn === true);

    yn = await (p.isExistingAppName(conf.name));
    test.ok(yn === true);

    let ids = await (p.getAppIds());
    test.equal(ids.length, 1);

    let nid = await (p.getAppIdFromName(conf.name));
    test.equal(nid, conf.id);

    let names = await (p.getAppNames());
    test.equal(names.length, 1);
    test.equal(names[0], conf.name);

    await (p.deleteAppConfiguration(id));
    names = await (p.getAppNames());
    test.equal(names.length, 0);
    test.done();
};


exports.saveConfig = async function (test) {
    const id = utils.randomId();

    let instantiator = await (testUtils.getInstantiator());
    let apps = new Apps(instantiator.services.storage);
    await (apps.init(instantiator));
    await (apps._saveAppConfiguration({
        id: id,
        name: 'Josh'
    }));
    test.ok(await (apps.appExists(id)));
    test.ok(!await (apps.appExists(utils.randomId())));
    // clean it up again
    await (apps._deleteAppConfiguration(id));
    test.done();
};


exports.basic = async function (test) {

    let instantiator = await (testUtils.getInstantiator());
    let apps = new Apps(instantiator.services.storage);
    await (apps.init(instantiator));
    const id = utils.randomId();
    const config = _.clone(apps.configTemplate);
    config.id = id;
    config.name = utils.randomId();
    await (apps._saveAppConfiguration(config));
    test.ok(apps.appExists(id));

    // clean it up again
    await (apps._deleteAppConfiguration(id));
    test.done();


};


exports.configError1 = async function (test) {

    let instantiator = await (testUtils.getInstantiator());
    let apps = new Apps(instantiator.services.storage);
    await (apps.init(instantiator));
    try {
        await (apps.addApp({
            config: {}
        }, {userId: 'Sharon'}));
        test.ok(false, 'This should not be reached.')
    } catch (e) {
        console.log(e);
        test.equal(e, 'Error in app configuration: no oracle section.');
        test.done();
    }
};


exports.configError2 = async function (test) {

    let instantiator = await (testUtils.getInstantiator());
    let apps = new Apps(instantiator.services.storage);
    await (apps.init(instantiator));
    try {
        await (apps.addApp({
            config: {}, oracle: {}
        }, {userId: 'Sharon'}));
        test.ok(false, 'This should not be reached.')
    } catch (e) {
        console.log(e);
        test.equal(e, 'Error in app configuration: oracle section should be an array.');
        test.done();
    }
};


exports.addApp = async function (test) {
    let qwiery = new Qwiery();
    let apps = qwiery.services.apps;
    // adding the minimal app
    const appId = await (apps.addApp({
        config: {
            'name': utils.randomId()
        },
        oracle: []
    }, {userId: 'Sharon'}));
    test.ok(await (apps.appExists(appId)));
    test.done();
};


exports.removeApp = async function (test) {
    let qwiery = new Qwiery();
    let apps = qwiery.services.apps;
    // adding a minimal app
    const appId = await (apps.addApp({
        config: {
            'name': utils.randomId()
        },
        oracle: []
    }, {userId: 'Sharon'}));
    test.ok(await (apps.appExists(appId)));
    await (apps.deleteApp(appId, {userId: 'Sharon'}));
    test.ok(!await (apps.appExists(appId)));
    test.done();

};


exports.appNoAnswer = async function (test) {

    let qwiery = new Qwiery({
        apps: '*'
    });
    let apps = qwiery.services.apps;
    const appName = utils.randomId();
    const appId = await (apps.addApp({
        config: {
            'name': appName,
            'noAnswer': '123456'
        },
        oracle: []
    }, {userId: 'Sharon'}));

    // asking this app gives the NoAnswer
    const answer = await (qwiery.askFlat('@' + appName + ' what is space?', {userId: 'Sharon'}));
    test.equal(answer, '123456');
    await (apps.deleteApp(appId, {userId: 'Sharon'}));
    test.done();
};


exports.appOracle = async function (test) {

    let qwiery = new Qwiery({
        apps: '*'
    });
    let apps = qwiery.services.apps;
    const appName = utils.randomId();
    const dummyAnswer = 'I am a dummy app.';
    const appId = await (apps.addApp({
        config: {
            'name': appName,
            'pipeline': ['Edictor'],
            'noAnswer': 'Not much.'
        },
        oracle: [
            {
                'Id': 'Tt6d7d76',
                'Questions': [
                    'who are you'
                ],
                'Template': {
                    'Answer': dummyAnswer
                },
                'UserId': 'Everyone',
                'Category': 'Something Else' // will be replaced when added
            }]
    }, {userId: 'Sharon'}));

    // asking this app gives the dummy
    qwiery.askFlat('@' + appName + ' who are you?', {userId: 'Sharon'}).then(function (answer) {
        test.equal(answer, dummyAnswer);
        // but everything else fails
        qwiery.askFlat('@' + appName + ' what do you do?', {userId: 'Sharon'}).then(function (answer) {
            test.equal(answer, 'Not much.');
            apps.deleteApp(appId, {userId: 'Sharon'});
            test.done();
        });
    });

};

exports.userQuota = async function (test) {
    let qwiery = new Qwiery({
        apps: '*'
    });
    let apps = qwiery.services.apps;
    // by default a user can create just one app
    const user = await (qwiery.services.identity.upsertUser({
        userId: 'Bubba',
        local: {'email': 'Bubba', 'password': '65165'}
    }));
    const userApps = qwiery.services.apps.userApps;
    await (userApps.changeQuota({userId: user.id}, 1));
    const appId = await (apps.addApp({
        config: {
            'name': utils.randomId()
        },
        oracle: []
    }, {userId: user.id}));
    test.ok(apps.appExists(appId));
    const q = await (userApps.getUserQuota({userId: user.id}));

    test.equal(q, 0);

    let appId2 = null;
    const appName = utils.randomId();
    try {
        appId2 = await (apps.addApp({
            config: {
                'name': appName
            },
            oracle: []
        }, {userId: user.id}));
        test.ok(false, 'Should not get here.')
    } catch (e) {
        console.log(e);
    }

    test.ok(appId2 === null);
    test.ok(!await (apps.isExistingAppName(appName)));
    await (apps.deleteApp(appId, {userId: user.id}));
    test.done();
};


exports.badName = async function (test) {

    let instantiator = await (testUtils.getInstantiator());
    let p = new AppStorage(instantiator.services.storage);
    await (p.init(instantiator));

    // reset quota from previous runs if changed
    await (p.changeQuota('Jake', settings.system.userAppQuota));
    test.throws(function () {
        await(p.addUserApp('Jake', 'q1', 'my app'));
    }, Error, 'Space is not ok in an app name.');
    let owns = await (p.userOwnsApp('Jake', 'q1'));
    test.ok(!owns);
    test.done();

};
