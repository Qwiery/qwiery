const StorageBase = require("../lib/Framework/StorageBase");
ServiceBase = require("../lib/Framework/ServiceBase"),
    utils = require("../lib/utils"),
    Qwiery = require("../lib"),
    _ = require("lodash"),
    MemoryStorage = require("../lib/Services/MemoryStorage"),
    MongoStorage = require("../lib/Services/MongoStorage"),
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await'),
    path = require("path"),
    testUtils = require("./TestUtils"),
    AppStorage = require("../lib/Services/Apps/AppStorage"),
    Apps = require("../lib/Services/Apps"),
    ctx = {userId: utils.randomId()};
let settings = {
    system: {
        userAppQuota: 33
    }
};
exports.justStorage = function(test) {


    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let p = new AppStorage(instantiator.services.storage);
        waitFor(p.init(instantiator));

        let appId = utils.randomId();
        let appName = utils.randomId();
        waitFor(p.addUserApp(ctx.userId, appId, appName));
        let ownsit = waitFor(p.userOwnsApp(ctx.userId, appId));
        test.equal(ownsit, true);
        let ids = waitFor(p.getUserAppsIds(ctx.userId));
        test.equal(ids.length, 1);
        waitFor(p.removeUserApp(ctx.userId, appId));
        ownsit = waitFor(p.userOwnsApp(ctx.userId, appId));
        test.equal(ownsit, false);

        test.done();
    }

    return async(runner)();
};

exports.changeQuota = function(test) {
    let settings = {
        system: {
            userAppQuota: 33
        }
    };

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let p = new AppStorage(instantiator.services.storage);
        waitFor(p.init(instantiator));

        let rq = parseInt(Math.random() * 1000);
        waitFor(p.changeQuota(ctx.userId, rq));
        let quota = waitFor(p.getUserQuota(ctx.userId));
        console.log("New quota set: " + rq);
        test.equal(quota, rq);
        test.done();
    }

    return async(runner)();
};

exports.saveApp = function(test) {
    let settings = {
        system: {
            userAppQuota: 633
        }
    };

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let p = new AppStorage(instantiator.services.storage);
        waitFor(p.init(instantiator));

        let conf = {
            id: utils.randomId(),
            name: utils.randomId()
        };
        waitFor(p.saveAppConfiguration(conf));

        let exists = waitFor(p.appExists(conf.id));
        test.equal(exists, true);
        exists = waitFor(p.isExistingAppName(conf.name));
        test.equal(exists, true);

        let ids = waitFor(p.getAppIds());
        test.equal(_.last(ids), conf.id);
        let id = waitFor(p.getAppIdFromName(conf.name));
        test.equal(id, conf.id);

        let appNames = waitFor(p.getAppNames());
        test.equal(appNames.length, ids.length);
        let appCount = waitFor(p.getAppCount());
        test.equal(appCount, ids.length);

        let confFound = waitFor(p.getAppConfiguration(conf.id));
        test.equal(confFound.id, conf.id);
        test.equal(confFound.name, conf.name);

        waitFor(p.deleteAppConfiguration(conf.id));
        exists = waitFor(p.appExists(conf.id));

        test.equal(exists, false);
        test.done();
    }

    return async(runner)();
};

exports.addUserApp = function(test) {
    const that = this;

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let p = new AppStorage(instantiator.services.storage);
        waitFor(p.init(instantiator));

        // reset quota from previous runs if changed
        waitFor(p.changeQuota("Jake", settings.system.userAppQuota));
        waitFor(p.addUserApp("Jake", "q1", "myapp"));
        let owns = waitFor(p.userOwnsApp("Jake", "q1"));
        test.ok(owns);
        let quota = waitFor(p.getUserQuota("Jake"));
        test.equal(quota, settings.system.userAppQuota - 1);
        waitFor(p.changeQuota("Jake", 22));
        quota = waitFor(p.getUserQuota("Jake"));
        test.equal(quota, 22);
        let ids = waitFor(p.getUserAppsIds("Jake"));
        let before = ids.length;
        waitFor(p.removeUserApp("Jake", "q1"));
        ids = waitFor(p.getUserAppsIds("Jake"));
        test.equal(ids.length, before - 1);
        test.done();
    }

    return async(runner)();
};

