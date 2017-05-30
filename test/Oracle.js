const
    Qwiery = require("../lib"),
    Oracle = require("../lib/Services/Oracle"),
    utils = require("../lib/utils"),
    _ = require('lodash'),
    path = require("path"),
    fs = require("fs-extra"),
    ctx = {userId: "Sharon"},
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await');
const qwiery = new Qwiery({
    system: {
        coreServices: [
            {
                name: "MongoStorage",
                "connection": 'mongodb://localhost:27017/QwieryDB',
                "options": {}
            }, "Oracle", "Topics"],
        coreInterpreters: []
    }
});
const services = qwiery.services,
    oracle = services.oracle,
    storage = services.storage;


exports.isFit = function(test) {
    test.ok(Oracle._isFit("This is %1", "This is working"));
    test.ok(Oracle._isFit("%1", "That's silly."));
    test.ok(Oracle._isFit("%1 will work for food.", "Anne will work for food."));
    test.ok(Oracle._isFit("All is well!", "All is well!"));
    test.ok(Oracle._isFit("Eat more %1 and %2.", "Eat more fruit and vegetables, every day."));
    test.ok(Oracle._isFit("Eat more %1 and %2 every %day_B:66.", "Eat more fruit and vegetables, every day."));
    test.ok(Oracle._isFit("Eat more %1 and %2.", "Eat more fruit and vegetables."));
    test.ok(Oracle._isFit("Eat more %1_V and %2_H.", "Eat more fruit and vegetables."));
    test.ok(Oracle._isFit("An %14_Noun:apple is a %type_Thing:fruit.", "An airplane is a wonder."));
    test.ok(!Oracle._isFit("An %14_Noun:apple is a %type_Thing:fruit.", "A bicyle is a fun thing."));
    test.ok(Oracle._isFit("%1 version %2", "What is your current version number?"));
    test.done();
};

exports.scoreFit = function(test) {
    const testsen = "Dit is zo geweldig";
    test.equal(Oracle._scoreFit("%1 geweldig", testsen), 0);
    test.equal(Oracle._scoreFit("Dit %46", testsen), 0);
    test.equal(Oracle._scoreFit("Dit is %stuff", testsen), 1 / 4);
    test.equal(Oracle._scoreFit("Dit is %9_F GewEldig", testsen), 2 / 4);
    test.equal(Oracle._scoreFit("Dit is %9_F GewEldig %6", testsen), 1 / 4);
    test.equal(Oracle._scoreFit(testsen, testsen), 4 / 4);
    test.done();
};

exports.hello = function(test) {
    const that = this;

    function runner() {
        test.expect(3);
        const session = {
            Context: {userId: "Fanny", appId: "default"},
            BotConfiguration: {categories: "*"},
            Key: {UserId: "Fanny"}
        };
        const r = waitFor(oracle.askOnce("Unit test question 1", session));
        test.ok(utils.isDefined(r));
        test.ok(r.Id === "Unit test question 1");
        test.ok(r.Template.Answer === "This is part of a testing procedure, please ignore.");
        test.done();
    }

    return async(runner)();
};


exports.noanswer = function(test) {
    const that = this;
    const session = {
        Context: {userId: "Fanny", appId: "default"},
        BotConfiguration: {categories: "*"},
        Key: {UserId: "Fanny"}
    };

    function runner() {
        test.expect(1);
        const stack = waitFor(oracle.ask("kasd;f ;aslkdjf a;sldkf", session));
        test.ok(stack.length === 0);
        test.done();
    }

    return async(runner)();
};

exports.maxRedirections = function(test) {
    const that = this;
    const session = {
        Context: {userId: "Fanny", appId: "default"},
        BotConfiguration: {categories: "*"},
        Key: {UserId: "Fanny"}
    };

    function runner() {
        test.expect(2);
        // Forces to overflow due to redirections and Qwiery will stop after 10 loops.
        const stack = waitFor(oracle.ask("Unit test question 2", session));
        test.equal(stack.length, qwiery.settings.system.maximumRedirections);
        test.ok(stack[0].Id === "STOP");
        test.done();
    }

    return async(runner)();
};

