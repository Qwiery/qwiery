const
    utils = require('../../utils'),
    constants = require('../../constants'),
    ServiceBase = require('../../Framework/ServiceBase'),
    _ = require('lodash');
const WordPOS = require('wordpos'),
    wordpos = new WordPOS();
const pos = require('pos');

/**
 * The official Penn-Treebank tags.
 */
const posPennTreebank = [
    {tag: "CC", label: "coordinating conjunction", color: "MediumSlateBlue"},
    {tag: "CD", label: "Cardinal number", color: "Plum"},
    {tag: "DT", label: "Determiner", color: "Purple"},
    {tag: "EX", label: "Existential there", color: "Salmon"},
    {tag: "FW", label: "Foreign Word", color: "Crimson"},
    {tag: "IN", label: "Preposition", color: "BlueViolet"},
    {tag: "JJ", label: "Adjective", color: "Blue"},
    {tag: "JJR", label: "Adj., comparative", color: "SlateBlue"},
    {tag: "JJS", label: "Adj., superlative", color: "DarkRed"},
    {tag: "LS", label: "List item marker", color: "Orange"},
    {tag: "MD", label: "Modal", color: "Tomato"},
    {tag: "NN", label: "Noun, sing. or mass", color: "Moccasin"},
    {tag: "NNP", label: "Proper noun, sing.", color: "SeaGreen"},
    {tag: "NNPS", label: "Proper noun, plural", color: "LightSeaGreen"},
    {tag: "NNS", label: "Noun, plural", color: "Aqua"},
    {tag: "POS", label: "Possessive ending", color: "YellowGreen"},
    {tag: "PDT", label: "Predeterminer", color: "SteelBlue"},
    {tag: "PRP$", label: "Possessive pronoun", color: "CornflowerBlue"},
    {tag: "PRP", label: "Personal pronoun", color: "DodgerBlue"},
    {tag: "RB", label: "Adverb", color: "Chocolate"},
    {tag: "RBR", label: "Adverb, comparative", color: "Bisque"},
    {tag: "RBS", label: "Adverb, superlative", color: "Sienna"},
    {tag: "RP", label: "Particle", color: "Kahki"},
    {tag: "SYM", label: "Symbol", color: "PeachPuff"},
    {tag: "TO", label: "to", color: "Yellow"},
    {tag: "UH", label: "Interjection", color: "Chartreuse"},
    {tag: "VB", label: "verb, base form", color: "Lime"},
    {tag: "VBD", label: "verb, past tense", color: "DarkGreen"},
    {tag: "VBG", label: "verb, gerund", color: "Gold"},
    {tag: "VBN", label: "verb, past part", color: "Indigo"},
    {tag: "VBP", label: "Verb, present", color: "DarkMagenta"},
    {tag: "VBZ", label: "Verb, present", color: "MediumOrchid"},
    {tag: "WDT", label: "Wh-determiner", color: "Crimson"},
    {tag: "WP", label: "Wh pronoun", color: "IndianRed"},
    {tag: "WP$", label: "Possessive-Wh", color: "FireBrick"},
    {tag: "WRB", label: "Wh-adverb", color: "DarkViolet"},
    {tag: ",", label: "Comma", color: "HotPink"},
    {tag: ".", label: "Punctuation", color: "Pink"},
    {tag: ":", label: "Mid-sent punctuation.", color: "PaleVioletRed"},
    {tag: "$", label: "Dollar sign", color: "Orchid"},
    {tag: "#", label: "Pound sign", color: "Fuchsia"},
    {tag: "\"", label: "quote", color: "Thistle"},
    {tag: "(", label: "Left paren", color: "Coral"},
    {tag: ")", label: "Right paren", color: "LawnGreen"}
];

/**
 * Diverse static language utilities.
 * @class Language
 */
class Language extends ServiceBase {
    constructor(settings) {
        super("language");
    }

    /**
     * The official Penn-Treebank tags.
     */
    static get posTags() {
        return posPennTreebank;
    }

    /***
     * Returns whether the given input is affirmative.
     * @param input {string} Any text.
     */
    static isYes(input) {
        input = input.trim().toLowerCase();
        const forms = ["yes", "y", "yeah", "yea", "sure", "duh", "yep"];
        return _.includes(forms, input);
    }

    /***
     * Returns whether the given input is negative.
     * @param input
     */
    static isNo(input) {
        input = input.trim().toLowerCase();
        const forms = ["no", "nope", "n", "nah", "no way", "nee", "nein"];
        return _.includes(forms, input);
    }

    /***
     * Returns whether the input is quit-ish.
     * @param input {string} Any text.
     * @returns {boolean}
     */
    static isQuit(input) {
        input = input.toString();
        if(utils.isUndefined(input)) {
            return false;
        }
        input = input.trim().toLowerCase();
        if(input.indexOf("forget") > -1) return true;
        const forms = ["quit", "q", "never mind", "no way"];
        return _.includes(forms, input);
    }

