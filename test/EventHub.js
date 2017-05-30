const hub = require("../lib/eventHub");
const utils = require("../lib/utils");
const fs = require("fs-extra");

exports.raise = function(test) {
    test.expect(1);
    hub.on("color", function(name) {
        test.equal(name, "red");
        test.done();
    });
    hub._raise("color", "red");
};

exports.when = function(test) {
    test.expect(1);
    hub.when("green").then(function(arg) {
        test.equal(arg, "go");
        test.done();
    });

    hub._raise("green", "go");
};