exports.findById = function(test) {
    const that = this;

    function runner() {
        test.expect(3);
        const id = "myname";
        const qtl = waitFor(oracle.findId(id));
        test.ok(utils.isDefined(qtl));
        test.ok(qtl.Id === id);
        test.ok(qtl.Category === "Personalization");
        test.done();
    }

    return async(runner)();
};

exports.learn = function(test) {
    const that = this;

    function runner() {
        test.expect(1);
        const cat = utils.randomId();
        const qtl = {
            "Id": "137",
            "Questions": "Some question",
            "Category": cat,
            "Template": {
                "Answer": "None"
            }
        };
        waitFor(oracle.learn(qtl));

        test.ok(waitFor(storage.Oracle.categoryExists(cat)));

        waitFor(storage.Oracle.deleteCategory(cat));
        test.done();
    }

    return async(runner)();
};

exports.duplicates = function(test) {

    const that = this;

    function runner() {
        let qtl = {
            Id: 112,
            Questions: "Hello %1",
            Template: {
                Answer: "Something"
            }
        };
        let found = waitFor(storage.Oracle.checkDuplicates(qtl));
        test.ok(utils.isDefined(found));
        test.ok(found.Id === "hello");

        qtl = {
            Id: 112,
            Questions: ["Hello %1", "Wel49s"],
            Template: {
                Answer: "Something"
            }
        };
        found = waitFor(storage.Oracle.checkDuplicates(qtl));
        test.ok(utils.isDefined(found));
        test.ok(found.Id === "hello");

        qtl = {
            Id: 112,
            Questions: "a5asd5a5",
            Template: {
                Answer: "Something"
            }
        };
        found = waitFor(storage.Oracle.checkDuplicates(qtl));
        test.ok(utils.isUndefined(found));
        test.done();
    }

    return async(runner)();
};

/**
 * Add/remove from the oracle store
 * @param test
 * @returns {Promise<T>}
 */
exports.addOracle = function(test) {
    const id = utils.randomId();
    const cat = utils.randomId();
    const that = this;

    function runner() {
        waitFor(storage.Oracle.addItem({
            Id: id,
            Category: cat
        }));
        let item = waitFor(storage.Oracle.findId(id));
        test.ok(utils.isDefined(item));
        test.equal(item.Id, id);
        test.ok(waitFor(storage.Oracle.categoryExists(cat)));
        const items = waitFor(storage.Oracle.getCategory(cat));
        test.ok(utils.isDefined(items) && items.length === 1);
        waitFor(storage.Oracle.removeId(id));
        item = waitFor(storage.Oracle.findId(id));
        test.ok(utils.isUndefined(item));
        test.done();
    }

    return async(runner)();

};

exports.checkDuplicates = function(test) {
    const that = this;
    const grab = utils.randomId();
    const id = utils.randomId();

    function runner() {
        waitFor(storage.Oracle.addItem({
            Id: id,
            Questions: [grab, "something else"],
            Category: "An arbitrary category here"
        }));
        let found = waitFor(storage.Oracle.checkDuplicates(grab));
        test.ok(utils.isDefined(found));
        test.equal(found.Id, id);
        waitFor(storage.Oracle.addItem({
            Id: "theotherone",
            Questions: [grab, "yet another question"],
            Category: "An arbitrary category here"
        }));
        found = waitFor(storage.Oracle.checkDuplicates({
            Questions: grab,
            Id: id
        }));
        test.ok(utils.isDefined(found));
        test.equal(found.Id, "theotherone");

        test.done();

    }

    return async(runner)();
};

