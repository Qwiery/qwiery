const
    utils = require('../../utils'),
    constants = require('../../constants'),
    ServiceBase = require('../../Framework/ServiceBase'),
    request = require('request'),
    fs = require("fs-extra"),
    path = require("path"),
    eventHub = require("../../eventHub"),
    _ = require('lodash');
/**
 * Downloads and installs packages.
 *
 * @class PackageLoader
 * @extends {ServiceBase}
 */
class PackageLoader extends ServiceBase {
    constructor() {
        super("loader");
    }

    /**
     * Fetches the specified package from the repo.
     * @param packageName {string} The name of the package
     * @param [version=null] {string} The specific version to fetch. If `null` the latest one will be taken.
     * @param repoUrl {string} The URL of the repository.
     * @param logger {Array<String>} A logger of the generated messages.
     * @return {Promise}
     */
    getPackage(packageName, version = null, repoUrl = null, logger = null) {
        if(_.isNil(repoUrl)) {
            if(logger) {
                logger.push("No repo URL specified.");
            }
            return Promise.resolve({
                version: null,
                path: null
            });
        }
        return new Promise(function(resolve, reject) {
            if(_.last(repoUrl) !== "/") {
                repoUrl += "/";
            }
            const opts = {
                url: repoUrl + packageName + "/" + (version || ""),
                timeout: 10000
            };
            const req = request(opts);
            req.on('response', function(res) {
                if(!_.isNil(res.headers["x-info"]) && res.headers["x-info"].toLowerCase() === "notpackageversion") {
                    if(logger) {
                        logger.push("The specified package version does not exist.");
                    }
                    resolve({
                        version: null,
                        path: null
                    });
                }
                else {
                    if(res.statusCode !== 200) {
                        if(logger) {
                            logger.push("The specified URL version does not exist.");
                        }
                        resolve({
                            version: null,
                            path: null
                        });
                    }
                    else {
                        let filename = res.headers["content-disposition"].replace("attachment; filename=", "");
                        let version = filename.split("-")[1].replace(".zip", "");
                        let packageDir = path.join(process.cwd(), constants.QWIERYPACKAGEDIR, "packages", packageName);
                        if(fs.existsSync(packageDir)) {
                            if(logger) {
                                logger.push('removed old package');
                            }
                            fs.removeSync(packageDir);
                        }
                        fs.ensureDirSync(packageDir);
                        let packageZipPath = path.join(packageDir, filename);
                        console.log("writing to " + packageZipPath);
                        let stream = fs.createWriteStream(packageZipPath);
                        stream.on("finish", function() {
                            resolve({
                                version: version,
                                path: packageZipPath
                            });
                        });
                        res.pipe(stream);
                    }
                }
            });
            req.on('error', function(error) {
                if(logger) {
                    logger.push("Could not connect to the repo, are you sure about the address?");
                }
                resolve({
                    version: null,
                    path: null
                });
            });
            req.end();
        });
    }

    /**
     * Loads the JSON files containing QTL.
     * @param oraclePath {string} The path in the package containing the templates.
     * @param logger {Array<String>} A logger of the generated messages.
     */
    loadOracle(oraclePath, logger) {
        if(logger) {
            logger.push(`loading oracles from ${oraclePath}.`);
        }
        const files = utils.getFiles(oraclePath);
        const jsons = _.filter(files, function(fn) {
            return path.extname(fn) === ".json";
        });
        const actions = [];
        for(let i = 0; i < jsons.length; i++) {
            const jsonFileName = jsons[i];
            actions.push(this.services.oracle.loadFile(path.join(oraclePath, jsonFileName)));
        }
        return Promise.all(actions).then(function(...a) {
            const total = _.sum(_.flatten(a));
            if(total === 0) {
                return "no templates were loaded or updated."
            } else if(total === 1) {
                return "one template was loaded or updated."
            } else {
                return `${total} templates were loaded or updated.`
            }
        });
    }

    /**
     * Loads the services in the package.
     * @param servicesPath {string} The path in the package containing the services.
     * @param logger {Array<String>} A logger of the generated messages.
     */
    loadServices(servicesPath, logger) {
        if(logger) {
            logger.push(`loading services from ${servicesPath}.`);
        }
        const dirs = utils.getDirectories(servicesPath);
        let fulldirs = dirs.map(function(d) {
            return {
                path: path.join(servicesPath, d)
            }
        });
        const config = fs.readJsonSync(path.join(process.cwd(), constants.QWIERYCONFIGJSON));
        config.plugins = _.uniqBy(_.concat(config.plugins, fulldirs), "path");
        fs.writeJsonSync(path.join(process.cwd(), constants.QWIERYCONFIGJSON), config);
        return `added following services: ${dirs.join(", ")}`;
    }

