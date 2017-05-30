const repl = require("repl");
const fs = require("fs-extra");
const path = require("path");
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Qwiery = require("./index");
const texturize = require("./texturize");
const utils = require("./utils");
const colors = require('colors');
const _ = require("lodash");
const constants = Qwiery.constants;
process.on('uncaughtException', function(err) {
    console.warn(("\t" + err + "\n").qwiery);
});
colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: ['blue', 'italic'],
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red',
    qwiery: 'cyan',
    me: ['grey', 'bold']
});

/**
 * You can restore a MongoDB dump with something like
 *
 *      mongorestore --archive=/Users/Swa/Desktop/Qwiery/SampleData/QwieryDB.gz
 */

/**
 * Starts Qwiery in REPL mode.
 * Note that you can also define a configuration via a 'Qwiery.config.json' file
 * in the root of your app.
 * @param settings {any} The configuration of Qwiery.
 * @constructor
 */
function Repler(settings = {}) {
    let qwiery;
    let eventHub;
    let needConfirmation = false;
    let raw = false;
    let trace = false;
    const cleanExit = function() {
        process.exit()
    };
    process.on('SIGINT', cleanExit); // catch ctrl-c
    process.on('SIGTERM', cleanExit); // catch kill

    function restart() {
        qwiery = new Qwiery(settings);
        qwiery._replmode = true;
        eventHub = qwiery.eventHub;
        eventHub.whenPackageLoaded().then(function(name) {
            // this restarts Qwiery to load the altered settings
            restart();
        });
    }

    function say(obj) {

        if(raw === true) {
            console.log(JSON.stringify(obj, null, 5).verbose);
        } else {
            console.log(texturize.extractSimple(obj, "plain").qwiery);
        }
    }

    try {
        restart();

        console.log("\n========================================");
        console.log("\n       Qwiery " + Qwiery.version);
        console.log("\n========================================\n");

        repl.start({
            prompt: '',
            input: process.stdin,
            output: process.stdout,
            'eval': function(cmd, context, filename, callback) {
                const input = cmd.replace("\n", "");
                if(needConfirmation) {
                    const Language = Qwiery.Language;
                    if(Language.isYes(input)) {
                        restart();
                        say("Done. All reset.");
                    } else if(Language.isNo(input)) {
                        say("Okay, no reset.");
                    }
                    else {
                        say("I need your confirmation here: shall I reset (y/n)?");
                    }
                    needConfirmation = false;
                    return;
                }
                if(input === "quit" || input === "bye") {
                    say("Goodbye :)");
                    console.log("\n========================================\n");
                    process.exit(0);
                } else if(input === "restart" || input === "reset") {
                    needConfirmation = true;
                    say("Shall I reset?");
                } else if(input === "raw on") {
                    say("Raw output is turned ON.");
                    raw = true;
                } else if(input === "raw off") {
                    raw = false;
                    say("Raw output is turned OFF.");
                }
                else if(input === "trace on") {
                    say("Trace is turned ON.");
                    trace = true;
                } else if(input === "trace off") {
                    trace = false;
                    say("Trace is turned OFF.");
                }
                else {
                    qwiery.ask(input, {trace: trace}).then(function(session) {
                        say(session);
                        callback(null);
                    });
                }
            }
        });
    } catch(e) {
        console.log(e.Message || e.message);
    }
}
module.exports = Repler;