exports.randomOracle = function(test) {
    const that = this;

    function runner() {
        for(let i = 0; i < 23; i++) {
            waitFor(storage.Oracle.addItem({
                Id: "Item " + i,
                Questions: "Question" + i,
                Category: "An arbitrary category here"
            }));
        }
        const found = waitFor(storage.Oracle.random());
        test.ok(utils.isDefined(found));
        console.log("Random question: " + found.Questions);
        test.done();

    }

    return async(runner)();
};

exports.upsertOracle = function(test) {
    const that = this;

    function runner() {
        const qtl = {
            Id: "Item to update",
            Questions: "Question",
            Category: "An arbitrary category here"
        };
        waitFor(storage.Oracle.upsert(qtl));
        let item = waitFor(storage.Oracle.findId(qtl.Id));
        test.ok(utils.isDefined(item));
        test.equal(item.Id, qtl.Id);
        qtl.Questions = "Changed";
        waitFor(storage.Oracle.upsert(qtl));
        item = waitFor(storage.Oracle.findId(qtl.Id));
        test.equal(item.Questions, "Changed");
        // const dup = {
        //     Id: "Item to update",
        //     Questions: "Another Question",
        //     Category: "A category"
        // };
        // test.throws(function() {
        //     await(storage.Oracle.upsert(dup));
        // }, Error);
        test.done();
    }

    return async(runner)();
};

exports.loadFile = function(test) {
    const that = this;

    function runner() {
        waitFor(storage.Oracle.loadFile(path.join(__dirname, "../SampleData", "People.json")));
        let item = waitFor(storage.Oracle.findId("BgrDlM7a5O"));
        test.ok(utils.isDefined(item));
        test.equal(item.Questions, "Who is antoine");
        test.done();
    }

    return async(runner)();
};

exports.findId = function(test) {
    const that = this;

    function runner() {
        var stack = [
            {
                Questions: "X1",
                Id: utils.randomId()
            },
            {
                Questions: ["X2", "X3"],
                Id: utils.randomId()
            }];
        waitFor(storage.Oracle.addItems(stack));
        let found = waitFor(storage.Oracle.findId(stack[0].Id));
        test.ok(utils.isDefined(found));
        test.equal(found.Questions, "X1");
        let noItem = waitFor(storage.Oracle.findId("ZZBC"));
        test.ok(utils.isUndefined(noItem));
        test.done();
    }

    return async(runner)();

};

exports.updateTemplate = function(test) {
    const that = this;
    test.expect(2);

    function runner() {
        let id = utils.randomId();

        var stack = [
            {
                Questions: ["Q1", "Q2"],
                Id: "q1q2",
                Category: "UnitTest",
                Template: {
                    Answer: "Something"
                }
            },
            {
                Questions: ["Q3"],
                Id: "q3",
                Category: "UnitTest",
                Template: {
                    Answer: "Something"
                }
            },
            {
                Questions: ["Q56564"],
                Id: id,
                Category: "Test",
                Template: {
                    Answer: "Something"
                }
            }];

        waitFor(storage.Oracle.addItems(stack));
        let found = waitFor(storage.Oracle.findId(id));
        test.ok(utils.isDefined(found));
        test.equal(found.Questions[0], "Q56564");
        test.done();
    }

    return async(runner)();

};

exports.remove = function(test) {
    const that = this;
    test.expect(2);
    var id = utils.randomId();
    var cat = utils.randomId();
    var stack = [
        {
            Questions: "X a b",
            Id: "Xab",
            Category: cat
        },
        {
            Questions: "X a c",
            Id: id,
            Category: cat
        },
        {
            Questions: "Y",
            Id: "Y3",
            Category: cat
        }];

    function runner() {
        waitFor(storage.Oracle.addItems(stack));
        waitFor(storage.Oracle.removeId(id));
        var found = waitFor(storage.Oracle.findId(id));
        test.ok(utils.isUndefined(found));
        var catitems = waitFor(storage.Oracle.getCategory(cat));
        test.equal(catitems.length, 2);
        waitFor(storage.Oracle.deleteCategory(cat));
        test.done();
    }

    return async(runner)();

};

