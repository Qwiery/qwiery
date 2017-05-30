const Qwiery = require("../lib"),
    utils = require("../lib/utils"),
    texturize = require("../lib/texturize"),
    constants = require("../lib/constants"),
    _ = require('lodash');

const path = require("path"),
    fs = require("fs-extra");
const qwiery = new Qwiery();
const services = qwiery.services,
    graph = services.graph;
const helper = require("./TestUtils");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
const Cmd = require("../lib/Interpreters/Commands");
const Executors = require("../lib/Interpreters/Commands/Executors");


exports.repoLogic = function(test) {
    let rootDir = "/Users/Swa/Desktop/Qwiery-repo/packages";
    if(!fs.existsSync(rootDir)) {
        test.fail("This test uses some repo dir.");
    }
    function getDirectories(srcpath) {
        return fs.readdirSync(srcpath)
            .filter(file => fs.statSync(path.join(srcpath, file)).isDirectory())
    }

    function latest(dir) {
        // const fs1 = require('fs');
        let max = 0;
        let best = "";
        let dirs = getDirectories(dir);
        for(let i = 0; i < dirs.length; i++) {
            let dir = dirs[i];
            let num = parseInt(dir.replace(".", ""));
            if(num > max) {
                max = num;
                best = dir;
            }
        }
        return best;
    }

    function getter(pathname) {
        if(pathname === undefined || pathname === null) {
            throw new Error("Trying to get something undefined.");
        }
        if(!_.isString(pathname)) {
            throw new Error("Expecting a string.")
        }
        pathname = pathname.trim().toLowerCase();
        if(pathname.indexOf("./") !== 0) {
            throw new Error("Expecting a './' a start of path.")
        }
        let parts = pathname.split(/\//gi);
        parts = _.filter(parts, function(x) {
            return x.length > 0;
        });

        const result = {
            type: null,
            name: null,
            path: null,
            version: null
        };
        if(parts.length > 1) {
            if(parts[1] === "about") {
                result.type = "md";
                result.path = path.join(rootDir, "about");
            }
            else {
                let packageDir = path.join(rootDir, parts[1]);
                if(!fs.existsSync(packageDir)) {
                    result.type = "md";
                    result.path = path.join(rootDir, "notPackage.md");
                } else {
                    let latestVersion = latest(packageDir);
                    switch(parts.length) {
                        case 2:
                            result.type = "zip";
                            result.name = parts[1];
                            result.path = path.join(packageDir, parts[1] + "-" + latestVersion + ".zip");
                            result.version = latestVersion;
                            break;
                        case 3:
                            let spec = parts[2].replace(".", "");
                            let specNum = parseInt(spec);
                            if(_.isNaN(specNum)) {
                                if(spec.toLowerCase() === "about") {
                                    result.type = "md";
                                    result.path = path.join(packageDir, latestVersion, "README.md");
                                } else {
                                    result.type = "md";
                                    result.path = path.join(rootDir, "notPackageVersion.md");
                                }
                            } else {
                                let specific = path.join(packageDir, parts[2]);
                                if(!fs.existsSync(specific)) {
                                    result.type = "md";
                                    result.path = path.join(rootDir, "versionNotThere");
                                }
                                else {

                                    result.type = "zip";
                                    result.name = parts[1];
                                    result.path = path.join(packageDir, parts[1] + "-" + parts[2] + ".zip");
                                    result.version = parts[2];
                                }
                            }
                            break;
                        case 4:
                            if(parts[3] !== "about") {
                                result.type = "md";
                                result.path = path.join(rootDir, "badUrl.md");
                            } else {
                                let specific = path.join(packageDir, parts[2]);
                                if(!fs.existsSync(specific)) {
                                    result.type = "md";
                                    result.path = path.join(rootDir, "versionNotThere");
                                }
                                else {
                                    result.type = "md";
                                    result.path = path.join(packageDir, parts[2], "README.md");
                                }
                            }
                            break;
                        default:
                            result.type = "md";
                            result.path = path.join(rootDir, "badUrl.md");
                    }
                }
            }

        } else {
            result.type = "md";
            result.path = path.join(rootDir, "about");
        }
        return result;

    }

    let r = [
        "./base",
        "./base/about",
        "./base/1.5",
        "./base/1.0",
        "./base/about",
        "./base/1.0/about",
        "./xxx",
        "./",
        "./about",
        "./base/aa",
        "./base/1.2/about/ff"

    ].map(function(x) {
        return getter(x);
    });
    let rm = r.map(function(x) {
        return x.path;
    });
    test.deepEqual(rm,
        [
            rootDir + "/base/base-1.0.zip",
            rootDir + "/base/1.0/README.md",
            rootDir + "/versionNotThere",
            rootDir + "/base/base-1.0.zip",
            rootDir + "/base/1.0/README.md",
            rootDir + "/base/1.0/README.md",
            rootDir + "/notPackage.md",
            rootDir + "/about",
            rootDir + "/about",
            rootDir + "/notPackageVersion.md",
            rootDir + "/badUrl.md",
        ]
    );
    test.done();
};

exports.pos = function(test) {
    qwiery.ask("pos>All is well in the end", {return: "text"}).then(function(answer) {
        //test.ok(answer.indexOf("Qwiery Template Language") >= 0);
        test.done();
    });
};

exports.keywords = function(test) {
    qwiery.ask("keywords>http://www.qwiery.com", {return: "text"}).then(function(answer) {
        //test.ok(answer.indexOf("Qwiery Template Language") >= 0);
        test.done();
    });
};

exports.summarize = function(test) {
    qwiery.ask("summarize>http://www.qwiery.com", {return: "text"}).then(function(answer) {
        test.ok(answer.indexOf("Qwiery Template Language") >= 0);
        test.done();
    });
};

exports.lookup = function(test) {
    qwiery.ask("lookup>tangible", {return: "text"}).then(function(answer) {
        test.ok(answer.indexOf("capable of being") >= 0);
        test.done();
    });
};

exports.search = function(test) {
    qwiery.ask("search>*", {userId: "Anonymous"}).then(function(session) {
        test.ok(session.Output.Answer.length > 0);
        test.done();
    });
};

exports.setSpace = function(test) {
    qwiery.run(["add>space>room", "set> space>room", "get>space>"], {userId: "Anonymous"}).then(function(sessions) {
        test.equal(_.last(sessions).Output.Answer[0].name, "room");
        test.done();
    });
};

exports.getHelp = function(test) {
    qwiery.ask("help> qwiery", {userId: "Anonymous"}, true).then(function(answer) {
        console.log(answer);
        test.done();
    });
};

exports.deleteTag = function(test) {
    qwiery.run(["delete>tag>hello", "Y"], {userId: "Anonymous", return: "session"}).then(function(session) {
        //console.log(session.Output.Answer);
        test.done();
    });
};

exports.getSpace = function(test) {
    qwiery.ask("get>space>def", {userId: "Anonymous"}, false).then(function(session) {
        console.log(session.Output.Answer);
        test.ok(_.isArray(session.Output.Answer));
        test.equal(session.Output.Answer[0].DataType, "WorkspaceSummary");
        test.done();
    });
};

exports.addTag = function(test) {
    qwiery.ask("add>tag> stuff").then(function(session) {
        test.ok(texturize.extractSimple(session).indexOf("has been added") >= 0);
        test.equal(utils.getPodType(session), constants.podType.Text);
        test.done();
    });
};

exports.addSomething = function(test) {
    // the Alias interpreter will turn this into a Thought
    qwiery.ask("add>idea> i1").then(function(session) {
        // the whole entity is returned
        test.equal(utils.getPodType(session), "SingleEntity");
        test.equal(session.Output.Answer[0].Entity.Title, "i1");
        test.done();
    });
};

exports.getNode = function(test) {
    qwiery.run(["add>Thought> title:something, id: akada", "get> akada"], {userId: "Sharon"}).then(function(sessions) {
        // the whole entity is returned
        test.equal(utils.getPodType(sessions[1]), "Thought");
        test.equal(sessions[1].Output.Answer[0].Title, "something");
        test.done();
    });
};