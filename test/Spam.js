const Qwiery = require('../lib'),
    _ = require('lodash');

const qwiery = new Qwiery();

const alex = require('alex');

exports.basic = function (test) {
    const hurts = alex('This is fucking cool. His task should have been done. <script>function alhp(){}</script>');
    test.ok(hurts.messages.length > 0);
    test.equal(hurts.messages[0].column, 9);
    test.equal(hurts.messages[0].ruleId, 'fucking');
    test.done();
};

exports.profaneQuestion = async function (test) {
    const answer = await qwiery.askFlat('Damn you*', {userId: 'Juan'});
    test.ok(answer.indexOf('I consider the word') > -1);
    test.done();
};