    /***
     * Tries to make sense of the input as true or false.
     * @param input {string} Any text.
     */
    static convertInputToBoolean(input) {
        if(utils.isUndefined(input)) {
            return null;
        }
        input = input.trim().toLowerCase();
        if(Language.isYes(input)) {
            return true;
        }
        if(Language.isNo(input)) {
            return false;
        }
        return null;
    }

    /***
     * Attempts to extract a username out of a given sentence.
     * @param input {string} Any text.
     * @returns {*}
     */
    static extractUsername(input) {
        const words = input.match(/\w+/gi);
        if(utils.isUndefined(input)) {
            return null;
        }
        if(words.length === 1) {
            return input;
        }
        const rex = [/my name is (.*?)/gi, /I\'m (.*?)/gi, /my nickname is (.*?)/gi, /I'm called (.*?)/gi, /they call me (.*?)/gi];
        _.forEach(rex, function(regex) {
            input = input.replace(regex, "");
        });
        return this.extractUsername(input);
    }

    static getVariation(type) {
        switch(type) {
            case constants.NOINPUT:
                return _.sample(
                    [
                        "No input given.",
                        "You have not given any input.",
                        "Expected some input from you here.",
                        "Can you please give some input?",
                        "Think you forgot to specify something."
                    ]
                );
                break;
            case constants.TRYAGAIN:
                return _.sample([
                    "Nope, try again.",
                    "Not correct, try again.",
                    "Argh, not the expected answer. Again please."
                ]);
                break;
            case constants.CORRECT:
                return _.sample(
                    [
                        "Your answer is correct.",
                        "Yep, good answer!",
                        "Indeed, good answer."
                    ]
                );
                break;
            case constants.YESORNO:
                return _.sample([
                    "Only 'yes' or 'no' will do here.",
                    "Hm, just try to answer with 'yes' or 'no'.",
                    "Say something like 'yeah' or 'nope' or 'yes' or 'nah'..."
                ]);
                break;
            case constants.SPECIFYNUMBER:
                return _.sample([
                    "You did not specify a number, please try again.",
                    "I need you to specify a number.",
                    "Can you please give me a number?",
                    "What about giving a number instead?",
                    "Ouch, thought I'd get a number.",
                    "That's not a number, is it?"
                ]);
                break;
            case constants.NOTEMPTYALLOWED:
                return _.sample([
                    "Sorry, empty input is not OK here.",
                    "Cannot do with no input, try again.",
                    "Can you please specify something?",
                    "That was an empty input. Try again."
                ]);
                break;
            case constants.INTERNALERROR:
                return _.sample([
                    "Sorry, but some internal logic went wrong. Cannot answer.",
                    "Argh, internal errors occured. Lost some threads here.",
                    "Things went wrong in my logic. Sorry, can't answer.",
                    "*$%^* logic mashup on this side. Grrrr."
                ]);
                break;
            case constants.DISCARDQUESTION:
                return _.sample([
                    "OK, I'll discard the question.",
                    "OK. All forgotten.",
                    "Right, let's forget about it."
                ]);
                break;
            case constants.STUBBORN:
                return _.sample([
                    "Sorry, I'm quitting here. You are stubborn.",
                    "I'll assume you don't know.",
                    "Well, you really don't give up but I do.",
                    "Try again some other time. I'm quitting at this point."
                ]);
                break;

            case constants.NODELETION:
                return _.sample([
                    "OK, nothing was deleted.",
                    "Okay, I ignore you wanted to delete something.",
                    "Right, no deletion.",
                    "Deletion ignored, no problem."
                ]);
                break;
            case constants.EMPTYINPUT:
                return _.sample([
                    "Seems like you gave me empty input.",
                    "Say again?",
                    "Try again. It seemed empty to me.",
                    "What did you say?"
                ]);
                break;
            case constants.BADCHOICE:
                return _.sample([
                    "That's not one of the options. Try again, please.",
                    "Hm, I cannot understand the choice you made there. What did you pick out?",
                    "Bad choice, try again."
                ]);
                break;
        }
        return null;
    }

    /***
     * Looks up the definition of the given word.
     * @param input {String} Any English word.
     * @returns {Promise}
     */
    static lookup(input) {
        return new Promise(function(resolve, reject) {
            wordpos.lookup(input, function(results) {
                resolve(results);
            });
        });
    }

    /***
     * Fetches whether the given input is an adjective.
     * @param input
     * @returns {Promise}
     */
    static isAdjective(input) {
        return new Promise(function(resolve, reject) {
            wordpos.isAdjective(input, function(results) {
                resolve(results);
            });
        });
    }

