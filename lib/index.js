const _ = require("lodash"),
    constants = require("./constants"),
    utils = require("./utils"),
    texturize = require("./texturize"),
    eventHub = require("./eventHub"),
    Configurator = require("./Configurator"),
    Instantiator = require("./Instantiator"),
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await'),
    pe = require('post-entity'),
    Language = require("./Services/language"),
    Session = require("./Framework/Session"),
    path = require("path"),
    fs = require("fs-extra");

/**
 * Defines a Qwiery instance.
 * @class Qwiery
 */
class Qwiery {

    /**
     * Creates an instance of Qwiery.
     * @param {any} [settings={}]
     *
     * @memberOf Qwiery
     */
    constructor(settings = {}) {

        /**
         * You can use a 'Qwiery.config.json' file configuration in the root of your app
         * if you prefer.
         */
        if(utils.isUndefined(settings) || _.keys(settings).length === 0) {
            const configPath = path.join(process.cwd(), constants.QWIERYCONFIGJSON);
            if(fs.existsSync(configPath)) {
                settings = fs.readJsonSync(configPath);
            }
        }

        /**
         * Sets the instance id.
         */
        this.id = utils.randomId();

        /**
         * The current configuration.
         * Use the config method to set this.
         */
        this._settings = null;

        // will be set once via the 'defaultApp' name in the config
        this._defaultAppId = null;

        // combine, validate, fix the config of Qwiery
        this.configurator = new Configurator(settings);
        this._settings = this.configurator.settings;

        this.instantiator = new Instantiator(this._settings);
        this.services = this.instantiator.services;
        this.interpreters = this.instantiator.interpreters;
        this.commands = this.instantiator.commands;

        // init the pipeline
        this._loadApps();
    }

    /**
     * Gets the current configuration.
     * @returns {*|null}
     */
    get settings() {
        return this._settings;
    }

    // <editor-fold desc="Access to base classes and diverse elements">

    /**
     * Gets the EventHub class.
     */
    get eventHub() {
        return eventHub;
    }

    /**
     * Gets the Language class.
     */
    static get Language() {
        return Language;
    }

    /**
     * Return the InterpreterBase class.
     * Easier to access for implementers, use 'class MyStuff extends Qwiery.InterpreterBase'.
     * @returns {InterpreterBase}
     * @constructor
     */
    static get InterpreterBase() {
        return require("./Framework/InterpreterBase");
    }

    /**
     * Return the ServiceBase class.
     * Easier to access for implementers, use 'class MyStuff extends Qwiery.ServiceBase'.
     * @returns {ServiceBase}
     * @constructor
     */
    static get ServiceBase() {
        return require("./Framework/ServiceBase");
    }

    /**
     * Return the CommandBase class.
     * Easier to access for implementers, use 'class MyStuff extends Qwiery.CommandBase'.
     * @returns {CommandBase}
     * @constructor
     */
    static get CommandBase() {
        return require("./Framework/CommandBase");
    }

    /**
     * Return the StorageBase class.
     * Easier to access for implementers, use 'class MyStuff extends Qwiery.StorageBase'.
     * @returns {StorageBase}
     * @constructor
     */
    static get StorageBase() {
        return require("./Framework/StorageBase");
    }

    /**
     * Return the StorageDomainBase class.
     * Easier to access for implementers, use 'class MyStuff extends Qwiery.StorageDomainBase'.
     * @returns {StorageDomainBase}
     * @constructor
     */
    static get StorageDomainBase() {
        return require("./Framework/StorageDomainBase");
    }

    /**
     * Return the WorkflowState class.
     * Easier to access for implementers, use 'class MyState extends Qwiery.WorkflowState'.
     * @returns {WorkflowState}
     * @constructor
     */
    static get WorkflowState() {
        return require("./Services/Workflows/WorkflowState");
    }

    static get utils() {
        return utils;
    }

    // </editor-fold>

    /**
     * Static creation of a Qwiery instance.
     * @param settings {object} The setting of this instance.
     * @returns {Qwiery}
     */
    static create(settings = {}) {
        return new Qwiery(settings);
    }

    // <editor-fold desc="Processing">


    /**
     * Returns a new session.
     * @param settings
     */
    static newSession(settings) {
        if(!_.isPlainObject(settings)) {
            settings = {
                question: settings
            }
        }
        return new Session(settings);
    }

