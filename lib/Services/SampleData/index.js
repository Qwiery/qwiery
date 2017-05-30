const utils = require('../../utils'),
    path = require('path'),
    fs = require('fs-extra'),
    ServiceBase = require('../../Framework/ServiceBase'),
    _ = require('lodash');
const baseDir = path.join(__dirname, "../../../SampleData");
/**
 * Gives access to the included sample data.
 * 
 * @class SampleData
 * @extends {ServiceBase}
 */
class SampleData extends ServiceBase {
    constructor(settings) {
        super(settings);
        this.pluginName = "sampleData";
        this.settings = settings;
    }

    /**
     * Returns all data for some sample users.
     * @param name
     * @returns {object} Sync method
     */
    getUser(name) {
        let data = null;
        switch(name.toLowerCase()) {
            case "sharon":
                data = fs.readJsonSync(path.join(baseDir, "Sharon.json"));
                break;
            case "anonymous":
                data = fs.readJsonSync(path.join(baseDir, "Anonymous.json"));
                break;
        }
        return data;

    }
}
/**
 * @module SampleData
 */
module.exports = SampleData;