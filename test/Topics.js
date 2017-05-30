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
const Topics = require("../lib/Services/Topics");

exports.Topics = function(test) {
    const that = this;
    let Topics = require("../lib/Services/Topics");
    let p = new Topics();


    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        waitFor(p.init(instantiator));
        waitFor(p.clearUserTopics(ctx));
        let topics = waitFor(p.getUserTopics(ctx));
        let before = topics.length;
        waitFor(p.addUserTopics("Food", ctx));
        topics = waitFor(p.getUserTopics(ctx));
        test.equal(topics.length, before + 1);
        test.done();
    }

    return async(runner)();

};

exports.addTopic = function(test) {
    const that = this;

    let p = new Topics();

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator("mongo"));

        waitFor(p.init(instantiator));
        waitFor(p.clearUserTopics(ctx));
        waitFor(p.addUserTopics("Science", ctx));
        let topics = waitFor(p.getUserTopics(ctx));
        let found = _.find(topics, {Type: "science"});
        test.ok(utils.isDefined(found));
        test.equal(found.Weight, 1);
        let randomTopic = utils.randomId().toLowerCase();
        waitFor(p.addUserTopics(["Science", randomTopic], ctx));
        topics = waitFor(p.getUserTopics(ctx));
        found = _.find(topics, {Type: "science"});
        test.equal(found.Weight, 2);
        found = _.find(topics, {Type: randomTopic});
        test.equal(found.Weight, 1);
        test.done();

    }

    return async(runner)();
};

exports.standardTopics = function(test) {
    const that = this;
    let p = new Topics();

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        waitFor(p.init(instantiator));
        const name = utils.randomId();
        waitFor(p.removeAllStandardTopics());
        waitFor(p.addStandardTopic(name));
        let exists = waitFor(p.standardTopicExists(name));
        test.equal(exists, true);
        test.done();
    }

    return async(runner)();
};

exports.topicHistory = function(test) {
    const that = this;
    let p = new Topics();
    let ctx = {userId: "Ina"};

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator("mongo"));
        waitFor(p.init(instantiator));
        let topicName = utils.randomId();
        waitFor(p.addTopicHistory(ctx, topicName));
        let all = waitFor(p.getTopicHistory(ctx));
        test.equal(all[0].name, topicName.toLowerCase());

        // no multiplicity
        topicName = utils.randomId();
        waitFor(p.addTopicHistory(ctx, topicName));
        all = waitFor(p.getTopicHistory(ctx));
        let count = all.length;
        [topicName, topicName, topicName].forEach(function(n) {
            waitFor(p.addTopicHistory(ctx,n ));
        });
        all = waitFor(p.getTopicHistory(ctx));
        // check the last three were not added
        test.equal(count, all.length);

        // check truncation at 50
        for(let i = 0; i < 80; i++) {
            waitFor(p.addTopicHistory(ctx, "Topic " + i));
        }
        all = waitFor(p.getTopicHistory(ctx));
        test.equal(all.length, 50);
        test.done();
    }

    return async(runner)();
};

/**
 * This demonstrates that the topics defined in the Topics property of a template
 * are added to the topics-usage of the user.
 */
exports.topicInTemplate = function(test) {
    const topic = utils.randomId().toLowerCase();
    const otherTopic = utils.randomId().toLowerCase();
    const ctx = {userId: utils.randomId()};
    const settings = {
        defaultApp: "Jonas",
        apps: [
            {
                name: "Jonas",
                id: "Jonas",
                oracle: [
                    {
                        "Id": "KQERTADSN",
                        "UserId": "Everyone",
                        "Template": {
                            "Answer": {
                                "String": "Side effect of using the template"
                            }
                        },
                        "Category": "Diverse",
                        "Topics": [
                            otherTopic, topic
                        ],
                        "Questions": [
                            "Hello"
                        ]
                    }
                ]
            }
        ]
    };
    const q = new Qwiery(settings);
    q.askFlat("Hello", ctx).then(function(answer) {
        q.services.topics.getTopicHistory(ctx).then(function(topics) {
            // first one is the most recent
            test.equal(topics[0].name, topic);
            let found = _.find(topics, function(x) {
                return x.name === otherTopic;
            });
            test.ok(utils.isDefined(found));
            test.done();
        });
    });
};