    _getDefaultAppId() {
        if(utils.isDefined(this._defaultAppId)) {
            return this._defaultAppId;
        }
        if(utils.isUndefined(this._settings.defaultApp)) {
            throw new Error("The 'defaultApp' is not set in the configuration.");
        }
        const appName = this._settings.defaultApp;
        if(_.isString(this._settings.apps) && this._settings.apps.toLowerCase() === "all") {
            // have to fetch it from the repo
            const id = this.services.apps.getAppIdFromName(appName);
            if(utils.isUndefined(found)) {
                throw new Error("The 'defaultApp' specified does not exist in the repository ('apps' is set to 'all').");
            }
            return id;
        } else {
            const found = _.find(this._settings.apps, {name: appName});
            if(utils.isUndefined(found)) {
                throw new Error("The 'defaultApp' specified does not exist in the 'apps' collection.");
            }
            return found.id;
        }

    }

    /**
     * Creates a new session for the given input and security context.
     * @param question {String} The question asked.
     * @param settings
     * @returns {Promise<T>}
     * @see _parseForEntities
     * @private
     */
    _createNewSession(question, settings = {}) {
        const that = this;
        if(utils.isUndefined(question)) {
            throw new Error("Cannot create a session from a nil question.")
        }

        if(utils.isUndefined(settings.userId)) {
            throw new Error("Cannot create a new session from security context with a nil userId.");
        }
        const entities = settings.Entities;

        function runner() {
            if(settings.appId === undefined) {
                that._setDefaultAppId(settings);
            }
            const startTime = new Date();
            settings.question = question;
            const session = Qwiery.newSession(settings);
            session.Input.Timestamp = startTime;
            const appIdError = Qwiery.validateAppId(settings.appId, entities);
            if(appIdError !== null) {
                session.Output.Timestamp = new Date();
                session.Output.Answer = [{
                    DataType: constants.podType.Text,
                    Content: appIdError
                }];
                return session;
            }
            let configuration = null;
            if(that.services.apps) {
                configuration = waitFor(that.services.apps.getAppConfiguration(settings.appId));
            }
            if(utils.isUndefined(configuration)) {
                session.Output.Timestamp = new Date();
                session.Output.Answer = [{
                    DataType: constants.podType.Text,
                    Content: "The application you tried to contact does not exist."
                }];
                return session;
            }
            session.BotConfiguration = configuration;
            // let's give access to everyone to that info
            session.Entities = entities;
            return session;
        }

        return async(runner)();
    }

    static validateAppId(name, entities) {
        if(utils.isUndefined(name)) {
            if(entities && entities.mentions.length > 0) {
                return `You specified the '${entities.mentions}' app but it was not found.`;
            } else {
                return "Use the format 'appId > question'."
            }
        } else if(!utils.isAlphaNumeric(name)) {
            return "A bot name should contain only letters and numbers. Use the format 'appId > question'.";
        }
        return null;
    }

    /**
     * Parses the given input for hashtags, links, etc.
     * @param input {string} Any string
     * @returns {{mentions: Array, hashtags: Array, cashtags: Array, links: Array}}
     * @private
     */
    static _parseForEntities(input) {
        let entities = {
            mentions: [],
            hashtags: [],
            cashtags: [],
            links: []
        };
        const parsed = pe.entities(input);
        if(utils.isDefined(parsed) && parsed.length > 0) {
            for(let i = 0; i < parsed.length; i++) {
                const item = parsed[i];
                switch(item.type) {
                    case "link":
                        entities.links.push(item.raw);
                        break;
                    case "hashtag":
                        entities.hashtags.push(item.raw.replace("\#", ""));
                        break;
                    case "cashtag":
                        entities.cashtags.push(item.raw.replace("\\$", ""));
                        break;
                    case "mention":
                        entities.mentions.push(item.raw.replace("@", ""));
                        break;
                }
            }
        }
        return entities;
    }

    _setDefaultAppId(settings) {
        settings.appId = this._getDefaultAppId();
    }

