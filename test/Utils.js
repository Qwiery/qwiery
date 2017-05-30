const utils = require("../lib/utils"),
    _ = require('lodash');


exports.randomId = function(test) {
    let r = utils.randomId();
    test.equal(r.length, 10);
    r = utils.randomId(5);
    test.equal(r.length, 5);
    test.throws(function() {
        utils.randomId(0);
    }, Error);
    test.throws(function() {
        utils.randomId(-3);
    }, Error);
    test.done();
};

exports.makeChoices = function(test) {
    let j = {
        "answer": {
            "Choice": ["A", "B", "C", "D"]
        }
    };
    let r = utils.makeChoices(j);
    test.ok(_.isString(j.answer));
    j = ["A", "B", {"Choice": [1, 2, 3]}];
    j = utils.makeChoices(j);
    test.ok(_.isArray(j));
    test.ok(_.isNumber(j[2]));
    j = "something";
    test.ok(utils.makeChoices(j) === j);
    test.ok(utils.makeChoices(123) === 123);
    test.done();
};

exports.getJsonPath = function(test) {
    const j = {
        "answer": "something",
        "a": {
            "b": {
                "c": 5
            }
        }
    };
    const r = utils.getJsonPath(j, "a.b.c");
    test.equal(r, 5);
    test.done();
};

exports.getSiteTitle = function(test) {
    utils.getSiteTitle("http://www.qwiery.com").then(function(s) {
        test.equal(s, "Qwiery – Think. Listen. Understand.");
        utils.getSiteTitle("stuff").then(function(s) {
            test.equal(s, "stuff");
            test.done();
        });
    });
};

exports.getCommand = function(test) {
    let q = "add > space >  my space";
    let cmd = utils.getCommand(q);
    test.ok(!cmd.HasNamedArguments);
    test.ok(cmd.Commands.length === 2);
    test.ok(cmd.Commands[0] === "add");
    test.ok(cmd.Commands[1] === "space");
    test.ok(cmd.Parameters.length === 1);
    test.ok(cmd.Parameters[0].value === "my space");

    q = "x>  y>z> 123 456";
    cmd = utils.getCommand(q);
    test.ok(!cmd.HasNamedArguments);
    test.ok(cmd.Commands.length === 3);
    test.ok(cmd.Commands[0] === "x");
    test.ok(cmd.Commands[1] === "y");
    test.ok(cmd.Commands[2] === "z");
    test.ok(cmd.Parameters.length === 1);
    test.ok(cmd.Parameters[0].value === "123 456");

    q = "x>y>z> 123,456";
    cmd = utils.getCommand(q);
    test.ok(!cmd.HasNamedArguments);
    test.ok(cmd.Commands.length === 3);
    test.ok(cmd.Commands[0] === "x");
    test.ok(cmd.Commands[1] === "y");
    test.ok(cmd.Commands[2] === "z");
    test.ok(cmd.Parameters.length === 1);
    test.ok(cmd.Parameters[0].value === "123, 456");
    test.ok(cmd.FirstParameter.value === "123, 456");

    q = "Get> JohnField";
    cmd = utils.getCommand(q);
    test.ok(!cmd.HasNamedArguments);
    test.ok(cmd.Commands.length === 1);
    test.ok(cmd.Commands[0] === "get");
    test.ok(cmd.Parameters.length === 1);
    test.ok(cmd.FirstParameter.value === "JohnField");

    q = "sUf1> ";
    cmd = utils.getCommand(q);
    test.ok(!cmd.HasNamedArguments);
    test.ok(cmd.Commands.length === 1);
    test.ok(cmd.Commands[0] === "suf1");
    test.ok(cmd.Parameters.length === 0);
    test.ok(cmd.FirstParameter === null);

    q = "sUf1> G>";
    cmd = utils.getCommand(q);
    test.ok(!cmd.HasNamedArguments);
    test.ok(cmd.Commands.length === 2);
    test.ok(cmd.Commands[0] === "suf1");
    test.ok(cmd.Commands[1] === "g");
    test.ok(cmd.Parameters.length === 0);
    test.ok(cmd.FirstParameter === null);

    q = "sUf1> G> life, he said";
    cmd = utils.getCommand(q);
    test.ok(cmd.Commands.length === 2);
    test.ok(cmd.Commands[0] === "suf1");
    test.ok(cmd.Commands[1] === "g");
    test.ok(!cmd.HasNamedArguments);
    test.ok(cmd.Parameters.length === 1);
    test.equal(cmd.FirstParameter.value, "life, he said");

    q = "sUf1> G>http://www.abc.com";
    cmd = utils.getCommand(q);
    test.ok(cmd.Commands.length === 2);
    test.ok(cmd.Commands[0] === "suf1");
    test.ok(cmd.Commands[1] === "g");
    test.ok(!cmd.HasNamedArguments);
    test.ok(cmd.Parameters.length === 1);
    test.equal(cmd.FirstParameter.value, "http://www.abc.com");

    q = "A>B> title: game";
    cmd = utils.getCommand(q);
    test.ok(cmd.Commands.length === 2);
    test.ok(cmd.Commands[0] === "a");
    test.ok(cmd.Commands[1] === "b");
    test.ok(cmd.HasNamedArguments);
    test.ok(cmd.Parameters.length === 1);
    test.equal(cmd.FirstParameter.name, "title");
    test.equal(cmd.FirstParameter.value, "game");

    q = "A>B> title: game,";
    cmd = utils.getCommand(q);
    test.ok(cmd.Commands.length === 2);
    test.ok(cmd.Commands[0] === "a");
    test.ok(cmd.Commands[1] === "b");
    test.ok(cmd.Parameters.length === 1);
    test.ok(cmd.HasNamedArguments);
    test.equal(cmd.FirstParameter.name, "title");
    test.equal(cmd.FirstParameter.value, "game, ");

    q = "A>B> title: game, version: 23.3";
    cmd = utils.getCommand(q);
    test.ok(cmd.Commands.length === 2);
    test.ok(cmd.Commands[0] === "a");
    test.ok(cmd.Commands[1] === "b");
    test.ok(cmd.HasNamedArguments);
    test.ok(cmd.Parameters.length === 2);
    test.deepEqual(cmd.FirstParameter, {name: "title", value: "game"});
    test.deepEqual(cmd.Parameters[1], {name: "version", value: "23.3"});

    q = "A>B> title: ";
    cmd = utils.getCommand(q);
    test.ok(cmd.Commands.length === 2);
    test.ok(cmd.Commands[0] === "a");
    test.ok(cmd.Commands[1] === "b");
    test.ok(cmd.HasNamedArguments);
    test.ok(cmd.Parameters.length === 0);

    test.done();
};

