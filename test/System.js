const system = require('../lib/Services/System');
const utils = require('../lib/utils');
const Qwiery = require('../lib');
const fs = require('fs-extra');
const path = require('path');

exports.datetime = function (test) {
    test.ok(utils.isDefined(system.getDate()));
    test.ok(utils.isDefined(system.getDateTime()));
    test.ok(utils.isDefined(system.getTime()));
    test.done();
};

exports.systemVariable = async function (test) {
    const settings = {};
    const qwiery = new Qwiery(settings);
    let time = await (qwiery.services.system.getSystemVariable('time'));
    test.equal(system.getTime(), time);
    let date = await (qwiery.services.system.getSystemVariable('date'));
    test.equal(system.getDate(), date);

    let pack = fs.readJsonSync(path.join(__dirname, '../package.json'));
    let version = await (qwiery.services.system.getSystemVariable('version'));
    test.equal(version, pack.version);
    let versiondate = await (qwiery.services.system.getSystemVariable('versiondate'));
    test.equal(versiondate, pack._versionDate);
    let serviceUrl = await (qwiery.services.system.getSystemVariable('serviceUrl'));
    test.equal(serviceUrl, pack._serviceUrl);
    test.done();
};
