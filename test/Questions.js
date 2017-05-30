const Qwiery = require("../lib"),
    path = require("path"),

    fs = require("fs-extra");

const qwiery = new Qwiery({
    defaultApp: "Sam",
    apps: [
        {
            "id": "Sam",
            "name": "Sam",
            "pipeline": [
                "Alias",
                "Parsers",
                "Commands",
                "Edictor"
            ],
        },
        {
            "id": "Timy",
            "noAnswer": "I need to think about this.",
            "name": "Timy",
            "pipeline": [
                "Edictor",
                {
                    processMessage: function(session) {
                        if(session.Handled) return session;
                        session.Output.Answer = [{
                            DataType: constants.podType.Text,
                            Content: "My name is Timy and the time is now " + new Date()
                        }];
                        session.Handled = true;
                        session.Trace.push({"HandledBy": "Inline"});
                        return Promise.resolve(session);
                    }
                }
            ]
        }
    ],
    system: {
        coreServices: [
            {
                name: "MongoStorage",
                "connection": 'mongodb://localhost:27017/QwieryDB',
                "options": {}
            },
            "Graph",
            "System",
            "Apps",
            "Oracle",
            "Pipeline",
            "Personalization",
            "Topics"],
        coreInterpreters: [
            "Alias",
            "Commands",
            "Parsers",
            "Edictor"
        ]
    }
});
const services = qwiery.services,
    async = require('asyncawait/async'),
    await = require('asyncawait/await'),
    graphdb = services.graph,
    personality = services.personality,
    personalization = services.personalization,
    userTopics = services.topics,
    utils = require("../lib/utils"),
    constants = require("../lib/constants"),
    moment = require('moment'),
    ctx = {userId: "Sharon"},
    _ = require('lodash'),
    helper = require("./TestUtils");


// <editor-fold desc="Simple things">

exports.hello = function(test) {
    test.expect(1);
    helper.qa("Hello", ctx, qwiery)
        .then(function(answer) {
            test.ok(answer !== helper.noAnswer, "The hello was found.");
            test.done();
        });
};
exports.tellme = function(test) {
    test.expect(1);
    helper.qa("tell me", ctx, qwiery).then(function(answer) {
        test.ok(true);
        test.done();
    });
};
exports.tellmemore = function(test) {
    test.expect(1);
    helper.qa("tell me more", ctx, qwiery)
        .then(function(answer) {
            test.ok(true);
            test.done();
        });

}
;

exports.date = function(test) {
    test.expect(1);
    helper.qa("what is the current date", ctx, qwiery).then(function(answer) {
        test.ok(answer.indexOf("It's") > -1);
        test.done();
    });
};

exports.unknownUsername = function(test) {
    test.expect(1);
    // test the default value of the %username parameter here
    helper.qa("Unit test question 3", {userId: "NobodyKnown"}, qwiery).then(function(answer) {
        test.equal(answer, "You are unknown to me.");
        test.done();
    });
};

// </editor-fold>

// <editor-fold desc="Add entities">
exports.addTask1 = function(test) {
    test.expect(1);
    const taskName = utils.randomId();
    helper.qa("add task> " + taskName, ctx, qwiery).then(function(answer) {
        graphdb.getTasks(ctx).then(function(tasks) {
            const found = _.find(tasks, {Title: taskName});
            test.ok(utils.isDefined(found), "The task was found.");
            test.done();
        });
    });
};

exports.addTask2 = function(test) {
    test.expect(1);
    const taskName = utils.randomId();
    helper.qa("task> " + taskName, ctx, qwiery).then(function(answer) {
        graphdb.getTasks(ctx).then(function(tasks) {
            const found = _.find(tasks, {Title: taskName});
            test.ok(utils.isDefined(found), "The task was found.");
            test.done();
        });
    });

};