exports.appConf = function(test) {
    const that = this;

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let p = new AppStorage(instantiator.services.storage);
        waitFor(p.init(instantiator));

        let id = utils.randomId();
        const conf = {
            id: id,
            name: "my special app"
        };
        waitFor(p.saveAppConfiguration(conf));
        let yn = waitFor(p.appExists(id));
        test.ok(yn === true);

        yn = waitFor(p.isExistingAppName(conf.name));
        test.ok(yn === true);

        let ids = waitFor(p.getAppIds());
        test.equal(ids.length, 1);

        let nid = waitFor(p.getAppIdFromName(conf.name));
        test.equal(nid, conf.id);

        let names = waitFor(p.getAppNames());
        test.equal(names.length, 1);
        test.equal(names[0], conf.name);

        waitFor(p.deleteAppConfiguration(id));
        names = waitFor(p.getAppNames());
        test.equal(names.length, 0);
        test.done();
    }

    return async(runner)();
};

exports.addUserApp = function(test) {
    const that = this;

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let p = new AppStorage(instantiator.services.storage);
        waitFor(p.init(instantiator));

        // reset quota from previous runs if changed
        waitFor(p.changeQuota("Jake", settings.system.userAppQuota));
        waitFor(p.addUserApp("Jake", "q1", "myapp"));
        let owns = waitFor(p.userOwnsApp("Jake", "q1"));
        test.ok(owns);
        let quota = waitFor(p.getUserQuota("Jake"));
        test.equal(quota, settings.system.userAppQuota - 1);
        waitFor(p.changeQuota("Jake", 22));
        quota = waitFor(p.getUserQuota("Jake"));
        test.equal(quota, 22);
        let ids = waitFor(p.getUserAppsIds("Jake"));
        let before = ids.length;
        waitFor(p.removeUserApp("Jake", "q1"));
        ids = waitFor(p.getUserAppsIds("Jake"));
        test.equal(ids.length, before - 1);
        test.done();
    }

    return async(runner)();
};

exports.appConf = function(test) {
    const that = this;

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let p = new AppStorage(instantiator.services.storage);
        waitFor(p.init(instantiator));
        waitFor(p.clearAll());

        let id = utils.randomId();
        const conf = {
            id: id,
            name: "my special app"
        };
        waitFor(p.saveAppConfiguration(conf));
        let yn = waitFor(p.appExists(id));
        test.ok(yn === true);

        yn = waitFor(p.isExistingAppName(conf.name));
        test.ok(yn === true);

        let ids = waitFor(p.getAppIds());
        test.equal(ids.length, 1);

        let nid = waitFor(p.getAppIdFromName(conf.name));
        test.equal(nid, conf.id);

        let names = waitFor(p.getAppNames());
        test.equal(names.length, 1);
        test.equal(names[0], conf.name);

        waitFor(p.deleteAppConfiguration(id));
        names = waitFor(p.getAppNames());
        test.equal(names.length, 0);
        test.done();
    }

    return async(runner)();
};


exports.saveConfig = function(test) {
    const id = utils.randomId();


    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let apps = new Apps(instantiator.services.storage);
        waitFor(apps.init(instantiator));
        waitFor(apps._saveAppConfiguration({
            id: id,
            name: "Josh"
        }));
        test.ok(waitFor(apps.appExists(id)));
        test.ok(!waitFor(apps.appExists(utils.randomId())));
        // clean it up again
        waitFor(apps._deleteAppConfiguration(id));
        test.done();
    }

    return async(runner)();
};


exports.basic = function(test) {

    const id = utils.randomId();


    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let apps = new Apps(instantiator.services.storage);
        waitFor(apps.init(instantiator));
        const id = utils.randomId();
        const config = _.clone(apps.configTemplate);
        config.id = id;
        config.name = utils.randomId();
        waitFor(apps._saveAppConfiguration(config));
        test.ok(apps.appExists(id));

        // clean it up again
        waitFor(apps._deleteAppConfiguration(id));
        test.done();
    }

    return async(runner)();


};


exports.configError1 = function(test) {

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let apps = new Apps(instantiator.services.storage);
        waitFor(apps.init(instantiator));
        try {
            waitFor(apps.addApp({
                config: {}
            }, {userId: "Sharon"}));
            test.ok(false, "This should not be reached.")
        } catch(e) {
            console.log(e);
            test.equal(e, "Error in app configuration: no oracle section.");
            test.done();
        }
    }

    async(runner)();
};


exports.configError2 = function(test) {

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let apps = new Apps(instantiator.services.storage);
        waitFor(apps.init(instantiator));
        try {
            waitFor(apps.addApp({
                config: {}, oracle: {}
            }, {userId: "Sharon"}));
            test.ok(false, "This should not be reached.")
        } catch(e) {
            console.log(e);
            test.equal(e, "Error in app configuration: oracle section should be an array.");
            test.done();
        }
    }

    async(runner)();
};


