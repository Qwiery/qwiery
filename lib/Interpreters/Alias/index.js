/**
 * Rephrases things like "switch to documentation" to "set>space>Documentation workspace".
 * This mapping cannot occur in the oracle because the commands are handled prior to the oracle processing.
 */
const utils = require("../../utils"),
    InterpreterBase = require("../../Framework/InterpreterBase"),
    _ = require("lodash"),
    constants = require("../../constants");

/**
 * General idea is that the simplified statements like 'ideas' or 'tasks' means a 'get'.
 * Ultimately a full-fledged parser should be implemented but regex is OK for now.
 *
 */
const aliases = [
    //-------------------------------------------------------------------
    // agenda
    //-------------------------------------------------------------------
    {
        what: "agenda * => get>agenda>",
        rex: /^\s?(agenda\s?:?>?\s?|show agenda|display agenda)/gi,
        with: "get>agenda>"
    },
    {
        what: "add agenda * => add>agenda>",
        rex: /^\s?(add to agenda|add agenda|add to my agenda)\s?:?/gi,
        with: "add>agenda>"
    },

    //-------------------------------------------------------------------
    // tags
    //-------------------------------------------------------------------
    {
        what: "favorites> => get>tag>favorites",
        rex: /^\s?favorites\s?>?/gi,
        with: "get>tag>favorites"
    },
    {
        what: "tag * with => set>tag>",
        rex: /^\s?(?:tag )(\w+)(?: with )(\w+)/gi,
        with: function(input) {
            let r = /^\s?(?:tag )(\w+)(?: with )(\w+)/gi.exec(input);
            return `set>tag> name: ${r[2]}, id: ${r[1]}`;
        }
    },
    {
        what: "tags * => get>tags>",
        rex: /^\s?tags\s?>?/gi,
        with: "get>tags>"
    },
    {
        what: "add tag> => add>tag>",
        rex: /^\s?add tag\s?>?\s?/gi,
        with: "add>tag>"
    },
    {
        what: "tag * => get>Tag>",
        rex: /^\s?tag\s?>?/gi,
        with: "get>Tag>"
    },
    {
        what: "remove tag from => delete>tag>",
        rex: /^\s?(?:(delete|remove) tag )(\w+)(?: from )(\w+)/gi,
        with: function(input) {
            let r = /^\s?(?:(delete|remove) tag )(\w+)(?: from )(\w+)/gi.exec(input);
            return `delete>tag> name: ${r[2]}, id: ${r[3]}`;
        }
    },
    {
        what: "remove * from favorites => delete>tag>",
        rex: /^\s?(?:(delete|remove) )(\w+)(?: from (favs|favorites))/gi,
        with: function(input) {
            let r = /^\s?(?:(delete|remove) )(\w+)(?: from (favs|favorites))/gi.exec(input);
            return `delete>tag> name: favorites, id: ${r[2]}`;
        }
    },
    {
        what: "delete tag> => delete>tag>",
        rex: /^\s?delete tag\s?>?\s?/gi,
        with: "delete>tag>"
    },
    {
        what: "get tag * => get>tag>",
        rex: /^\s?get tag\s?>?\s?/gi,
        with: "get>tag>"
    },
    {
        what: "set tag * => set>tag>",
        rex: /^\s?(?:set tag )(\w+)(?: on )(\w+)/gi,
        with: function(input) {
            let r = /^\s?(?:set tag )(\w+)(?: on )(\w+)/gi.exec(input);
            return `set>tag> name: ${r[1]}, id: ${r[2]}`;
        }
    },
    {
        what: "add * to favorites => set>tag>",
        rex: /^\s?(?:add )(\w+)(?: to (favorites|favs))/gi,
        with: function(input) {
            let r = /^\s?(?:add )(\w+)(?: to (favorites|favs))/gi.exec(input);
            return `set>tag> name: favorites, id: ${r[1]}`;
        }
    },
    {
        what: "set tag * => set>tag>",
        rex: /^\s?set tag\s?>?:?/gi,
        with: "set>tag>"
    },

    //-------------------------------------------------------------------
    // diverse
    //-------------------------------------------------------------------
    {
        what: "delete> => delete>entity>",
        rex: /^\s?(delete entity|delete)\s?>?:?\s?/gi,
        with: "delete>entity>"
    },
    {
        what: "terms> => help>terms",
        rex: /^\s?terms\s?>?/gi,
        with: "help>terms"
    },
    {
        what: "help * => help>*",
        rex: /^\s?(help about|help)\s>?:?/gi,
        with: "help>"
    },
    {
        what: "version> => get>version>",
        rex: /^\s?version\s?>?/gi,
        with: "get>version>"
    },
    {
        what: "load * => load> *",
        rex: /^\s?(?:load)\s(\w+)\s?v?(\d+.\d+)?\s?(.+)?/gi,
        with: function(input) {
            let r = /^\s?(?:load)\s(\w+)\s?v?(\d+.\d+)?\s?(.+)?/gi.exec(input);
            if(r[2] === "*") {
                r[2] = undefined;
            }
            return `load> name: ${r[1]}, version: ${r[2] || ""}, address: ${r[3] || ""}`;
        }
    },
    {
        what: "learn> => set>answer>",
        rex: /^\s?(learn answer|learn this answer|the answer should be|this should be|learn)\s?:?/gi,
        with: "set>answer>"
    },

    //-------------------------------------------------------------------
    // spaces
    //-------------------------------------------------------------------
    {
        what: "spaces> => get>spaces>",
        rex: /^\s?spaces\s?>?/gi,
        with: "get>spaces>"
    },
    {
        what: "notebooks> => get>spaces>",
        rex: /^\s?notebooks\s?>?/gi,
        with: "get>spaces>"
    },
    {
        what: "add space> => add>space>",
        rex: /^\s?add space\s?>?/gi,
        with: "add>space>"
    },
    {
        what: "current space> => get>activespace>",
        rex: /^\s?(current|active) (space|workspace)\s?>?/gi,
        with: "get>activespace>"
    },
    {
        what: "set space> => set>space>",
        rex: /^\s?((set|activate) (space|workspace))|switch to\s>?/gi,
        with: "set>space>"
    },
    {
        what: "delete space> => delete>space>",
        rex: /^\s?(delete|remove) (space|workspace)\s?>?/gi,
        with: "delete>space>"
    },

    //-------------------------------------------------------------------
    // search
    //-------------------------------------------------------------------
    {
        what: "search> => search>graph>",
        rex: /^\s?search>?\s(?!graph)/gi,
        with: "search>graph>"
    },

    //-------------------------------------------------------------------
    // thoughts/ideas
    //-------------------------------------------------------------------
    {
        what: "add>idea> => add>Thought>",
        rex: /^\s?add\s?>\s?idea\s?>/gi,
        with: "add>Thought>"
    },
    {
        what: "ideas * => search>graph> term:*, type:Thought",
        rex: /^\s?ideas\s?>?/gi,
        with: "search>graph> term:*, type:Thought"
    },
    {
        what: "add idea * => add>Thought> *",
        rex: /^\s?add\sidea\s?:?>?\s?/gi,
        with: "add>Thought>"
    },

    //-------------------------------------------------------------------
    // tasks
    //-------------------------------------------------------------------
    {
        what: "add task * => add>task> *",
        rex: /^\s?add\stask\s?:?>?\s?/gi,
        with: "add>task>"
    },
    {
        what: "task> => add>Task>",
        rex: /^\s?task\s?>/gi,
        with: "add>Task>"
    },
    {
        what: "tasks * => search>graph> term:*, type:Task",
        rex: /^\s?tasks\s?>?/gi,
        with: "search>graph> term:*, type:Task"
    },

    //-------------------------------------------------------------------
    // addresses
    //-------------------------------------------------------------------
    {
        what: "add address * => add>address> *",
        rex: /^\s?add\saddress\s?:?>?\s?/gi,
        with: "add>address>"
    },
    {
        what: "address> => add>Address>",
        rex: /^\s?address\s?>/gi,
        with: "add>Address>"
    },
    {
        what: "addresses * => search>graph> term:*, type:Address",
        rex: /^\s?addresses\s?>?/gi,
        with: "search>graph> term:*, type:Address"
    },

    //-------------------------------------------------------------------
    // personalization
    //-------------------------------------------------------------------
    {
        what: "personalization> => add>personalization>",
        rex: /^\s?(add personalization|add pref)\s?:?>?/gi,
        with: "add>personalization>"
    },
    {
        what: "personalizations> => get>personalization>",
        rex: /^\s?(preferences|personalizations|prefs)\s?>?/gi,
        with: "get>personalization>"
    },
    {
        what: "add pref * => add>personalization> *",
        rex: /^\s?(add\spref|pref|add personalization)\s?:?>?\s?/gi,
        with: "add>personalization>"
    },
    {
        what: "set pref * => add>personalization> *",
        rex: /^\s?(set\spref|pref|set personalization)\s?:?>?\s?/gi,
        with: "add>personalization>"
    },

    //-------------------------------------------------------------------
    // person
    //-------------------------------------------------------------------
    {
        what: "add person * => add>person> *",
        rex: /^\s?add\sperson(\s|\s?:|\s?>)/gi,
        with: "add>person>"
    },
    {
        what: "person> => add>person>",
        rex: /^\s?person\s?>/gi,
        with: "add>Person>"
    },
    {
        what: "people * => search>graph> term:*, type:Person",
        rex: /^\s?people\s?>?/gi,
        with: "search>graph> term:*, type:Person"
    }
];
/**
 * This interpreter does not attempt to answer anything but rephrases things.
 * @class Alias
 * @tutorial Alias
 */
class Alias extends InterpreterBase {
    constructor() {
        super("alias");
    }

    processMessage(session) {
        if(session.Handled) {
            return session;
        }
        const question = session.Input.Raw;
        for(let i = 0; i < aliases.length; i++) {
            const m = aliases[i];
            if(utils.isDefined(question.match(m.rex))) {
                if(_.isFunction(m.with)) {
                    session.Input.Raw = m.with(question);
                } else {
                    session.Input.Raw = question.replace(m.rex, m.with).trim();
                }
                session.Trace.push({
                    "Module": "Alias",
                    "What": `Rephrased: ${m.what}`,
                    "Details": m.what
                });
                break;
            }
        }
        return session;
    }
}
module.exports = Alias;


