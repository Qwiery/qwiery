var
    Qwiery = require("../lib"),
    utils = require("../lib/utils"),
    _ = require('lodash');

var path = require("path"),
    fs = require("fs-extra"),
    ctx = {userId: "Sharon"};

const qwiery = new Qwiery({
    system: {
        coreServices: [
            {
                name: "MongoStorage",
                "connection": 'mongodb://localhost:27017/QwieryDB',
                "options": {}
            }, "Graph", "Identity","Oracle"]
    }
});
var services = qwiery.services;
var
    identity = services.identity,
    storage = services.storage;
var async = require('asyncawait/async');
var waitFor = require('asyncawait/await');
exports.upsertUserWithoutEnoughInfo = function(test) {

    /* to create a user you need either
     - a username for local auth
     - an object coming from the social authenticator
     */
    test.throws(function() {
        identity.upsertUser({"whatever": 44})
    }, Error, "Registering a user with insufficient property.");

    test.done();
};


exports.upsertUserSetsId = function(test) {
    test.expect(4);
    identity.upsertUser({"apiKey": "Carl", local: {email: "carl@qwiery.com"}}).then(function(user) {
        test.ok(utils.isDefined(user.id));
        test.ok(utils.isUndefined(user.Gender));
        // update the user
        user.apiKey = "M";
        identity.upsertUser(user).then(function(user2) {
            identity.getById(user.id).then(function(found) {
                test.ok(utils.isDefined(found));
                test.ok(utils.isDefined(found.apiKey) && found.apiKey === "M");
                test.done();
            });

        });
    });

};

// exports.changeUsername = function(test) {
//     test.expect(2);
//     identity.upsertUser({local:{"email": "Carl"}}).then(function(user) {
//         test.ok(utils.isDefined(user.id));
//         identity.changeUsername("Angie", {userId: user.id}).then(function(user2) {
//             var found = identity.getById(user.id);
//             test.ok(found.email === "Angie");
//             test.done();
//         });
//     });
// };

exports.getByFacebookId = function(test) {
    test.expect(1);
    identity.upsertUser({"facebook": {"id": "bibi"}}).then(function(user) {
        identity.getByFacebookId("bibi").then(function(user2) {
            test.ok(utils.isDefined(user2));
            test.done();
        });
    });
};

exports.getByGoogleId = function(test) {
    test.expect(1);
    identity.upsertUser({"google": {"id": "lili"}}).then(function(user) {
        identity.getByGoogleId("lili").then(function(user2) {
            test.ok(utils.isDefined(user2));
            test.done();
        });
    });

};

exports.getByEmail = function(test) {
    identity.upsertUser({
        apiKey: "Sharon",
        id: "Sharon",
        creationDate: new Date(),
        local: {
            email: "sharon@qwiery.com",
            password: "123456"
        }
    }).then(function() {
        identity.getByEmail("sharon@qwiery.com").then(function(user) {
            test.ok(utils.isDefined(user));
            console.log("User with email '%s' has id '%s'", "sharon@qwiery.com", user.id);
            test.done();
        });
    });

};


exports.facebookId = function(test) {

    const that = this;
    const id = utils.randomId();

    function runner() {
        let all = waitFor(identity.getAllUsers());
        let startCount = all.length;
        const user = {
            id: id,
            apiKey: "key_" + id,
            local: {
                "email": "me@qwiery.com",
                "password": "This will never be used"
            },
            "facebook": {
                "email": "me@tfbnw.net",
                "first_name": "Akan",
                "last_name": "Fraskin",
                "name": "Akan Fraskin",
                "timezone": 4,
                "verified": false,
                "id": "100005929021723"
            }
        };
        waitFor(identity.upsertUser(user));
        test.ok(waitFor(identity.exists(id)));
        let found = waitFor(identity.getByEmail("me@qwiery.com"));
        test.ok(utils.isDefined(found));
        test.equal(found.local.email, user.local.email);
        found = waitFor(identity.getByFacebookId("100005929021723"));
        test.ok(utils.isDefined(found));
        all = waitFor(identity.getAllUsers());
        test.equal(all.length, startCount + 1);

        user.facebook.id = "53003";
        waitFor(identity.upsertUser(user));
        found = waitFor(identity.getByFacebookId("53003"));
        test.ok(utils.isDefined(found));
        all = waitFor(identity.getAllUsers());
        test.equal(all.length, startCount + 1);
        test.done();
    }

    return async(runner)();
};