const Qwiery = require("../lib"),
    utils = require("../lib/utils"),
    _ = require('lodash');

const path = require("path"),
    fs = require("fs-extra");
const qwiery = new Qwiery();
const services = qwiery.services;

var alex = require("alex");

exports.basic = function(test) {
    const hurts = alex("This is fucking cool. His task should have been done. <script>function alhp(){}</script>");
    test.ok(hurts.messages.length > 0);
    test.equal(hurts.messages[0].column, 9);
    test.equal(hurts.messages[0].ruleId, "fucking");
    test.done();
};

exports.profaneQuestion = function(test) {
    qwiery.askFlat("Damn you*", {userId: "Juan"}).then(function(answer) {
        test.ok(answer.indexOf("I consider the word") > -1);
        test.done();
    });
};