exports.deepReplace = function(test) {
    var obj = {
        "a": {
            "b": 10
        },
        "c": null
    };
    utils.deepReplace(obj, 20, "a.b");
    utils.deepReplace(obj, 40, "c");
    utils.deepReplace(obj, 50, "m");
    test.equal(obj.a.b, 20);
    test.equal(obj.c, 40);
    test.ok(utils.isUndefined(obj.m));
    test.done();
};

exports.checkImplementation = function(test) {
    class Int1 {
        m1() {
        }

        m2() {
        }
    }
    class Ins1 {
        m1() {
        }
    }
    test.throws(function() {
        utils.checkImplementation(Int1, Ins1);
    }, Error, "Missing method m2.");
    class Ins2 {
        m1() {
        }

        m2() {
        }
    }

    try {
        // this one is OK
        utils.checkImplementation(Int1, Ins2);
    } catch(e) {
        console.log(e.message);
        test.fail("This class is OK.");
    }
    const Thing = {
        m1: function() {
        },
        m2: function() {
        }
    };
    try {
        // this one is also OK
        utils.checkImplementation(Int1, Thing);
    } catch(e) {
        console.log(e.message);
        test.fail("This plain object is OK.");
    }
    test.done();
};

exports.call = function(test) {
    let obj = {
        m1: function(x) {
            return x + 3;
        }
    };
    test.equal(utils.call(obj, "m1", null, 5), 8);
    test.equal(utils.call(null, "m1"), undefined);
    test.equal(utils.call(obj, "m2", null, 5, 6), undefined);
    test.done();
};

exports.getHandler = function(test) {
    let session = {
        Trace: []
    };
    test.equal(utils.getHandler(session), null);
    session.Trace.push({
        HandledBy: "Me"
    });
    test.equal(utils.getHandler(session), "Me");
    test.equal(utils.getHandler(session.Trace), "Me");

    test.done();
};

exports.getTraceItem = function(test) {
    let session = {
        Trace: []
    };
    test.equal(utils.getTraceItem(session), null);
    session.Trace.push({
        Wawa: 123
    });
    session.Trace.push({
        Popu: 456
    });
    test.equal(utils.getTraceItem(session, "Wawa"), 123);
    test.equal(utils.getTraceItem(session.Trace, "Popu"), 456);

    test.done();
};


exports.getPodType = function(test) {
    let session = {
        Output: {
            Answer: []
        }
    };
    test.equal(utils.getPodType(session), null);
    session.Output.Answer.push({DataType: "One"});
    test.equal(utils.getPodType(session), "One");
    session.Output.Answer.push({DataType: "Two"});
    test.deepEqual(utils.getPodType(session), ["One", "Two"]);
    test.done();
};

