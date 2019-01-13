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
            },
            'Log'],
        coreInterpreters: []
    }
});

const log = qwiery.services.log;

exports.logError = async function (test) {
    const msg = utils.randomId();
    await log.clearErrors();
    await log.error(new Error(msg));
    const list = await log.getLastErrors(1);
    test.equal(list.length, 1);
    test.equal(list[0].message, msg);
    test.done();
};

exports.errorLogging = async function (test) {
    await (log.clearErrors());
    for (let i = 1; i < 30; i++) {
        await log.error({
            message: 'Item ' + i,
            stack: [],
            date: new Date('2030/3/' + i)
        });
    }
    let few = await (log.getLastErrors(3));
    test.equal(few.length, 3);
    test.equal(+few[0].date, +new Date('2030/3/29'));
    test.done();
};


exports.feedback = async function (test) {
    var msg = {
        User: 'justme',
        Comments: utils.randomId()
    };
    await log.feedback(msg);
    const list = await log.getLastFeedback(1);
    test.equal(list.length, 1);
    test.equal(list[0].comments, msg.Comments);
    test.done();
};