    /***
     * Where it all starts: ask Qwiery something.
     * Things done here are global across and before the pipeline.
     * @param question {string|array<string>} One or more questions. Note that if an array is given the questions are asked in parallel.
     * @param [options = {}] {Object} Various options.
     * @param [options.userId] {String} The user identifier of the requester.
     * @param [options.return = 'session'] {String} What to return; session, simple or pods.
     * @param [options.format = 'Text'] {String} The preferred format to return; Raw, MD, Text,...
     * @param [options.trace = false] {Boolean} Whether the trace of the processing should be included in the Session.
     * @param [options.appId = null] {String} The app identifier. If none specified the defaultApp will be used as defined in the Qwiery settings.
     * @returns {Promise<String>|Promise.<Session>} A Session object or a string answer if `return` was set to `text` or an array of pods if  'return' was set to 'pods'.
     * @tutorial Ask
     */
    ask(question, options = {}) {

        const that = this;
        let settings = _.clone(options);
        let userId = settings.userId;
        let format = settings.format || "Raw";
        let ctx = {userId: userId || null};
        let toReturn = settings.return || "session";
        // many questions in one go
        if(_.isArray(question)) {
            const actions = [];
            _.forEach(question, function(q) {
                actions.push(that.ask(q, settings));
            });
            return Promise.all(actions);
        }
        // the "trace" prefix instructs to output the trace rather than the answer
        // cannot be done with a command
        let outputTrace = false;
        if(utils.isDefined(question) && /^trace\s?(:|>|\s)/gi.test(question)) {
            settings.trace = true;
            question = question.replace(/^trace\s?(:|>|\s)/gi, "");
            outputTrace = true;
        }
        // text, pods or session?
        //
        switch(toReturn.toString().toLowerCase()) {
            case "simple":
            case "plain":
            case "text":
                return new Promise(function(resolve, reject) {
                    settings.return = "session";
                    that.ask(question, settings).then(function(session) {
                        if(outputTrace) {
                            resolve(texturize.extractTrace(session, format))
                        }
                        else {
                            resolve(texturize.extractSimple(session, format))
                        }
                    });
                });
            case "pods":
            case "array":
            case "pod":
                return new Promise(function(resolve, reject) {
                    settings.return = "session";
                    that.ask(question, settings).then(function(session) {
                        if(outputTrace) {
                            resolve(texturize.extractTrace(session, format))
                        }
                        else {
                            resolve(texturize.extractPods(session, format))
                        }
                    });
                });
            case "flat":
                return new Promise(function(resolve, reject) {
                    settings.return = "session";
                    that.ask(question, settings).then(function(session) {
                        if(outputTrace) {
                            resolve(texturize.extractTrace(session, format))
                        }
                        else {
                            resolve(texturize.extractFlat(session, format))
                        }
                    });
                });
        }


        function runner() {
            if(that.settings.system.checkIdentity === true) {
                if(!that.services.identity) {
                    throw new Error("The 'checkIdentity' is true but the Identity service is not added.");
                }
                if(utils.isUndefined(settings.userId) || settings.userId.trim().length === 0) {
                    throw new Error("No security context specified.");
                }
                let exists = waitFor(that.services.identity.exists(settings.userId));
                if(!exists) {
                    throw new Error(`Specified user '${settings.userId}' does not exist.`);
                }
            } else {
                if(utils.isUndefined(settings.userId) || settings.userId.trim().length === 0) {
                    settings.userId = "Anonymous";
                }
            }
            let info;
            if(utils.isUndefined(question)) {
                let session = waitFor(that._createNewSession("", settings));
                session.Output.Answer = utils.messagePods(Language.getVariation(constants.EMPTYINPUT));
                return outputTrace ? texturize.extractTrace(session.Trace) : texturize.extractSession(session.toJSON(), format);
            }
            let cleanInput = utils.normalizeInput(question);
            if(cleanInput.length === 0) {
                let session = waitFor(that._createNewSession(cleanInput, settings));
                session.Output.Answer = utils.messagePods(Language.getVariation(constants.EMPTYINPUT));
                return outputTrace ? utils.formatTrace(session.Trace) : texturize.extractSession(session.toJSON(), format);
            }
            const entities = Qwiery._parseForEntities(cleanInput);
            let appDoesNotExist = false;
            if(utils.isUndefined(settings.appId)) {
                // the first @ matching an app will be used
                if(entities.mentions.length > 0) {
                    // check if something '@name' is mentioned
                    const foundAppNames = _.filter(entities.mentions, function(name) {
                        return that.services.apps.isExistingAppName(name);
                    });
                    if(foundAppNames.length === 0) {
                        if(settings.appId === undefined) {
                            that._setDefaultAppId(settings);
                        }
                    }
                    else {
                        const appName = foundAppNames[0];
                        // if there are multiple addressed the first one is taken, one has to make a choice somehow
                        // using it to address the bot
                        settings.appId = waitFor(that.services.apps.getAppIdFromName(appName));
                        if(utils.isUndefined(settings.appId)) {
                            appDoesNotExist = true;
                        }
                        else {
                            // the problem here is that a question starting like "@Qwiery What is the weather"
                            // needs to be rephrased without the @Qwiery or the oracle will not find the question
                            if(cleanInput.indexOf("@") === 0) {
                                cleanInput = cleanInput.substring(cleanInput.indexOf(" ") + 1);
                            }
                        }
                    }

                } else {
                    that._setDefaultAppId(settings);
                }
            }
            // post analytics if available
            if(settings.req) {
                // the getBasicInfo method is static
                info = utils.call(require("./Services/Statistics"), "getBasicInfo", null, settings.req);
                if(info) {
                    info.appId = settings.appId;
                }
            }
            else { // means the user used REPL and not HTTP
                info = {
                    url: "NA",
                    userId: settings.userId,
                    method: "NA",
                    body: JSON.stringify({question: question}),
                    ip: "NA",
                    appId: settings.appId,
                    date: new Date()
                };
            }
            utils.call(that.services.statistics, "addAskUsage", that.services.statistics, info);

            if(utils.isUndefined(settings.appId)) {
                const bsession = Qwiery.newSession({question: question, userId: settings.userId, appId: settings.appId});
                bsession.Input.Timestamp = new Date();
                bsession.Output.Answer = [{
                    DataType: constants.podType.Text,
                    Content: `The app '${settings.appId}' does not exist.`
                }];
                return texturize.extractSession(bsession.toJSON(), format);
            }
            settings.Entities = entities;
            let session = waitFor(that._createNewSession(cleanInput, settings));
            if(that.services.pipeline) {
                session = waitFor(that.services.pipeline.processMessage(session));
            } else {
                session.Output.Answer = utils.messagePods(`The pipeline service is not defined, without it I'm quite useless.`);
            }

            return outputTrace ? utils.formatTrace(session.Trace) : texturize.extractSession(session.toJSON(), format);
        }

        return async(runner)();
    }