    /***
     * Fetches the part-of speech.
     * @param input {String} Any English sentence.
     * @returns {Promise}
     * @see [POS on Wikipedia]{@link https://en.wikipedia.org/wiki/Part-of-speech_tagging}
     * @see posTags
     */
    static getPOS(input) {
        const words = new pos.Lexer().lex(input);
        const tagger = new pos.Tagger();
        const taggedWords = tagger.tag(words);
        const results = [];
        for(let i in taggedWords) {
            const taggedWord = taggedWords[i];
            const word = taggedWord[0];
            const tag = taggedWord[1];
            const meaning = _.find(posPennTreebank, {tag: tag}) || {label: tag};

            //console.log(word + ": " + meaning.label);
            results.push({
                word: word,
                tag: tag,
                label: meaning.label,
                color: meaning.color
            });
        }
        return Promise.resolve(results);
    }

    /***
     * Fetches the singular and plural nouns. Proper nouns are not picked up by default. Note that a correct extraction of nouns from a sentences
     * needs the {@link Language.getPOS} method.
     * @param input {String} Any English string.
     * @param [includeProper=false] {Boolean} Whether the proper nouns should be included.
     * @returns {Promise}
     */
    static getNouns(input, includeProper = false) {
        return Language.getPOS(input).then(function(what) {
            return what.filter(function(x) {
                if(includeProper === true) {
                    return x.tag.indexOf("NN") === 0;
                } else {
                    return x.tag === "NNS" || x.tag === "NN";
                }
            }).map(function(x) {
                return x.word.toLowerCase();
            });
        });
    }

    static isNoun(input) {
        return new Promise(function(resolve, reject) {
            wordpos.isNoun(input, function(results) {
                resolve(results);
            });
        });
    }

    /***
     * Fetches the verbs.
     * @param input
     * @returns {Promise}
     */
    static getVerbs(input) {
        return new Promise(function(resolve, reject) {
            wordpos.getVerbs(input, function(results) {
                resolve(results);
            });
        });
    }

    /***
     * Fetches the adjectives.
     * @param input
     * @returns {Promise}
     */
    static getAdjectives(input) {
        return new Promise(function(resolve, reject) {
            wordpos.getAdjectives(input, function(results) {
                resolve(results);
            });
        });
    }

    /***
     * Fetches the adverbs.
     * @param input
     * @returns {Promise}
     */
    static getAdverbs(input) {
        return new Promise(function(resolve, reject) {
            wordpos.getAdverbs(input, function(results) {
                resolve(results);
            });
        });
    }

    /***
     * Returns synonyms of the given word.
     * @param input
     * @returns {Promise}
     */
    static synonyms(input) {
        const synonyms = require('find-synonyms');
        return new Promise(function(resolve, reject) {
            synonyms(input, 5, function(syns) {
                resolve(syns.join(", ").replace(/_/gi, " "));
            });
        })
    }

    /***
     * Returns a random word.
     * @returns {Promise}
     * @param wordType Can be All, Noun, Verb, Adjective, Adverb.
     * @param startsWith What the word should start with.
     * @param count How many to return.
     */
    static randomWords(wordType, startsWith, count = 10) {
        if(utils.isUndefined(wordType)) {
            wordType = "all";
        }
        if(utils.isUndefined(startsWith)) {
            startsWith = null;
        }
        return new Promise(function(resolve, reject) {
            const options = {
                startsWith: startsWith,
                count: count
            };
            switch(wordType.toLowerCase()) {
                case "all":
                    wordpos.rand(options, function(results) {
                        resolve(results);
                    });
                    break;
                case "noun":
                case "nouns":
                    wordpos.randNoun(options, function(results) {
                        resolve(results);
                    });
                    break;
                case "verb":
                case "verbs":
                    wordpos.randVerb(options, function(results) {
                        resolve(results);
                    });
                    break;
                case "adjective":
                case "adjectives":
                    wordpos.randAdjective(options, function(results) {
                        resolve(results);
                    });
                    break;
                case "adverb":
                case "adverbs":
                    wordpos.randAdverb(options, function(results) {
                        resolve(results);
                    });
                    break;
            }

        });
    }

    /**
     * Returns the language of the given input.
     * @param input {string} Any text.
     * @param bestMatch {boolean} If `true` the language with the highest score is returned.
     * @return {*}
     */
    static detectLanguage(input, bestMatch = false) {
        if(utils.isUndefined(input)) {
            return Promise.resolve("No input given.");
        }
        if(!_.isString(input)) {
            return Promise.resolve("Expecting string input.");
        }
        input = input.trim();
        if(utils.isUndefined(input.length === 0)) {
            return Promise.resolve("Empty input given.");
        }
        return new Promise(function(resolve, reject) {
            utils.getSiteTitle(input).then(function(content) {
                const LanguageDetect = require('languagedetect');
                const detector = new LanguageDetect();
                const detected = detector.detect(content);
                if(bestMatch === true) {
                    resolve(detected[0][0]);
                } else {
                    resolve(detected);
                }
            });
        });

    }