    /**
     * Loads the interpreters in the package.
     * @param interPath {string} The path in the package containing the interpreters.
     * @param logger {Array<String>} A logger of the generated messages.
     */
    loadInterpreters(interPath, logger) {
        if(logger) {
            logger.push(`loading interpreters from ${interPath}.`);
        }
        const dirs = utils.getDirectories(interPath);
        const fulldirs = dirs.map(function(d) {
            return {
                name: d,
                path: path.join(interPath, d)
            }
        });
        const config = fs.readJsonSync(path.join(process.cwd(), constants.QWIERYCONFIGJSON));
        config.plugins = _.uniqBy(_.concat(config.plugins, fulldirs), "path");
        config.defaults.pipeline = _.uniq(_.concat(config.defaults.pipeline, dirs));
        if(config.apps === "*") {
            logger.push("your apps specify '*', you will need to update the pipeline of each manually.")
        }
        else if(_.isArray(config.apps)) {
            _.forEach(config.apps, function(a) {
                if(utils.isDefined(a.pipeline)) {
                    a.pipeline = _.uniq(_.concat(a.pipeline, dirs));
                }
            })
        } else {
            logger.push("unexpected apps definition in settings, could not update")
        }
        fs.writeJsonSync(path.join(process.cwd(), constants.QWIERYCONFIGJSON), config);
        return `added following interpreters: ${dirs.join(", ")}`;
    }

    /**
     * Inspects the required node modules in the package and reports the ones not
     * installed in the current app.
     * @param packageDir {string} The package directory.
     * @return {*}
     */
    getMissingNodeModules(packageDir) {
        const nodeModules = utils.getDirectories("./node_modules");
        const pck = fs.readJsonSync(path.join(packageDir, "package.json"));
        const required = _.keys(pck.dependencies);
        const missing = _.difference(required, nodeModules);
        if(missing.length === 0) {
            return "all required node modules are present "
        } else {
            return `following node modules have to be installed manually: ${missing.join(", ")}`;
        }
    }

    /**
     * The main method fetching and installing a package.
     * @param packageName {string} The name of the package
     * @param [version=null] {string} The specific version to fetch. If `null` the latest one will be taken.
     * @param repoUrl {string} The URL of the repository.
     * @param [verbose=true] {boolean} Whether the details of the procedure are returned.
     */
    load(packageName, version = null, repoUrl = constants.DEFAULTREPO, verbose = true) {
        let info = [];
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getPackage(packageName, version, repoUrl, info)
                .catch(function(reason) {
                    info.push(reason);
                    reject(reason);
                })
                .then(function(r) {

                    let packageZipPath = r.path;
                    if(utils.isUndefined(packageZipPath)) {
                        resolve(verbose === true ? info : ["done"]);
                        return;
                    }
                    let version = r.version;
                    let packageDir = path.dirname(packageZipPath);
                    info.push(`package ${packageName} v${version} downloaded to '${packageDir}'.`);
                    let AdmZip = require('adm-zip');
                    const zip = new AdmZip(packageZipPath);
                    zip.extractAllToAsync(packageDir, /*overwrite*/true, function() {
                        info.push('package unpacked');
                        // ensure latest config
                        fs.writeJsonSync(path.join(process.cwd(), constants.QWIERYCONFIGJSON), that.settings);
                        const actions = [];
                        const packageDirs = utils.getDirectories(packageDir);
                        for(let i = 0; i < packageDirs.length; i++) {
                            const dirname = packageDirs[i];
                            switch(dirname.toLowerCase()) {
                                case "oracle":
                                    actions.push(that.loadOracle(path.join(packageDir, dirname)));
                                    break;
                                case "services":
                                    actions.push(that.loadServices(path.join(packageDir, dirname)));
                                    break;
                                case "interpreters":
                                    actions.push(that.loadInterpreters(path.join(packageDir, dirname)));
                                    break;
                            }
                        }
                        actions.push(that.getMissingNodeModules(packageDir));
                        Promise.all(actions).then(function(f) {
                            _.forEach(f, function(m) {
                                info.push(`${m}`);
                            });
                            // cleanup
                            fs.removeSync(packageZipPath);
                            info.push(`package '${packageName}' v${version} done.`);
                            eventHub.raisePackageLoaded(packageName);

                            resolve(verbose === true ? info : ["done"]);
                        });

                    });


                });
        });

    }

}

module.exports = PackageLoader;