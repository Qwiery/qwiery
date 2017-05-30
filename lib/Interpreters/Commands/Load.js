const utils = require('../../utils'),
    constants = require("../../constants"),
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await'),
    _ = require("lodash"),
    CommandBase = require("../../Framework/CommandBase"),
    Executors = require("./Executors");
/**
 * Loads external plugins into Qwiery.
 * @class Loader
 */
class Loader extends CommandBase {
    constructor() {
        super("loader");
    }

    canHandle(input) {
        return utils.isDefined(input.match(/^\s?load\s?>\s?/gi));
    }

    handle(session) {
        const question = session.Input.Raw;
        const cmd = utils.getCommand(question);
        let name, version, address;
        if(cmd.HasNamedArguments) {
            name = cmd.get("name");
            version = cmd.get("version");
            address = cmd.get("address");
        } else {
            name = cmd.FirstParameter.value;
            version = null;
            address = undefined;
        }
        if(_.isNil(name) || name.trim().length === 0) {
            return Executors.messagePods("Missing the name of a package there.");
        }
        return this.services.loader.load(name, version, address)
            .then(function(info) {
                let output = `<strong>load ${cmd.FirstParameter.value}:</strong><ul>`;
                if(session.Format.toLowerCase() === "html") {
                    info.forEach(function(item) {
                        output += `<li>${item}</li>`;
                    });
                    output += "</ul>";
                } else {
                    output = `load ${cmd.FirstParameter.value}:\n\n` + info.join("\n");
                }
                return Executors.messagePods(output);
            });
    }
}
module.exports = Loader;