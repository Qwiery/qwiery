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
                "Parsers",
                "Deductions",
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
                            Content: "The time is now " + new Date()
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
            "Commands",
            "Parsers",
            "Deductions",
            "Edictor"
        ]
    }
});
const services = qwiery.services,
    async = require('asyncawait/async'),
    await = require('asyncawait/await'),
    utils = require("../lib/utils"),
    constants = require("../lib/constants"),
    moment = require('moment'),

    _ = require('lodash'),
    helper = require("./TestUtils");

function makeSession(q) {
    return {
        Input: {
            Raw: q
        },
        Context: {
            userId: "Sharon",
            appId: "default"
        },
        Output: {},
        Trace: []
    };
}


const ctx = {
    userId: "Sharon"
};

exports.enjoy = function(test) {
    helper.qa("I enjoy a good movie", ctx, qwiery).then(function(answer) {
        services.personalization.getPersonalization("Like", ctx).then(function(value) {
            test.equal(value, "a good movie");
            test.done();
        });

    });
};

exports.is = function(test) {
    helper.qa("A quantum particle is a wave", ctx, qwiery).then(function() {
        services.graph.getTriplesByTitle("quantum particle", "wave", ctx).then(function(triples) {
            test.equal(triples.length, 1);
            helper.qa("what is a quantum particle", ctx, qwiery).then(function(answer) {
                console.log("|Question> " + "What is a quantum particle?");
                console.log("|Answer> " + answer);
                test.done();

            });
        });

    });
};
