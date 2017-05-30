const testUtils = require("./TestUtils");
const utils = require("../lib/utils");
const History = require("../lib/Services/History");

_ = require('lodash');
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
const Qwiery = require("../lib");

exports.addCount = function(test) {
    const item = {
        BotConfiguration: {
            x: 4
        },
        Input: {
            Raw: "Time is critical"
        },
        Key: {
            UserId: "John",
            CorrelationId: utils.randomId()
        }

    };
    async(function() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let history = new History();
        waitFor(history.init(instantiator));
        let ctx = {userId: "John"};
        const initialCount = waitFor(history.getHistoryCount(ctx));
        waitFor(history.addHistoryItem(item, ctx));
        const newCount = waitFor(history.getHistoryCount(ctx));
        test.equal(newCount, initialCount + 1);
        const foundItem = waitFor(history.getUserHistoryItem(item.Key.CorrelationId, ctx));
        test.ok(utils.isDefined(foundItem));
        test.equal(foundItem.Input.Raw, "Time is critical");
        test.done();

    })();
};

exports.appendItem = function(test) {
    const that = this;

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let history = new History();
        waitFor(history.init(instantiator));
        const ctx = {userId: "Swa", appId: 3};
        const session = Qwiery.newSession({question:"Whatever", userId: ctx.userId, appId: ctx.appId});
        const count = waitFor(history.getHistoryCount(ctx));
        waitFor(history.addHistoryItem(session, ctx));
        const found = waitFor(history.getUserHistoryItem(session.Key.CorrelationId, ctx));
        test.ok(utils.isDefined(found));
        test.equal(waitFor(history.getHistoryCount(ctx)), count + 1);
        test.equal(waitFor(history.getHistoryCount({userId: utils.randomId()})), 0);
        test.done();
    }
    return async(runner)();

};
exports.getFullHistory = function(test) {
    const that = this;

    function runner() {
        let instantiator = waitFor(testUtils.getInstantiator());
        let history = new History();
        waitFor(history.init(instantiator));
        const userId = utils.randomId();
        const ctx = {userId: userId};
        let actions = [];
        for(let k = 0; k < 50; k++) {
            actions.push(history.addHistoryItem({
                id: k,
                Output: {
                    Answer: [{
                        Content: "Item " + k
                    }],
                    Timestamp: new Date()
                },
                Input:{
                    Raw:"Nothing here",
                    Timestamp: new Date()
                },
                Key: {
                    UserId: userId
                }
            }, ctx));
        }
        waitFor(Promise.all(actions));
        const count = waitFor(history.getHistoryCount(ctx));
        test.equal(count, 50);
        let histo = waitFor(history.getUserHistory(ctx));
        test.equal(histo.length, 50);
        histo = waitFor(history.getUserHistory(ctx, 13));
        test.equal(histo.length, 13);
        test.done();
    }

    return async(runner)();

};

