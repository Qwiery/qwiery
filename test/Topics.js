const utils = require('../lib/utils');
const _ = require('lodash');
const testUtils = require('./TestUtils');
const ctx = {userId: utils.randomId()};
const Qwiery = require('../lib');
const Topics = require('../lib/Services/Topics');

exports.Topics = async function (test) {
    const that = this;
    let Topics = require('../lib/Services/Topics');
    let p = new Topics();
    let instantiator = await (testUtils.getInstantiator());
    await (p.init(instantiator));
    await (p.clearUserTopics(ctx));
    let topics = await (p.getUserTopics(ctx));
    let before = topics.length;
    await (p.addUserTopics('Food', ctx));
    topics = await (p.getUserTopics(ctx));
    test.equal(topics.length, before + 1);
    test.done();

};

exports.addTopic = async function (test) {
    let p = new Topics();

    let instantiator = await (testUtils.getInstantiator('mongo'));

    await (p.init(instantiator));
    await (p.clearUserTopics(ctx));
    await (p.addUserTopics('Science', ctx));
    let topics = await (p.getUserTopics(ctx));
    let found = _.find(topics, {Type: 'science'});
    test.ok(utils.isDefined(found));
    test.equal(found.Weight, 1);
    let randomTopic = utils.randomId().toLowerCase();
    await (p.addUserTopics(['Science', randomTopic], ctx));
    topics = await (p.getUserTopics(ctx));
    found = _.find(topics, {Type: 'science'});
    test.equal(found.Weight, 2);
    found = _.find(topics, {Type: randomTopic});
    test.equal(found.Weight, 1);
    test.done();
};

exports.standardTopics = async function (test) {
    let p = new Topics();

    let instantiator = await (testUtils.getInstantiator());
    await (p.init(instantiator));
    const name = utils.randomId();
    await (p.removeAllStandardTopics());
    await (p.addStandardTopic(name));
    let exists = await (p.standardTopicExists(name));
    test.equal(exists, true);
    test.done();
};

exports.topicHistory = async function (test) {
    const that = this;
    let p = new Topics();
    let ctx = {userId: 'Ina'};

    let instantiator = await (testUtils.getInstantiator('mongo'));
    await (p.init(instantiator));
    let topicName = utils.randomId();
    await (p.addTopicHistory(ctx, topicName));
    let all = await (p.getTopicHistory(ctx));
    test.equal(all[0].name, topicName.toLowerCase());

    // no multiplicity
    topicName = utils.randomId();
    await (p.addTopicHistory(ctx, topicName));
    all = await (p.getTopicHistory(ctx));
    let count = all.length;
    [topicName, topicName, topicName].forEach(function (n) {
        await(p.addTopicHistory(ctx, n));
    });
    all = await (p.getTopicHistory(ctx));
    // check the last three were not added
    test.equal(count, all.length);

    // check truncation at 50
    for (let i = 0; i < 80; i++) {
        await (p.addTopicHistory(ctx, 'Topic ' + i));
    }
    all = await (p.getTopicHistory(ctx));
    test.equal(all.length, 50);
    test.done();
};

/**
 * This demonstrates that the topics defined in the Topics property of a template
 * are added to the topics-usage of the user.
 */
exports.topicInTemplate = async function (test) {
    const topic = utils.randomId().toLowerCase();
    const otherTopic = utils.randomId().toLowerCase();
    const ctx = {userId: utils.randomId()};
    const settings = {
        defaultApp: 'Jonas',
        apps: [
            {
                name: 'Jonas',
                id: 'Jonas',
                oracle: [
                    {
                        'Id': 'KQERTADSN',
                        'UserId': 'Everyone',
                        'Template': {
                            'Answer': {
                                'String': 'Side effect of using the template'
                            }
                        },
                        'Category': 'Diverse',
                        'Topics': [
                            otherTopic, topic
                        ],
                        'Questions': [
                            'Hello'
                        ]
                    }
                ]
            }
        ]
    };
    const q = new Qwiery(settings);
    await q.askFlat('Hello', ctx);
    const topics = await q.services.topics.getTopicHistory(ctx);
    // first one is the most recent
    test.equal(topics[0].name, topic);
    let found = _.find(topics, function (x) {
        return x.name === otherTopic;
    });
    test.ok(utils.isDefined(found));
    test.done();
};

