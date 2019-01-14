const Qwiery = require("../lib"),
    utils = require("../lib/utils"),
    texturize = require("../lib/texturize"),
    constants = require("../lib/constants"),
    _ = require('lodash');

const path = require("path"),
    fs = require("fs-extra");
const qwiery = new Qwiery();





exports.pos = function(test) {
    qwiery.ask("pos>All is well in the end", {return: "text"}).then(function(answer) {
        //test.ok(answer.indexOf("Qwiery Template Language") >= 0);
        test.done();
    });
};

exports.keywords = function(test) {
    qwiery.ask("keywords>http://www.qwiery.com", {return: "text"}).then(function(answer) {
        //test.ok(answer.indexOf("Qwiery Template Language") >= 0);
        test.done();
    });
};

exports.summarize = async function (test) {
    const answer = await qwiery.ask("summarize>http://www.qwiery.com", {return: "text"});
    console.log(answer);
    test.ok(answer.indexOf("It's written in JavaScript") >= 0);
    test.done();
};

exports.lookup = function(test) {
    qwiery.ask("lookup>tangible", {return: "text"}).then(function(answer) {
        test.ok(answer.indexOf("capable of being") >= 0);
        test.done();
    });
};

exports.search = function(test) {
    qwiery.ask("search>*", {userId: "Anonymous"}).then(function(session) {
        test.ok(session.Output.Answer.length > 0);
        test.done();
    });
};

exports.setSpace = function(test) {
    qwiery.run(["add>space>room", "set> space>room", "get>space>"], {userId: "Anonymous"}).then(function(sessions) {
        test.equal(_.last(sessions).Output.Answer[0].name, "room");
        test.done();
    });
};

exports.getHelp = function(test) {
    qwiery.ask("help> qwiery", {userId: "Anonymous"}, true).then(function(answer) {
        console.log(answer);
        test.done();
    });
};

exports.deleteTag = function(test) {
    qwiery.run(["delete>tag>hello", "Y"], {userId: "Anonymous", return: "session"}).then(function(session) {
        //console.log(session.Output.Answer);
        test.done();
    });
};

exports.getSpace = function(test) {
    qwiery.ask("get>space>def", {userId: "Anonymous"}, false).then(function(session) {
        console.log(session.Output.Answer);
        test.ok(_.isArray(session.Output.Answer));
        test.equal(session.Output.Answer[0].DataType, "WorkspaceSummary");
        test.done();
    });
};

exports.addTag = function(test) {
    qwiery.ask("add>tag> stuff").then(function(session) {
        test.ok(texturize.extractSimple(session).indexOf("has been added") >= 0);
        test.equal(utils.getPodType(session), constants.podType.Text);
        test.done();
    });
};

exports.addSomething = function(test) {
    // the Alias interpreter will turn this into a Thought
    qwiery.ask("add>idea> i1").then(function(session) {
        // the whole entity is returned
        test.equal(utils.getPodType(session), "SingleEntity");
        test.equal(session.Output.Answer[0].Entity.Title, "i1");
        test.done();
    });
};

exports.getNode = function(test) {
    qwiery.run(["add>Thought> title:something, id: akada", "get> akada"], {userId: "Sharon"}).then(function(sessions) {
        // the whole entity is returned
        test.equal(utils.getPodType(sessions[1]), "Thought");
        test.equal(sessions[1].Output.Answer[0].Title, "something");
        test.done();
    });
};