exports.addIdea = function(test) {
    test.expect(1);
    const thoughtName = utils.randomId();
    helper.qa("add idea: " + thoughtName, ctx, qwiery).then(function(answer) {
        graphdb.getThoughts(ctx).then(function(ideas) {
            const found = _.find(ideas, {Title: thoughtName});
            test.ok(utils.isDefined(found), "The idea was found.");
            test.done();
        });
    });

};

exports.idea = function(test) {
    test.expect(1);
    const thoughtName = utils.randomId();
    helper.qa("add idea " + thoughtName, ctx, qwiery).then(function(answer) {
        graphdb.getThoughts(ctx).then(function(ideas) {
            const found = _.find(ideas, {Title: thoughtName});
            test.ok(utils.isDefined(found), "The idea was found.");
            test.done();
        });
    });
};

exports.addPerson = function(test) {
    test.expect(1);
    const personName = utils.randomId();
    helper.qa("add person: " + personName, ctx, qwiery).then(function(answer) {
        graphdb.getPeople(ctx).then(function(people) {
            const found = _.find(people, {Title: personName});
            test.ok(utils.isDefined(found), "The person was found.");
            test.done();
        });

    });

};

exports.addAddress = function(test) {
    test.expect(1);
    const addressName = utils.randomId();
    helper.qa("add address> " + addressName, ctx, qwiery).then(function(answer) {
        graphdb.getAddresses(ctx).then(function(addresses) {
            const found = _.find(addresses, {Title: addressName});
            test.ok(utils.isDefined(found), "The address was found.");
            test.done();
        });
    });

};

exports.tasks = function(test) {
    test.expect(1);
    helper.qa("tasks", ctx, qwiery).then(function(answer) {
        test.ok(answer.indexOf(constants.GRAPHSEARCH) >= 0);
        test.done();
    });

};
// </editor-fold>

// <editor-fold desc="Deductions">
exports.atree = function(test) {
    test.expect(4);

    helper.qa("a tree is a plant", ctx, qwiery).then(function(answer) {
        graphdb.getThoughts(ctx).then(function(ideas) {
            let found = _.find(ideas, {Title: "tree"});
            test.ok(utils.isDefined(found), "The tree was found.");
            const treeId = found.Id;
            found = _.find(ideas, {Title: "plant"});
            test.ok(utils.isDefined(found), "The plant was found.");
            graphdb.getRelated(found.Id, ctx).then(function(related) {
                found = _.find(related, {Id: treeId});
                test.ok(utils.isDefined(found), "The plant is connected to the tree.");
                test.ok(found.Relationship === "is", "The semantic label is present.");
                test.done();
            });

        });

    });

};
// </editor-fold>

// <editor-fold desc="Personalization">
exports.likepizza = function(test) {
    test.expect(3);
    helper.qa("I like pizza", ctx, qwiery).then(function(answer) {
        personalization.getPersonalization("Like", ctx).then(function(like) {
            test.ok(utils.isDefined(like), "The liking was found.");
            test.equal(like, "pizza", "The pizza was found.");
            helper.qa("What do I like", ctx, qwiery).then(function(answer) {
                test.ok(answer === "You said you like pizza.");
                test.done();
            });
        });
    });
};

exports.addpersonalization = function(test) {
    test.expect(2);
    const key = utils.randomId();
    const value = utils.randomId();
    helper.qa(`Add personalization key:${key}, value: ${value} `, ctx, qwiery).then(function(answer) {
        personalization.getPersonalization(key.toLowerCase(), ctx).then(function(per) {
            test.ok(utils.isDefined(per), "The personalization was found.");
            test.equal(per, value);
            test.done();
        });
    });
};

exports.whoami = function(test) {
    test.expect(1);
    const name = utils.randomId();
    helper.qa("I am " + name, ctx, qwiery).then(function(a) {
        helper.qa("Who am I", ctx, qwiery).then(function(answer) {
            // custom user oracle answer here
            test.ok(answer === "You are the most unusual person I know.");
            test.done();
        });

    });
};
// </editor-fold>

