const path = require("path");
const Documents = require("../lib/Services/Documents");
const utils = require("../lib/utils");
const Configurator = require("../lib/Configurator");
const Instantiator = require("../lib/Instantiator");
let settings = {
    system: {
        coreServices: [{
            "name": "Documents",
            /**
             * Where the markdown files are located for the Documents service
             */
            "documentsDir": path.join(__dirname, "../doc/notes")
        }],
        coreInterpreters:[]
    }
};
exports.sample = function(test) {

    let conf = new Configurator(settings);
    let ins = new Instantiator(conf.settings);

    ins.services.documents.getContent("Plugins").then(function(content) {
        test.ok(utils.isDefined(content));
        // console.log(content);
        test.done();
    });

};