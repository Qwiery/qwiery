const utils = require('../../utils'),
    constants = require("../../constants"),
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await'),
    _ = require("lodash"),
    CommandBase = require("../../Framework/CommandBase"),
    Executors = require("./Executors");
/**
 * Handles various language-related commands.
 * @class Language
 */
class Language extends CommandBase {
    constructor() {
        super("language");
    }

    static tryHandle(input) {
        let first = input.match(/^\s?\w+\s?>/gi);
        if(utils.isDefined(first)) {
            first = first[0].replace(">", "").trim();
            return _.includes(["language", "define", "lookup", "feeling", "feelings", "sentiment", "summarize", "summary", "synonyms", "syms", "keywords", "keys", "pos"], first);
        }
        return false;
    }

    canHandle(input) {
        return Language.tryHandle(input);
    }

    handle(session) {
        const question = session.Input.Raw;
        const cmd = utils.getCommand(question);
        const that = this;

        function runner() {
            function oneCommand(one) {
                switch(one) {

                    case "define":
                    case "lookup":
                        return waitFor(Executors.getDefinition(cmd, session, that));
                    case "sentiment":
                    case "feeling":
                    case "feelings":
                        return waitFor(Executors.getSentiment(cmd, session, that));
                    case "summarize":
                    case "summary":
                        return waitFor(Executors.getSummary(cmd, session, that));
                    case "syms":
                    case "synonyms":
                        return waitFor(Executors.getSynonyms(cmd, session, that));
                    case "keywords":
                    case "keys":
                        return waitFor(Executors.getKeywords(cmd, session, that));
                    case "pos":
                        return waitFor(Executors.getPOS(cmd, session, that));
                    default:
                        return Executors.messagePods(`Hm, somehow I did not manage to handle the language instruction '${one}' properly.`);
                }
            }

            if(cmd.Commands.length === 1) {
                if(cmd.Commands[0] === "language") {
                    // todo: do the whole thing
                    return Executors.messagePods("Eventually giving a full analysis here.");
                } else {
                    return oneCommand(cmd.Commands[0]);
                }
            } else {
                return oneCommand(cmd.Commands[1]);
            }

        }

        return async(runner)();
    }
}
module.exports = Language;