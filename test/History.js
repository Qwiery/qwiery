const testUtils = require('./TestUtils');
const utils = require('../lib/utils');
const History = require('../lib/Services/History');
const _ = require('lodash');
const Qwiery = require('../lib');

exports.addCount = async function (test) {
    const item = {
        BotConfiguration: {
            x: 4
        },
        Input: {
            Raw: 'Time is critical'
        },
        Key: {
            UserId: 'John',
            CorrelationId: utils.randomId()
        }

    };
    let instantiator = await (testUtils.getInstantiator());
    let history = new History();
    await (history.init(instantiator));
    let ctx = {userId: 'John'};
    const initialCount = await (history.getHistoryCount(ctx));
    await (history.addHistoryItem(item, ctx));
    const newCount = await (history.getHistoryCount(ctx));
    test.equal(newCount, initialCount + 1);
    const foundItem = await (history.getUserHistoryItem(item.Key.CorrelationId, ctx));
    test.ok(utils.isDefined(foundItem));
    test.equal(foundItem.Input.Raw, 'Time is critical');
    test.done();
};

exports.appendItem = async function (test) {
    let instantiator = await (testUtils.getInstantiator());
    let history = new History();
    await (history.init(instantiator));
    const ctx = {userId: 'Swa', appId: 3};
    const session = Qwiery.newSession({question: 'Whatever', userId: ctx.userId, appId: ctx.appId});
    const count = await (history.getHistoryCount(ctx));
    await (history.addHistoryItem(session, ctx));
    const found = await (history.getUserHistoryItem(session.Key.CorrelationId, ctx));
    test.ok(utils.isDefined(found));
    test.equal(await (history.getHistoryCount(ctx)), count + 1);
    test.equal(await (history.getHistoryCount({userId: utils.randomId()})), 0);
    test.done();

};

exports.getFullHistory = async function (test) {
    let instantiator = await (testUtils.getInstantiator());
    let history = new History();
    await (history.init(instantiator));
    const userId = utils.randomId();
    const ctx = {userId: userId};
    let actions = [];
    for (let k = 0; k < 50; k++) {
        actions.push(history.addHistoryItem({
            id: k,
            Output: {
                Answer: [{
                    Content: 'Item ' + k
                }],
                Timestamp: new Date()
            },
            Input: {
                Raw: 'Nothing here',
                Timestamp: new Date()
            },
            Key: {
                UserId: userId
            }
        }, ctx));
    }
    await (Promise.all(actions));
    const count = await (history.getHistoryCount(ctx));
    test.equal(count, 50);
    let histo = await (history.getUserHistory(ctx));
    test.equal(histo.length, 50);
    histo = await (history.getUserHistory(ctx, 13));
    test.equal(histo.length, 13);
    test.done();

};

