const
    utils = require("../lib/utils"),
    constants = require("../lib/constants"),
    Qwiery = require("../lib"),
    path = require("path"),
    fs = require("fs-extra"),
    http = require('http');
const latency = 500;
let server;

function clearDownloadSetup() {
    fs.removeSync(path.join(__dirname, "../" + constants.QWIERYPACKAGEDIR));
    fs.removeSync(path.join(__dirname, "../" + constants.QWIERYCONFIGJSON));
}

exports.setUp = function(callback) {
    server = require('child_process').fork(path.join(__dirname, '../PackageServer'), {detached: true});
    callback();
};

exports.about = function(test) {
    const http = require('http');
    server.send("start");
    // take a bit of time to spin up the server
    setTimeout(function() {
        utils.getWebData('http://localhost:9000')
            .catch(e => console.log(e))
            .then(function(d) {
                test.equal(d.headers["x-info"], "about");
                test.done();
            });
    }, latency);
};

exports.readme = function(test) {
    const http = require('http');
    server.send("start");
    setTimeout(function() {
        utils.getWebData('http://localhost:9000/tester/about')
            .catch(e => console.log(e))
            .then(function(d) {
                test.equal(d.headers["x-info"], "README");
                test.done();
            });
    }, latency);
};


exports.notPackage = function(test) {
    const http = require('http');
    server.send("start");
    // take a bit of time to spin up the server
    setTimeout(function() {
        utils.getWebData('http://localhost:9000/somethingNotThere')
            .catch(e => console.log(e))
            .then(function(d) {
                test.equal(d.headers["x-info"], "notPackage");
                test.done();
            });
    }, latency);
};


exports.notPackage = function(test) {
    const http = require('http');
    server.send("start");
    setTimeout(function() {
        utils.getWebData('http://localhost:9000/somethingNotThere/about')
            .catch(e => console.log(e))
            .then(function(d) {
                test.equal(d.headers["x-info"], "notPackage");
                test.done();
            });
    }, latency);
};

exports.notPackage = function(test) {
    const http = require('http');
    server.send("start");
    setTimeout(function() {
        utils.getWebData('http://localhost:9000/base/about')
            .catch(e => console.log(e))
            .then(function(d) {
                test.equal(d.headers["x-info"], "README");
                test.done();
            });
    }, latency);
};

exports.lastVersion = function(test) {
    const http = require('http');
    server.send("start");
    setTimeout(function() {
        utils.getWebData('http://localhost:9000/tester')
            .catch(e => console.log(e))
            .then(function(d) {
                test.equal(d.headers["x-info"], "tester-1.1.zip");
                test.done();
            });
    }, latency);
};

exports.nonVersion = function(test) {
    const http = require('http');
    server.send("start");
    setTimeout(function() {
        utils.getWebData('http://localhost:9000/tester/4.3')
            .catch(e => console.log(e))
            .then(function(d) {
                test.equal(d.headers["x-info"], "notPackageVersion");
                test.done();
            });
    }, latency);
};

exports.olderVersion = function(test) {
    const http = require('http');
    server.send("start");
    setTimeout(function() {
        utils.getWebData('http://localhost:9000/tester/1.0')
            .catch(e => console.log(e))
            .then(function(d) {
                test.equal(d.headers["x-info"], "tester-1.0.zip");
                test.done();
            });
    }, latency);
};

exports.loadBasic = function(test) {
    server.send("start");
    clearDownloadSetup();
    setTimeout(function() {
        const qwiery = new Qwiery();
        qwiery.ask("load base", {return: 'text'}).then(function(d) {
            console.log(d);
            test.ok(fs.existsSync(path.join(__dirname, "../" + constants.QWIERYPACKAGEDIR, "packages", "base")));
            // ensure to remove the Qwiery.config.json otherwise the next test
            // will instantiate Qwiery with that configuration file.
            clearDownloadSetup();
            test.done();
        });
    }, 500);

};

exports.tearDown = function(callback) {
    server.send("stop");
    setTimeout(function() {
        server.kill();
        callback();
    }, 500);
};