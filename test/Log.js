const path = require("path");
const utils = require("../lib/utils");
const ServiceBase = require("../lib/Framework/ServiceBase");
const CommandBase = require("../lib/Framework/CommandBase");
const fs = require('fs');
const _ = require('lodash');
const assert = require('assert');
const Instantiator = require("../lib/Instantiator");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
const Qwiery = require("../lib");
const qwiery = new Qwiery({
    system: {
        coreServices: [
            {
                name: "MongoStorage",
                "connection": 'mongodb://localhost:27017/QwieryDB',
                "options": {}
            },
            "Log"],
        coreInterpreters: []
    }
});
const log = qwiery.services.log;
exports.logError = function(test) {
    const that = this;

    function runner() {
        var msg = utils.randomId();
        log.clearErrors().then(function() {
            log.error(new Error(msg)).then(function() {
                log.getLastErrors(1).then(function(list) {
                    test.equal(list.length, 1);
                    test.equal(list[0].message, msg);
                    test.done();
                });
            });
        });
    }

    return async(runner)();
};

exports.errorLogging = function(test) {
    const that = this;

    function runner() {
        waitFor(log.clearErrors());
        for(let i = 1; i < 30; i++) {
            waitFor(log.error({
                message: "Item " + i,
                stack: [],
                date: new Date("2030/3/" + i)
            }));
        }
        let few = waitFor(log.getLastErrors(3));
        test.equal(few.length, 3);
        test.equal(+few[0].date, +new Date("2030/3/29"));
        test.done();
    }

    return async(runner)();
};


exports.feedback = function(test) {
    const that = this;

    function runner() {
        var msg = {
            User: "justme",
            Comments: utils.randomId()
        };
        log.feedback(msg).then(function() {
            log.getLastFeedback(1).then(function(list) {
                test.equal(list.length, 1);
                test.equal(list[0].comments, msg.Comments);
                test.done();
            });
        });
    }

    return async(runner)();
};
