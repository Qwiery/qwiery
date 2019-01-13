const utils = require('../lib/utils');
const _ = require('lodash');
const Qwiery = require('../lib');

const qwiery = new Qwiery({
    system: {
        coreServices: [
            {
                name: 'MongoStorage',
                'connection': 'mongodb://localhost:27017/QwieryDB',
                'options': {}
            }, 'Statistics', 'Topics'],
        coreInterpreters: []
    }
});
let statistics = qwiery.services.statistics;

exports.increaseTemplateUsageCount = async function (test) {
    const id = utils.randomId();
    await (statistics.increaseTemplateUsageCount(id));
    let count = await (statistics.getTemplateUsage(id));
    test.equal(count, 1);
    await (statistics.increaseTemplateUsageCount(id, 5));
    count = await (statistics.getTemplateUsage(id));
    test.equal(count, 6);
    test.done();
};

exports.increaseAnswerCountForToday = async function (test) {
    let stats = await (statistics.getGlobalUsageStats());
    let before = stats[new Date().toLocaleDateString()] || 0;
    await (statistics.increaseAnswerCountForToday());
    stats = await (statistics.getGlobalUsageStats());
    let after = stats[new Date().toLocaleDateString()];
    // the stats is a dic with date as key
    test.equal(after, before + 1);
    test.done();
};

exports.addAnswerTiming = async function (test) {
    let tims = await (statistics.getTimings());
    let before = tims.length;
    await (statistics.addAnswerTiming(14299));
    tims = await (statistics.getTimings());
    let after = tims.length;
    test.equal(after, before + 1);
    test.equal(tims[tims.length - 1].value, 14299);
    test.done();
};

exports.addLanguageUsage = async function (test) {
    const u = {
        url: 'A',
        userId: 'ikke',
        method: 'POST',
        body: 'Some structure here',
        ip: '1.2.3.4'
    };
    await statistics.addLanguageUsage(u);
    const list = await statistics.getLastLanguageUsage(1);
    test.equal(list.length, 1);
    const item = list[0];
    test.equal(item.url, u.url);
    test.equal(item.userId, u.userId);
    test.equal(item.body, u.body);
    test.equal(item.method, u.method);
    test.done();
};

exports.askUsage = async function (test) {
    const u = {
        url: 'NA',
        userId: '7845',
        method: 'Not Applicable',
        body: JSON.stringify({question: utils.randomId()}),
        ip: 'NA',
        appId: 'ADSASNSA',
        date: new Date()
    };
    await statistics.addAskUsage(u);
    const list = await statistics.getLastAskUsage(1);
    test.equal(list.length, 1);
    const item = list[0];
    test.equal(item.url, u.url);
    test.equal(item.userId, u.userId);
    item.body = JSON.parse(item.body);
    test.equal(item.body.question, u.body.question);
    test.equal(item.method, u.method);
    test.equal(item.appId, u.appId);
    test.done();
};