    run(inputs, settings) {
        if(_.isString(inputs)) {
            inputs = [inputs];
        }
        if(inputs.length === 0) {
            return Promise.resolve([]);
        }
        const that = this;
        let result = [];
        return new Promise(function(resolve, reject) {
            function next() {
                if(inputs.length > 0) {
                    let input = inputs.shift();
                    that.ask(input, settings).then(function(r) {
                        result.push(r);
                        next();
                    });
                } else {
                    resolve(result);
                }
            }

            next();
        });


    }

    /**
     * Returns a simple string answer rather than an object.
     * @param question
     * @param ctx
     * @param req
     * @return {*|Promise.<T>}
     */
    askFlat(question, ctx, req) {
        let settings = {
            question: question,
            userId: ctx.userId,
            appId: ctx.appId,
            return: "flat",
            req: req
        };
        return this.ask(question, settings);
    }

    askSimple(question, ctx, req) {
        let settings = {
            question: question,
            userId: ctx.userId,
            appId: ctx.appId,
            return: "plain",
            req: req
        };
        return this.ask(question, settings);
    }

    // </editor-fold>

    _loadApps() {
        if(_.isString(this._settings.apps)) {
            // if "apps:'all'" then the storage contains the app definitions
            return;
        }
        //fetch the apps defined by their appId
        const toFetch = [];
        for(let i = 0; i < this._settings.apps.length; i++) {
            let appDef = this._settings.apps[i];

            if(_.isString(appDef)) {
                delete this._settings.apps[i];
                toFetch.push(this.services.storage.apps.getAppConfiguration(appDef));
            }
        }
        if(toFetch.length > 0) { // collect
            Promise.all(toFetch).then(function(defs) {
                // replace with the actual definition
                this._settings.apps = _.concat(this._settings.apps, defs);
            });
        }
    }

    /**
     * Returns when the plugin is instantiated and initialized.
     * @param pluginIdentifier {string} The lower-cased identifier. This is the name (internal and inline) or the path (external plugin) of the plugin lower-cased.
     * @returns {Promise}
     */
    whenPluginLoaded(pluginIdentifier) {
        return this.instantiator.whenPluginLoaded(pluginIdentifier);
    }

    /**
     * Gets the current Qwiery version.
     */
    static get version() {
        const pjson = require('../package.json');
        return pjson.version;
    }

    static repl(settings) {
        return require("./repl")(settings);
    }

    static get constants() {
        return constants;
    }

    /**
     * Saves the current Qwiery configuration settings
     * to file.
     * @param [pathToJson] {String} The path where the config should be saved. If not specified the `process.cwd()` will be used.
     */
    writeCurrentConfig(pathToJson = path.join(process.cwd(), constants.QWIERYCONFIGJSON)) {
        fs.writeJsonSync(pathToJson, this.settings);
    }
}
module.exports = Qwiery;