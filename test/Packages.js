const
    utils = require('../lib/utils'),
    constants = require('../lib/constants'),
    Qwiery = require('../lib'),
    path = require('path'),
    fs = require('fs-extra'),
    _ = require('lodash');
const latency = 500;
let server;

function clearDownloadSetup() {
    console.log(`Cleaning up the temporary directory '${constants.QWIERYPACKAGEDIR}'.`);
    fs.removeSync(path.join(__dirname, '../' + constants.QWIERYPACKAGEDIR));
    fs.removeSync(path.join(__dirname, '../' + constants.QWIERYCONFIGJSON));
}

exports.setUp = function (callback) {
    // this allows to start the package server programmatically
    server = require('child_process').fork(path.join(__dirname, '../PackageServer'), {detached: true});
    callback();
};


exports.repoLogic = function (test) {
    let rootDir = path.join(__dirname, '../PackageServer/Packages');
    if (!fs.existsSync(rootDir)) {
        test.fail('This test uses some repo dir.');
    }

    function getDirectories(srcpath) {
        return fs.readdirSync(srcpath)
            .filter(file => fs.statSync(path.join(srcpath, file)).isDirectory())
    }

    function latest(dir) {
        // const fs1 = require('fs');
        let max = 0;
        let best = '';
        let dirs = getDirectories(dir);
        for (let i = 0; i < dirs.length; i++) {
            let dir = dirs[i];
            let num = parseInt(dir.replace('.', ''));
            if (num > max) {
                max = num;
                best = dir;
            }
        }
        return best;
    }

    function getter(pathname) {
        if (pathname === undefined || pathname === null) {
            throw new Error('Trying to get something undefined.');
        }
        if (!_.isString(pathname)) {
            throw new Error('Expecting a string.')
        }
        pathname = pathname.trim().toLowerCase();
        if (pathname.indexOf('./') !== 0) {
            throw new Error('Expecting a \'./\' a start of path.')
        }
        let parts = pathname.split(/\//gi);
        parts = _.filter(parts, function (x) {
            return x.length > 0;
        });

        const result = {
            type: null,
            name: null,
            path: null,
            version: null
        };
        if (parts.length > 1) {
            if (parts[1] === 'about') {
                result.type = 'md';
                result.path = path.join(rootDir, 'about');
            } else {
                let packageDir = path.join(rootDir, parts[1]);
                if (!fs.existsSync(packageDir)) {
                    result.type = 'md';
                    result.path = path.join(rootDir, 'notPackage.md');
                } else {
                    let latestVersion = latest(packageDir);
                    switch (parts.length) {
                        case 2:
                            result.type = 'zip';
                            result.name = parts[1];
                            result.path = path.join(packageDir, parts[1] + '-' + latestVersion + '.zip');
                            result.version = latestVersion;
                            break;
                        case 3:
                            let spec = parts[2].replace('.', '');
                            let specNum = parseInt(spec);
                            if (_.isNaN(specNum)) {
                                if (spec.toLowerCase() === 'about') {
                                    result.type = 'md';
                                    result.path = path.join(packageDir, latestVersion, 'README.md');
                                } else {
                                    result.type = 'md';
                                    result.path = path.join(rootDir, 'notPackageVersion.md');
                                }
                            } else {
                                let specific = path.join(packageDir, parts[2]);
                                if (!fs.existsSync(specific)) {
                                    result.type = 'md';
                                    result.path = path.join(rootDir, 'versionNotThere');
                                } else {

                                    result.type = 'zip';
                                    result.name = parts[1];
                                    result.path = path.join(packageDir, parts[1] + '-' + parts[2] + '.zip');
                                    result.version = parts[2];
                                }
                            }
                            break;
                        case 4:
                            if (parts[3] !== 'about') {
                                result.type = 'md';
                                result.path = path.join(rootDir, 'badUrl.md');
                            } else {
                                let specific = path.join(packageDir, parts[2]);
                                if (!fs.existsSync(specific)) {
                                    result.type = 'md';
                                    result.path = path.join(rootDir, 'versionNotThere');
                                } else {
                                    result.type = 'md';
                                    result.path = path.join(packageDir, parts[2], 'README.md');
                                }
                            }
                            break;
                        default:
                            result.type = 'md';
                            result.path = path.join(rootDir, 'badUrl.md');
                    }
                }
            }

        } else {
            result.type = 'md';
            result.path = path.join(rootDir, 'about');
        }
        return result;

    }

    let r = [
        './base',
        './base/about',
        './base/1.5',
        './base/1.0',
        './base/about',
        './base/1.0/about',
        './xxx',
        './',
        './about',
        './base/aa',
        './base/1.2/about/ff'

    ].map(function (x) {
        return getter(x);
    });
    let rm = r.map(function (x) {
        return x.path;
    });
    test.deepEqual(rm,
        [
            rootDir + '/base/base-1.0.zip',
            rootDir + '/base/1.0/README.md',
            rootDir + '/versionNotThere',
            rootDir + '/base/base-1.0.zip',
            rootDir + '/base/1.0/README.md',
            rootDir + '/base/1.0/README.md',
            rootDir + '/notPackage.md',
            rootDir + '/about',
            rootDir + '/about',
            rootDir + '/notPackageVersion.md',
            rootDir + '/badUrl.md',
        ]
    );
    test.done();
};

exports.about = function (test) {
    server.send('start');
    // take a bit of time to spin up the server
    setTimeout(function () {
        utils.getWebData('http://localhost:9000')
            .catch(e => console.log(e))
            .then(function (d) {
                test.equal(d.headers['x-info'], 'about');
                test.done();
            });
    }, latency);
};

exports.readme = function (test) {
    server.send('start');
    setTimeout(function () {
        utils.getWebData('http://localhost:9000/tester/about')
            .catch(e => console.log(e))
            .then(function (d) {
                test.equal(d.headers['x-info'], 'README');
                test.done();
            });
    }, latency);
};


exports.somethingNotThere = function (test) {
    server.send('start');
    // take a bit of time to spin up the server
    setTimeout(function () {
        utils.getWebData('http://localhost:9000/somethingNotThere')
            .catch(e => console.log(e))
            .then(function (d) {
                test.equal(d.headers['x-info'], 'notPackage');
                test.done();
            });
    }, latency);
};


exports.AboutSomethingNotThere = function (test) {
    server.send('start');
    setTimeout(function () {
        utils.getWebData('http://localhost:9000/somethingNotThere/about')
            .catch(e => console.log(e))
            .then(function (d) {
                test.equal(d.headers['x-info'], 'notPackage');
                test.done();
            });
    }, latency);
};

exports.baseReadme = function (test) {
    server.send('start');
    setTimeout(function () {
        utils.getWebData('http://localhost:9000/base/about')
            .catch(e => console.log(e))
            .then(function (d) {
                test.equal(d.headers['x-info'], 'README');
                test.done();
            });
    }, latency);
};

exports.lastVersion = function (test) {
    server.send('start');
    setTimeout(function () {
        utils.getWebData('http://localhost:9000/tester')
            .catch(e => console.log(e))
            .then(function (d) {
                test.equal(d.headers['x-info'], 'tester-1.1.zip');
                test.done();
            });
    }, latency);
};

exports.nonVersion = function (test) {
    server.send('start');
    setTimeout(function () {
        utils.getWebData('http://localhost:9000/tester/4.3')
            .catch(e => console.log(e))
            .then(function (d) {
                test.equal(d.headers['x-info'], 'notPackageVersion');
                test.done();
            });
    }, latency);
};

exports.olderVersion = function (test) {
    server.send('start');
    setTimeout(function () {
        utils.getWebData('http://localhost:9000/tester/1.0')
            .catch(e => console.log(e))
            .then(function (d) {
                test.equal(d.headers['x-info'], 'tester-1.0.zip');
                test.done();
            });
    }, latency);
};

exports.loadBasic = function (test) {
    server.send('start');
    clearDownloadSetup();
    setTimeout(function () {
        const qwiery = new Qwiery();
        qwiery.ask('load base', {return: 'text'}).then(function (d) {
            console.log(d);
            test.ok(fs.existsSync(path.join(__dirname, '../' + constants.QWIERYPACKAGEDIR, 'packages', 'base')));
            // ensure to remove the Qwiery.config.json otherwise the next test
            // will instantiate Qwiery with that configuration file.
            clearDownloadSetup();
            test.done();
        });
    }, 500);

};

exports.tearDown = function (callback) {
    server.send('stop');
    setTimeout(function () {
        server.kill();
        callback();
    }, 500);
};