exports.addApp = function(test) {
    function runner() {
        let qwiery = new Qwiery();
        let apps = qwiery.services.apps;
        // adding the minimal app
        const appId = waitFor(apps.addApp({
            config: {
                "name": utils.randomId()
            },
            oracle: []
        }, {userId: "Sharon"}));
        test.ok(waitFor(apps.appExists(appId)));
        test.done();
    }

    async(runner)();
};


exports.removeApp = function(test) {

    function runner() {
        let qwiery = new Qwiery();
        let apps = qwiery.services.apps;
        // adding a minimal app
        const appId = waitFor(apps.addApp({
            config: {
                "name": utils.randomId()
            },
            oracle: []
        }, {userId: "Sharon"}));
        test.ok(waitFor(apps.appExists(appId)));
        waitFor(apps.deleteApp(appId, {userId: "Sharon"}));
        test.ok(!waitFor(apps.appExists(appId)));
        test.done();
    }

    async(runner)();

};


exports.appNoAnswer = function(test) {

    function runner() {
        let qwiery = new Qwiery({
            apps: "*"
        });
        let apps = qwiery.services.apps;
        const appName = utils.randomId();
        const appId = waitFor(apps.addApp({
            config: {
                "name": appName,
                "noAnswer": "123456"
            },
            oracle: []
        }, {userId: "Sharon"}));

        // asking this app gives the NoAnswer
        const answer = waitFor(qwiery.askFlat("@" + appName + " what is space?", {userId: "Sharon"}));
        test.equal(answer, "123456");
        waitFor(apps.deleteApp(appId, {userId: "Sharon"}));
        test.done();
    }

    async(runner)();
};


exports.appOracle = function(test) {

    function runner() {
        let qwiery = new Qwiery({
            apps: "*"
        });
        let apps = qwiery.services.apps;
        const appName = utils.randomId();
        const dummyAnswer = "I am a dummy app.";
        const appId = waitFor(apps.addApp({
            config: {
                "name": appName,
                "pipeline": ["Edictor"],
                "noAnswer": "Not much."
            },
            oracle: [
                {
                    "Id": "Tt6d7d76",
                    "Questions": [
                        "who are you"
                    ],
                    "Template": {
                        "Answer": dummyAnswer
                    },
                    "UserId": "Everyone",
                    "Category": "Something Else" // will be replaced when added
                }]
        }, {userId: "Sharon"}));

        // asking this app gives the dummy
        qwiery.askFlat("@" + appName + " who are you?", {userId: "Sharon"}).then(function(answer) {
            test.equal(answer, dummyAnswer);
            // but everything else fails
            qwiery.askFlat("@" + appName + " what do you do?", {userId: "Sharon"}).then(function(answer) {
                test.equal(answer, "Not much.");
                apps.deleteApp(appId, {userId: "Sharon"});
                test.done();
            });
        });
    }

    async(runner)();

};

exports.userQuota = function(test) {

    function runner() {
        let qwiery = new Qwiery({
            apps: "*"
        });
        let apps = qwiery.services.apps;
        // by default a user can create just one app
        const user = waitFor(qwiery.services.identity.upsertUser({
            userId: "Bubba",
            local: {"email": "Bubba", "password": "65165"}
        }));
        const userApps = qwiery.services.apps.userApps;
        waitFor(userApps.changeQuota({userId: user.id}, 1));
        const appId = waitFor(apps.addApp({
            config: {
                "name": utils.randomId()
            },
            oracle: []
        }, {userId: user.id}));
        test.ok(apps.appExists(appId));
        const q = waitFor(userApps.getUserQuota({userId: user.id}));

        test.equal(q, 0);

        let appId2 = null;
        const appName = utils.randomId();
        try {
            appId2 = waitFor(apps.addApp({
                config: {
                    "name": appName
                },
                oracle: []
            }, {userId: user.id}));
            test.ok(false, "Should not get here.")
        } catch(e) {
            console.log(e);
        }

        test.ok(appId2 === null);
        test.ok(!waitFor(apps.isExistingAppName(appName)));
        waitFor(apps.deleteApp(appId, {userId: user.id}));
        test.done();


    }

    async(runner)();
};


exports.badName = async function(test) {

    let instantiator = await(testUtils.getInstantiator("mongo"));
    let p = new AppStorage(instantiator.services.storage);
    await(p.init(instantiator));

    // reset quota from previous runs if changed
    await(p.changeQuota("Jake", settings.system.userAppQuota));
    await(p.addUserApp("Jake", "q1", "my app"));
    let owns = await(p.userOwnsApp("Jake", "q1"));
    test.ok(owns);
    test.done();

};