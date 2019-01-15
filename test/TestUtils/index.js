const utils = require("../../lib/utils");
const texturize = require("../../lib/texturize");
const Configurator = require("../../lib/Configurator");
const Instantiator = require("../../lib/Instantiator");
const eventHub = require("../../lib/eventHub");
const _ = require("lodash");
const path = require("path");

module.exports = {
    getInstantiator: function(storageType = "memory") {
        // if(utils.isDefined(currentStorage)) {
        //     return Promise.resolve(currentStorage);
        // }
        // console.log("\n\n==============================");
        // console.log(`           ${storageType}                   `);
        // console.log("==============================");
        let settings;
        if(storageType === "memory") {
            settings = {
                system: {
                    "coreServices": [
                        {
                            "name": "MemoryStorage",
                            "filePath": path.join(__dirname, `${+new Date()}.json`),
                            "autosaveInterval": 5000,
                            "autoload": true
                        }
                    ],
                    coreInterpreters: []
                }
            };

        }
        if(storageType === "mongo") {
            settings = {
                system: {
                    "coreServices": [
                        {
                            "name": "MongoStorage",
                            "connection": "mongodb://localhost:27017/QwieryDB"
                        }
                    ],
                    coreInterpreters: []
                }
            };

        }
        let conf = new Configurator(settings);
        let instantiator = new Instantiator(conf.settings);
        return new Promise(function(resolve, reject) {
            //currentStorage = instantiator.services.storage;
            if(instantiator.services.storage.isInitialized) {
                resolve(instantiator);
            } else {
                eventHub.whenPluginLoaded(storageType.toLowerCase() + "storage").then(function() {
                    resolve(instantiator);
                });
            }
        });
    }
    ,
    qa: function(question, context, qwiery) {
        if(utils.isUndefined(context)) {
            context = {userId: "Sharon"};
        }
        return qwiery.ask(question, context).then(function(out) {
            const m = texturize.extractFlat(out);
            console.log(m);
            return m;
        });
    },
    getDataType: function(session) {
        if(utils.isUndefined(session.Output.Answer)) {
            return null;
        } else if(_.isArray(session.Output.Answer)) {
            return session.Output.Answer[0].DataType;
        } else {
            return null;
        }
    }


};
