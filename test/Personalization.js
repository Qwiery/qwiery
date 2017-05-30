const StorageBase = require("../lib/Framework/StorageBase");
const ServiceBase = require("../lib/Framework/ServiceBase");
const utils = require("../lib/utils");
const _ = require("lodash");
const MemoryStorage = require("../lib/Services/MemoryStorage");
const MongoStorage = require("../lib/Services/MongoStorage");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
const path = require("path");
const testUtils = require("./TestUtils");
const ctx = {userId: utils.randomId()};

exports.Personalization = function(test) {
    const that = this;
    let Personalization = require("../lib/Services/Personalization");
    let p = new Personalization();

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());

        waitFor(p.init(instantiator));
        waitFor(p.addPersonalization("Taste", "Sushi", ctx));
        let taste = waitFor(p.getPersonalization("Taste", ctx));
        test.equal(taste, "Sushi");
        waitFor(p.clearAllUserPersonalizations(ctx));
        test.done();
    }

    return async(runner)();

};

exports.addPersonalization = function(test) {
    const that = this;
    let Personalization = require("../lib/Services/Personalization");
    let p = new Personalization();

    let settings = {};

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());

        waitFor(p.init(instantiator));
        waitFor(p.addPersonalization("color", "red", ctx));
        let color = waitFor(p.getPersonalization("color", ctx));
        test.equal(color, "red");
        // upsert
        waitFor(p.addPersonalization("color", "green", ctx));
        color = waitFor(p.getPersonalization("color", ctx));
        test.equal(color, "green");

        waitFor(p.addPersonalization("span", 155, ctx));
        let all = waitFor(p.getUserPersonalizations(ctx));
        test.equal(all.length, 2);

        waitFor(p.clearAllUserPersonalizations(ctx));
        all = waitFor(p.getUserPersonalizations(ctx));
        test.equal(all.length, 0);

        test.done();
    }

    return async(runner)();
};

exports.enginePersonalization = function(test) {
    const that = this;
    let Personalization = require("../lib/Services/Personalization");
    let p = new Personalization();

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        waitFor(p.init(instantiator));
        waitFor(p.addEnginePersonalization("color", "orange", "myapp"));
        const color = waitFor(p.getEnginePersonalization("color", "myapp"));
        test.equal(color, "orange");
        test.done();
    }

    return async(runner)();
};