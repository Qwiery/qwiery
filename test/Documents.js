const path = require('path');
const utils = require('../lib/utils');
const Configurator = require('../lib/Configurator');
const Instantiator = require('../lib/Instantiator');
let settings = {
    system: {
        coreServices: [{
            'name': 'Documents',
            /**
             * Where the markdown files are located for the Documents service
             */
            'documentsDir': path.join(__dirname, '../doc/notes')
        }],
        coreInterpreters: []
    }
};
exports.sample = async function (test) {

    let conf = new Configurator(settings);
    let ins = new Instantiator(conf.settings);

    const content = ins.services.documents.getContent('Plugins');
    test.ok(utils.isDefined(content));
    test.done();

};