    /**
     * Returns the sentiment of the given input into a standard score between -3 (negative statement) and +3 (positive statement).
     * @param input {string} Any text.
     * @param inWords {boolean} Whether the sentiment score should be in words. Otherwise the standard score is returned.
     * @return {*}
     */
    static detectSentiment(input, inWords = false) {
        let words;
        const sentiment = require("sentiment");
        const r = sentiment(input);
        const score = Math.round(r.comparative, 1);
        let standardScore;
        if(score >= 1) {
            standardScore = 3;
        } else if(score > 0.5) {
            standardScore = 2;
        } else if(score > 0) {
            standardScore = 1;
        } else if(score === 0) {
            standardScore = 0;
        } else if(score > -0.5) {
            standardScore = -1;
        } else if(score >= -1) {
            standardScore = -2;
        } else {
            standardScore = -3;
        }
        if(inWords) {
            let words;
            switch(standardScore) {
                case 3:
                    words = ":blush: That's very positive statement.";
                    break;
                case 2:
                    words = ":relaxed: That's quite a positive statement.";
                    break;
                case 1:
                    words = ":relaxed: That's a moderately positive statement.";
                    break;
                case 0:
                    words = ":expressionless: That's a neutral statement.";
                    break;
                case -1:
                    words = ":unamused: That's a moderately negative statement.";
                    break;
                case -2:
                    words = ":disappointed: That's quite a negative statement.";
                    break;
                case -3:
                    words = ":rage: That's a highly negative statement.";
                    break;
            }
            return Promise.resolve(words);
        } else {
            return Promise.resolve(standardScore);
        }
    }

    /**
     * Summarizes the given string or content of the site from the given url.
     * @param input {string} Either plain text or a url.
     * @return {Promise}
     */
    static summarize(input) {
        const summary = require('node-tldr');
        return new Promise(function(resolve, reject) {
            summary.summarize(input, function(result, failure) {
                if(failure) {
                    reject(result.error);
                }
                else {
                    // console.log(result.title);
                    // console.log(result.words);
                    // console.log(result.compressFactor);
                    resolve(result.summary.join("\n"));
                }

            });
        });
    }

    /**
     * Gets synonyms of the given word.
     * @param input
     * @return {Promise}
     */
    static getSynonyms(input) {
        const synonyms = require('find-synonyms');

        return new Promise(function(resolve, reject) {
            synonyms(input, 5, function(syns) {
                resolve(syns.join(", ").replace(/_/gi, " "));
            });
        })
    }

    /***
     * Parses the text, removes stopwords, punctuation etc.
     * @param input
     * @returns {Promise}
     */
    static parse(input) {
        if(utils.isUrl(input)) {
            return Promise.resolve(("The getKeywords method does not work with URLs."));
        }
        return new Promise(function(resolve, reject) {
            resolve(wordpos.parse(input));
        });
    }

    static getKeywords(input, topicCount = 1, asString = false) {
        const lda = require('lda');
        topicCount = Math.max(Math.min(topicCount, 5), 1);
        return new Promise(function(resolve, reject) {
            if(utils.isUrl(input)) {
                utils.getSiteContent(input).then(function(content) {
                    const r = lda([content], topicCount, 5);
                    resolve(r);
                });
            } else {
                if(!_.includes([".", "!", "?"], _.last(input))) {
                    input += ".";
                }
                // Extract sentences.
                const documents = input.match(/[^\.!\?]+[\.!\?]+/g);

                // Run LDA to get terms for 5 topics (5 terms each).
                let r = lda(documents, topicCount, 5);
                if(asString === true) {
                    if(r.length === 0) {
                        r = ""
                    } else {
                        let firstTopics = r[0];
                        if(firstTopics.length === 0) {
                            r = "";
                        } else {
                            let kws = [];
                            for(let i = 0; i < firstTopics.length; i++) {
                                kws.push(firstTopics[i].term);
                            }
                            r = kws.join(", ");
                        }
                    }
                }
                resolve(r);
            }
        });
    }

    /**
     * Attempts to capture info from variations
     * @param what
     * @param from
     * @return {*}
     */
    static capture(what, from) {
        // todo: all of this has to be coupled with the reverse; given some info how to express it
        switch(what) {
            case "username":
                const variations = [
                    /(?:name is) ([^\s]+)/gi,
                    /(?:call me) ([^\s]+)/gi
                ];
                for(let i = 0; i < variations.length; i++) {
                    const rx = variations[i];
                    const works = rx.exec(from);
                    if(utils.isDefined(works)) {
                        return works[1];
                    }
                }
                return from;

            case "age":
                return from;
            default:
                return from;
        }
    }

}

module.exports = Language;