// <editor-fold desc="Agenda">
exports.agenda = function(test) {
    test.expect(2);
    const title = utils.randomId();
    qwiery.run(["add>appointment> from: today, to: tomorrow, title: " + title, "agenda"], ctx).then(function(sessions) {
        const agenda = sessions[1].Output.Answer[0].List;
        test.ok(agenda.length > 0);
        let found = _.find(agenda, {Title: title});
        test.ok(utils.isDefined(found));
        test.done();
    });
};

// </editor-fold>

// <editor-fold desc="Personality">

exports.myuserid = function(test) {
    test.expect(1);
    helper.qa("what is my userid", ctx, qwiery).then(function(answer) {
        test.ok(answer.indexOf(ctx.userId) > 0, "This should use the system variables.");
        test.done();
    });
};

exports.whoareyou = function(test) {
    helper.qa("Who are you", ctx, qwiery).then(function(answer) {
        userTopics.getUserTopics(ctx).then(function(topics) {
            const found = _.find(topics, {Type: "qwiery"});
            test.ok(utils.isDefined(found), "The topic was found.");

            if(utils.isDefined(personality)) {
                personality.getUserPersonality(ctx).then(function(pers) {
                    test.ok(utils.isDefined(pers["Curious"]), "The personality was found.");
                    test.done();
                });
            } else {
                test.done();
            }
        });
    });

};

exports.thepersonality = function(test) {
    const perso = utils.randomId();
    helper.qa("My personality is " + perso, ctx, qwiery).then(function(answer) {
        userTopics.getUserTopics(ctx).then(function(topics) {
            let found = _.find(topics, {Type: "personality"});
            test.ok(utils.isDefined(found), "The perso was found.");
            if(utils.isDefined(personality)) {
                personality.getUserPersonality(ctx).then(function(pers) {
                    found = _.find(pers, {Type: perso});
                    test.ok(utils.isDefined(pers[perso]), "The personality was found.");
                    test.done();
                });
            } else {
                test.done();
            }

        });

    });

};
// </editor-fold>

// <editor-fold desc="Topics">
exports.thetopic = function(test) {
    test.expect(1);
    const topic = utils.randomId();
    helper.qa("The topic is " + topic, ctx, qwiery).then(function(answer) {
        userTopics.getUserTopics(ctx).then(function(topics) {
            const found = _.find(topics, {Type: topic.toLowerCase()});
            test.ok(utils.isDefined(found), "The topic was found.");
            test.done();
        });
    });
};
// </editor-fold>

// <editor-fold desc="Search">
exports.searchgraph = function(test) {
    test.expect(1);
    helper.qa("search>graph> j*", ctx, qwiery).then(function(answer) {
        test.ok(answer.indexOf(constants.GRAPHSEARCH) >= 0, "This should redirect the search to the semantic network.");
        test.done();
    });
};
// </editor-fold>

// <editor-fold desc="Apps">

exports.toTimy = function(test) {
    test.expect(1);
    // the bot specification goes via an entity here
    helper.qa("@timy What's your name?", {userId: "Sharon"}, qwiery).then(function(answer) {
        test.ok(answer.indexOf("Timy") > 0);
        test.done();
    });
};
exports.TimyKnowsOnlyTime = function(test) {
    test.expect(1);
    helper.qa("@timy What else do you know?", {userId: "Sharon"}, qwiery).then(function(answer) {
        test.ok(answer.indexOf("the time is") >= 0);
        test.done();
    });
};
// </editor-fold>

// <editor-fold desc="Parsers">

exports.youtube = function(test) {
    test.expect(1);
    helper.qa("You should watch https://www.youtube.com/watch?v=8N_tupPBtWQ, it's fun!", ctx, qwiery).then(function(answer) {
        graphdb.getTagEntities("YouTube", ctx).then(function(entities) {
            let found = false;
            for(let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                if(entity.DataType === constants.podType.Video && entity.Url === "https://www.youtube.com/embed/8N_tupPBtWQ") {
                    found = true;
                    break;
                }
            }
            test.ok(found);
            test.done();
        });
    });
};
// </editor-fold>
