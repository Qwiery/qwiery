/*
 * Manages the file content accessed via things like
 "Template": {
 "Answer": {
 "File": "MBTI/estj"
 }
 }
 * */
const fs = require("fs-extra"),
    utils = require('../../utils'),
    path = require('path'),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
let metadata = null;
/**
 * Gives access to documents from within Qwiery.
 * 
 * @class Documents
 * @extends {ServiceBase}
 */
class Documents extends ServiceBase {
    constructor() {
        super("documents");
    }

    /***
     * Gets the actual content of the given file.
     * The file is supposed to have an extension '.md' and need
     * not be given.
     * @param file
     * @returns {*}
     */
    getContent(file) {
        if(file.indexOf(".md") > 0) {
            file = file.replace(".md", "");
        }
        let options = this.getPluginSettings();
        const filePath = path.join(options.documentsDir, file + ".md");
        if(fs.existsSync(filePath)) {
            return Promise.resolve(fs.readFileSync(filePath, 'utf8'));
        }
        else {
            return Promise.resolve();
        }
    }

    /***
     * Gets the content of a doc via the metadata.
     * @param topic
     */
    getDocTopic(topic) {
        let options = this.getPluginSettings();
        if(metadata === null) {
            if(utils.isUndefined(options.documentsDir)) {
                throw new Error("The 'Documents' plugin is set but the 'documentsDir' in the plugin configuration.");
            }
            const filePath = path.join(options.documentsDir, "index");
            metadata = fs.readJsonSync(filePath, 'utf8');
        }
        const fileNames = _.keys(metadata);
        for(let k = 0; k < fileNames.length; k++) {
            const fileName = fileNames[k];
            const aliases = metadata[fileName];
            for(let i = 0; i < aliases.length; i++) {
                const alias = aliases[i];
                if(alias.toLowerCase() === topic) {
                    return Promise.resolve(this.getContent(fileName));
                }
            }
        }
        return Promise.resolve(null);
    }
}

module.exports = Documents;