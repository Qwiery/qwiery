/**
 * Parses for YouTube, @names, #tags
 *
 * The bot configuration can specify the parsers to include. For example, specifying
 *      "parsers":["YouTube"]
 * will only parse YouTube urls.
 * Note that you need to extend the Session.toJSON method to include whatever you add to the session instance.
 */
const constants = require('../../constants'),
    utils = require("../../utils"),
    Language = require("../../Services/language"),
    _ = require('lodash'),
    InterpreterBase = require("../../Framework/InterpreterBase"),
    Datetime = require("../../Understanding/Datetime"),
    moment = require('moment');
/**
 * An interpreter which parses for dates, url's and alike.
 * It does not handle a question but augments the info about the input.
 * Important: the names of the parsers used are set in the config.parsers; parsers:["YouTube"]
 * @class Parsers
 */
class Parsers extends InterpreterBase {
    constructor() {
        super("parsers");
    }

    async processMessage(session) {
        if (session.Handled) {
            return session;
        }
        const configuration = session.BotConfiguration;
        const parsers = configuration["parsers"] || [];
        const asyncs = [];

        const that = this;

        for (let i = 0; i < parsers.length; i++) {
            const parser = parsers[i].toLowerCase();
            if (utils.isDefined(parser)) {
                if (utils.isDefined(that[parser])) {
                    asyncs.push(that[parser](session));
                } else {
                    console.warn(`Parser '${parser}' does not exist.`);
                }
            }
        }
        await (Promise.all(asyncs));
        return session;
    }

    async keywords(session) {
        try {
            session.Keywords = (await Language.getKeywords(session.Input.Raw, 1, true)).split(",");
        } catch (e) {
            session.Keywords = [];
        }
        return session;
    }

    async language(session) {
        let firstCommand = session.Input.Raw.match(/^\s?\w+\s?>/gi);

        try {
            if (utils.isDefined(firstCommand)) {
                session.Language = "Qwiery";
            } else {
                let found = await (Language.detectLanguage(session.Input.Raw));
                if (utils.isDefined(found) && found.length > 0) {
                    session.Language = found[0][0];
                }
            }
        } catch (e) {
            console.warn(e);
            session.Language = "english";
        }
        return session;
    }

    async sentiment(session) {
        try {
            session.Sentiment = await (Language.detectSentiment(session.Input.Raw));
        } catch (e) {
            session.Sentiment = 0;
        }
        return session;
    }

    youtube(session) {
        const that = this;
        return new Promise(function(resolve, reject) {
            const q = session.Input.Raw;
            const rx = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?,.\!]*).*/;
            const found = q.match(rx);
            if(utils.isDefined(found)) {
                // add the entity
                // note that without the reformatting of the url with the /embed/ there is an XSS issue
                const video = {
                    "Title": "YouTube video",
                    "DataType": constants.podType.Video,
                    "Url": "https://www.youtube.com/embed/" + found[1],
                    "Description": "",
                    "Tags": ["YouTube", "Video"]
                };
                // if graph storage, add the entity
                if(that.services.graph) {
                    that.services.graph.upsertEntity(video, session.Context).then(function() {
                        resolve(found);
                    });
                }
            } else {
                resolve(null);
            }
        });
    }

    /**
     * Parses the given input for dates.
     * @param session {Session} A Qwiery session.
     * @returns {Array<number>} An array of dates in UTC format.
     */
    dates(session) {
        session.Dates = Datetime.parse(session.Input.Raw);
        return session;
    }

    times(session) {

        return null;
    }

    tags(session) {
        //https://github.com/phuu/post-entity
        // note that entities like @name, #tag are parsed in Qwiery.js when the session is created.
    }
}

module.exports = Parsers;
