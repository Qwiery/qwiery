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
const Qwiery = require("../lib");
const qwiery = new Qwiery({
    system: {
        coreServices: [
            {
                name: "MongoStorage",
                "connection": 'mongodb://localhost:27017/QwieryDB',
                "options": {}
            }, "Statistics", "Topics"],
        coreInterpreters: []
    }
});
let statistics = qwiery.services.statistics;

exports.increaseTemplateUsageCount = function(test) {
    const id = utils.randomId();
    const that = this;

    function runner() {
        waitFor(statistics.increaseTemplateUsageCount(id));
        let count = waitFor(statistics.getTemplateUsage(id));
        test.equal(count, 1);
        waitFor(statistics.increaseTemplateUsageCount(id, 5));
        count = waitFor(statistics.getTemplateUsage(id));
        test.equal(count, 6);
        test.done();
    }

    return async(runner)();
};

exports.increaseAnswerCountForToday = function(test) {
    const that = this;

    function runner() {
        let stats = waitFor(statistics.getGlobalUsageStats());
        let before = stats[new Date().toLocaleDateString()] || 0;
        waitFor(statistics.increaseAnswerCountForToday());
        stats = waitFor(statistics.getGlobalUsageStats());
        let after = stats[new Date().toLocaleDateString()];
        // the stats is a dic with date as key
        test.equal(after, before + 1);
        test.done();

    }

    return async(runner)();
};

exports.addAnswerTiming = function(test) {
    const that = this;

    function runner() {
        let tims = waitFor(statistics.getTimings());
        let before = tims.length;
        waitFor(statistics.addAnswerTiming(14299));
        tims = waitFor(statistics.getTimings());
        let after = tims.length;
        test.equal(after, before + 1);
        test.equal(tims[tims.length - 1].value, 14299);
        test.done();
    }

    return async(runner)();
};

exports.addLanguageUsage = function(test) {
    const that = this;

    function runner() {
        var u = {
            url: "A",
            userId: "ikke",
            method: "POST",
            body: "Some structure here",
            ip: "1.2.3.4"
        };
        statistics.addLanguageUsage(u).then(function() {
            statistics.getLastLanguageUsage(1).then(function(list) {
                test.equal(list.length, 1);
                const item = list[0];
                test.equal(item.url, u.url);
                test.equal(item.userId, u.userId);
                test.equal(item.body, u.body);
                test.equal(item.method, u.method);
                test.done();
            });
        });
    }

    return async(runner)();
};

exports.askUsage = function(test) {
    const that = this;

    function runner() {
        const u = {
            url: "NA",
            userId: "7845",
            method: "Not Applicable",
            body: JSON.stringify({question: utils.randomId()}),
            ip: "NA",
            appId: "ADSASNSA",
            date: new Date()
        };
        statistics.addAskUsage(u).then(function() {
            statistics.getLastAskUsage(1).then(function(list) {
                test.equal(list.length, 1);
                var item = list[0];
                test.equal(item.url, u.url);
                test.equal(item.userId, u.userId);
                item.body = JSON.parse(item.body);
                test.equal(item.body.question, u.body.question);
                test.equal(item.method, u.method);
                test.equal(item.appId, u.appId);
                test.done();
            });
        });
    }

    return async(runner)();
};