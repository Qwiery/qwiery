const path = require("path");
const utils = require("../lib/utils");
const ServiceBase = require("../lib/Framework/ServiceBase");
const CommandBase = require("../lib/Framework/CommandBase");
const fs = require('fs');
const _ = require('lodash');
const assert = require('assert');
const Instantiator = require("../lib/Instantiator");
const Configurator = require("../lib/Configurator");

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