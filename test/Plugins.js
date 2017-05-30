const Qwiery = require("../lib"),
    utils = require("../lib/utils"),
    path = require("path"),
    _ = require('lodash');

exports.inlineService = function(test) {

    // sample inline plugin
    let q = new Qwiery({
        plugins: [
            {
                type: "service",
                name: "MyService",
                method: function(x) {
                    return x + 1;
                }
            }
        ]
    });
    test.ok(utils.isDefined(q.services.myservice));
    test.equal(q.services.myservice.method(197), 198);

    test.done();
};