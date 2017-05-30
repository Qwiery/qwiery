const system = require("../lib/Services/System");
const utils = require("../lib/utils");
const Qwiery = require("../lib");
const fs = require("fs-extra");
const path = require("path");
var async = require('asyncawait/async');
var waitFor = require('asyncawait/await');

exports.datetime = function(test) {
    test.ok(utils.isDefined(system.getDate()));
    test.ok(utils.isDefined(system.getDateTime()));
    test.ok(utils.isDefined(system.getTime()));
    test.done();
};

exports.systemVariable = function(test) {
    const that = this;

    function runner() {
        const settings = {};
        const qwiery = new Qwiery(settings);
        let time = waitFor(qwiery.services.system.getSystemVariable("time"));
        test.equal(system.getTime(), time);
        let date = waitFor(qwiery.services.system.getSystemVariable("date"));
        test.equal(system.getDate(), date);

        let pack = fs.readJsonSync(path.join(__dirname, "../package.json"));
        let version = waitFor(qwiery.services.system.getSystemVariable("version"));
        test.equal(version, pack.version);
        let versiondate = waitFor(qwiery.services.system.getSystemVariable("versiondate"));
        test.equal(versiondate, pack._versionDate);
        let serviceUrl = waitFor(qwiery.services.system.getSystemVariable("serviceUrl"));
        test.equal(serviceUrl, pack._serviceUrl);
        test.done();
    }

    return async(runner)();
};