exports.saveDeleteCategory = function(test) {
    const that = this;
    test.expect(2);

    function runner() {
        var catName = utils.randomId();
        var stack = [
            {
                Questions: "X a b",
                Id: "Xab2",
                Category: catName
            },
            {
                Questions: "X a c",
                Id: "Xac3",
                Category: catName
            },
            {
                Questions: "Y",
                Id: "Y45",
                Category: catName
            }];
        waitFor(storage.Oracle.addItems(stack));
        let wasFound = waitFor(storage.Oracle.categoryExists(catName));
        test.ok(wasFound);
        waitFor(storage.Oracle.deleteCategory(catName));
        let wasfound2 = waitFor(storage.Oracle.categoryExists(catName));
        test.ok(!wasfound2);
        test.done();
    }

    return async(runner)();

};

exports.getSubset = function(test) {
    const that = this;
    test.expect(2);

    function runner() {
        let cat = utils.randomId();
        let stack = [{

            Questions: ["What is it like to be human?"],
            Template: {
                Answer: "Something"
            },
            Category: cat
        }, {

            Questions: ["What is it like to not be human?"],
            Template: {
                Answer: "Something else"
            },
            Category: cat + "bis"
        }];
        waitFor(storage.Oracle.addItems(stack));

        let subset = waitFor(storage.Oracle.getSubset("What"));
        test.ok(subset.length > 0);
        console.log("\nThere are " + subset.length + " templates with a questions starting with 'what'.");
        let subset2 = waitFor(storage.Oracle.getSubset("What", cat));
        test.equal(subset2.length, 1);
        waitFor(storage.Oracle.deleteCategory(cat));
        test.done();

    }

    return async(runner)();

};

exports.moreDuplicates = function(test) {
    const that = this;
    test.expect(5);

    function runner() {
        var question = utils.randomId();
        let id = utils.randomId();
        var stack = [
            {
                Questions: [question, "Some other form"],
                Id: id,
                Category: "UnitTest",
                Template: {
                    Answer: "Something"
                }
            },
        ];

        waitFor(storage.Oracle.addItems(stack));

        var qtl = {
            Id: "Hello231",
            Questions: question,
            Template: {
                Answer: "Something"
            }
        };
        let found = waitFor(storage.Oracle.checkDuplicates(qtl));
        test.ok(utils.isDefined(found));
        test.ok(found.Id === id);

        qtl = {
            Id: "Hallo452",
            Questions: [question, "Wel49s"],
            Template: {
                Answer: "Something"
            }
        };
        found = waitFor(storage.Oracle.checkDuplicates(qtl));
        test.ok(utils.isDefined(found));
        test.ok(found.Id === id);

        qtl = {
            Id: "HA42342",
            Questions: "a5asd5a5",
            Template: {
                Answer: "Something"
            }
        };
        found = waitFor(storage.Oracle.checkDuplicates(qtl));
        test.ok(utils.isUndefined(found));
        test.done();
    }

    return async(runner)();

};


/*
 This is not a test but a way to reinitialize the Id's.
 */
// exports.resetIds = function(test) {
//     test.expect(0);
//     const data = JSON.parse(fs.readFileSync(oracleCorePath, 'utf8'));
//     _.forEach(data, function(q) {
//         q.Id = utils.randomId();
//     });
//     fs.writeFileSync(oracleCorePath, JSON.stringify(data), 'utf8', function(err) {
//         if(err) throw err;
//         console.log('Lexons have been saved to file.');
//     });
//     test.done();
// };
//
// exports.addUser = function(test) {
//     test.expect(0);
//     const data = JSON.parse(fs.readFileSync(oracleCorePath, 'utf8'));
//     _.forEach(data, function(q) {
//         q.UserId = "Everyone";
//     });
//     fs.writeFileSync(oracleCorePath, JSON.stringify(data), 'utf8', function(err) {
//         if(err) throw err;
//         console.log('Oracle have been saved to file.');
//     });
//     test.done();
// };

