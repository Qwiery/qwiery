const path = require("path");
const utils = require("../lib/utils");
const _ = require('lodash');
const Instantiator = require("../lib/Instantiator");
const Configurator = require("../lib/Configurator");
Qwiery = require('../lib');

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

exports.inliner1 = function(test) {
    let settings = {
        plugins: [
            {
                name: "Ian",
                type: "spinner",
                method(){
                }
            }
        ]
    };
    test.throws(function() {
            let conf = new Configurator(settings);
            //let ins = new Instantiator(conf.settings);
        },
        'Invalid type.'
    );
    test.done();
};

exports.inliner2 = function(test) {
    let settings = {
        plugins: [
            {
                name: "Ian",
                type: "command",
                handle(session){
                    return 148;
                },
                canHandle(input) {
                    return false;
                },
                dummy: utils.randomId()
            }
        ],
        system: {
            coreServices: [],
            coreInterpreters: []
        }
    };
    let conf = new Configurator(settings);
    let ins = new Instantiator(conf.settings);
    test.ok(utils.isDefined(ins.commands.ian));
    test.equal(ins.commands.ian.handle(), 148);
    test.done();
};


exports.helloservice = function(test) {
    let settings = {
        plugins: [
            {
                path: path.join(__dirname, "./plugins/HelloService"),
                dummy: utils.randomId()
            }
        ],
        system: {
            coreServices: [],
            coreInterpreters: []
        }
    };
    let conf = new Configurator(settings);
    let ins = new Instantiator(conf.settings);
    test.ok(utils.isDefined(ins.services.hello));
    test.equal(ins.services.hello.say(), "Hello");
    let fset = ins.services.hello.getPluginSettings();
    test.equal(fset.dummy, settings.plugins[0].dummy);
    test.done();
};

exports.randomint = function(test) {
    let settings = {
        plugins: [
            {
                path: path.join(__dirname, "./plugins/RandomIntInterpreter"),
                dummy: utils.randomId()
            }
        ],
        system: {
            coreServices: [],
            coreInterpreters: []
        }
    };
    let conf = new Configurator(settings);
    let ins = new Instantiator(conf.settings);
    test.ok(utils.isDefined(ins.interpreters.numbers));
    ins.interpreters.numbers.processMessage({}).then(function(session) {
        test.ok(_.isNumber(session.Output.Answer));
        let fset = ins.interpreters.numbers.getPluginSettings();
        test.equal(fset.dummy, settings.plugins[0].dummy);
        test.done();
    });

};
