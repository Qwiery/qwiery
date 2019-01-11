/***
 * For documentation related to the oracle module see http://www.qwiery.com/overview/the-oracle-module/
 */
const Chance = require('chance');
const chance = new Chance();

const fs = require('fs-extra'),
    utils = require('../../utils'),
    constants = require('../../constants'),
    ServiceBase = require('../../Framework/ServiceBase'),
    OracleStorage = require('./OracleStorage'),
    path = require('path'),
    _ = require('lodash');

//language=JSRegexp
const shapex = /((?=^)|\s)%\w+(\_)?(\:((\([\w,\s]+\))|\w+))?/gi;
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');

/**
 * Defines the answering based on rules and QTL.
 * @class Oracle
 * @extends ServiceBase
 */
class Oracle extends ServiceBase {

    constructor() {
        super('oracle');

    }

    init(instantiator) {
        super.init(instantiator);
        const QTL = require('../QTL');
        this.services.qtl = new QTL();
        this.oracle = new OracleStorage(this.services.storage);
        this.services.qtl.init(instantiator);
        return this.oracle.init(instantiator);
    }


    /***
     * Returns whether the template is a redirection to another question.
     * @param template
     * @returns {*|boolean}
     */
    static isTemplateRedirect(template) {
        return utils.isDefined(template.Answer.Redirect);
    }

    /**
     * Loads the given file containing one or more templates.
     * @param filePath
     * @returns {Promise.<Number>} Returns the amount of templates loaded.
     */
    loadFile(filePath) {
        return this.oracle.loadFile(filePath);
    }

    /***
     * Asks a question to the oracle and returns the stack of answer+redirects.
     * @param question {String} The current question.
     * @param session {Session} The current session.
     * @param userSpecific {Boolean} Whether the user-specific templates should be used (i.e. a userId equal to the current user).
     * @returns {Array}
     */
    ask(question, session, userSpecific) {
        const rex = /[\?,.]/gi;
        question = question.replace(rex, '').trim();
        return this.askUntilDone(question, [], session, userSpecific);
    }

    /***
     * Asks the oracle until all redirections have been handled.
     * The final answer sits in slot 0 of the stack.
     * @param question
     * @param stack
     * @param session The session.
     */
    askUntilDone(question, stack, session, userSpecific) {
        const that = this;

        function runner() {
            const oracleResponse = waitFor(that.askOnce(question, session, userSpecific));
            if (oracleResponse !== null) {
                // ensure that there is no circular redirect

                if (stack.length === (Math.max(2, Math.min(20, that.settings.system.maximumRedirections - 1)))) {
                    stack.unshift({
                        'Id': 'STOP',
                        'Questions': 'Circular terminal',
                        'Wildcards': [],
                        'Template': {'Answer': 'This question took me too far and I cannot answer it, sorry.'},
                        'Head': 'Template ' + (stack.length + 1),
                        'DataType': constants.podType.OracleStackItem
                    });
                    return stack;
                }
                const stackItem = {
                    'Id': oracleResponse.Id,
                    'Questions': oracleResponse.Questions,
                    'Wildcards': oracleResponse.Wildcards,
                    'Template': oracleResponse.Template,
                    'Head': 'Template ' + (stack.length + 1),
                    'Topics': oracleResponse.Topics,
                    'Approved': oracleResponse.Approved,
                    'Category': oracleResponse.Category,
                    'DataType': constants.podType.OracleStackItem
                };

                stack.unshift(stackItem);

                if (Oracle.isTemplateRedirect(oracleResponse.Template)) {
                    let newQuestion = oracleResponse.Template.Answer.Redirect;
                    // make an effective question from last response
                    for (let i = 0; i < oracleResponse.Wildcards.length; i++) {
                        const wildcard = oracleResponse.Wildcards[i];
                        newQuestion = newQuestion.replace(new RegExp('\\%' + wildcard.name, 'gi'), wildcard.value);
                    }
                    //http://stackoverflow.com/questions/20936486/node-js-maximum-call-stack-size-exceeded
                    stack = waitFor(that.askUntilDone(newQuestion, stack, session, userSpecific));
                }
            }
            return stack;
        }

        return async(runner)();
    }

    /***
     * Returns whether the given input fits the utterance
     * @param utterance
     * @param input The input which should be tested against the utterance.
     * @private
     */
    static _isFit(utterance, input) {
        const regex = new RegExp('^' + utterance.replace(shapex, '(.*?)') + '$', 'gi');
        const found = regex.test(input.toLowerCase());
        return found;
    }

    /***
     * Returns a score for the utterance wrt the input.
     * This assumes that the utterance fits already and helps to pick out the best matching one.
     * The score of utterance "%1" is -1 because is fits everything. Otherwise the score
     * will be in the [0,1] interval with 1 the exact match.
     * @param utterance
     * @param input
     * @returns {number}
     * @private
     */
    static _scoreFit(utterance, input) {
        input = input.trim().toLowerCase();
        if (input.length === 0 || input.match(/\S+/gi) === null || utterance.length === 0 || utterance.match(/\S+/gi) === null) {
            return 0;
        }

        const tokensCount = utterance.match(/\S+/gi).length;
        const wildcardCount = utterance.match(shapex) === null ? 0 : utterance.match(shapex).length;
        // how many words are present in both?
        // penalize the amount of wildcards, less is better
        return (tokensCount - 2 * wildcardCount) / input.match(/\S+/gi).length;
    }

    /***
     * Parses the getter for defaults and data type definitions.
     * @param getter Some string of the form %1_():() or %varname or %stuff_type or %2:44 and so on.
     * @returns {{full: *, name: string, type: string, default: string, hasExtendedDefault: boolean, hasType: boolean, hasDefault: boolean}||null}
     */
    static _getVariableParts(getter) {
        if (utils.isUndefined(getter)) {
            throw new Error('Undefined getter was given.');
        }
        // if ain't a getter
        if (!/%/gi.test(getter)) {
            return null;
        }
        const result = {
            full: getter.trim(),
            name: '',
            type: null,
            default: null,
            isEmpty: (getter.trim().length === 0),
            hasType: false,
            isSystem: false,
            isNumeric: false,
            hasExtendedType: false, // if the type is an array
            hasDefault: false,
            hasExtendedDefault: false // if the default is of the form :(some spaces in it)
        };


        let rest, parts;
        if (getter.indexOf('%%') === 0) {
            result.isSystem = true;
        }
        if (getter.indexOf(':') > 0) {
            parts = getter.split(':');
            if (parts.length > 2) {
                throw new Error('Getter \'' + getter + '\' has more than one \':\'.');
            }
            const defv = parts[1].trim();
            if (defv.length > 0) {
                result.hasExtendedDefault = defv.indexOf('(') === 0;
                result.default = parts[1].replace(/\(/gi, '').replace(/\)/gi, '');
                result.hasDefault = true;
            }
            rest = parts[0];
        } else {
            rest = getter;
        }
        if (rest.indexOf('_') > 0) {
            parts = rest.split('_');
            if (parts.length > 2) {
                throw new Error('Getter \'' + getter + '\' has more than one \'_\'.');
            }
            const t = parts[1].trim();
            if (t.length > 0) {
                result.type = t;
                if (result.type.indexOf('(') === 0) { // multiple types
                    result.type = result.type.replace(/\(/gi, '').replace(/\)/gi, '');
                    result.type = result.type.split(',');
                    // remove spaces
                    result.type = _.map(result.type, function (x) {
                        return x.trim();
                    });
                    result.hasExtendedType = true;
                }
                result.hasType = true;
            }
            rest = parts[0];
        }

        rest = rest.replace(/\%/gi, '');
        result.name = rest;
        result.isNumeric = !_.isNaN(parseInt(result.name));
        return result;
    }

    /***
     * The most used method of Qwiery.
     * @param subset
     * @param question
     * @returns {{bestScore: number, bestOption: null, bestGrab: null, exactMatch: boolean}}
     * @private
     */
    // todo: optimize as much as possible here
    static _findMatch(subset, question) {
        const result = {
            bestScore: -100, // scores are in [-1,1]
            bestOption: null,
            bestGrab: null,
            exactMatch: false
        };
        // an exact match will shortcut the search
        for (let k = 0; k < subset.length && !result.exactMatch; k++) {
            const item = subset[k];
            let grabs = item.Questions;
            if (_.isString(grabs)) {
                grabs = [grabs];
            }

            for (let i = 0; i < grabs.length; i++) {
                const grab = grabs[i];
                if (Oracle._isFit(grab, question)) {
                    // pick the best one unless it's an axact match
                    const score = Oracle._scoreFit(grab, question);
                    if (score === 1) {

                        result.bestOption = item;
                        result.bestGrab = grab;
                        result.bestScore = 1.0;
                        result.exactMatch = true; // exact match
                        break;
                    } else {
                        if (score > result.bestScore) {
                            result.bestOption = item;
                            result.bestGrab = grab;
                            result.bestScore = score;
                        }
                    }
                }
            }
        }
        return result;
    }

    /**
     * Fetches the oracle items defined in the app definition, if any.
     * The mechanism is the same as with the backend just that it takes the
     * array of the app.
     * @param appId
     * @param categories
     * @param userId
     */
    getAppOracleSubset(appId, categories, userId) {
        if (this.settings.apps === 'all' || this.settings.apps === '*') {
            return null;
        }
        const all = _.find(this.settings.apps, {id: appId}).oracle;
        if (utils.isUndefined(all) || all.length === 0) {
            return null;
        }
        if (utils.isUndefined(categories) || categories === '*' || (_.isArray(categories) && _.includes(categories, '*'))) {
            return all;
        } else {
            let filterOut = [];
            if (_.isString(categories)) {
                if (categories.indexOf(',') > 0) {
                    const cats = categories.split(',');
                    _.forEach(cats, function (c) {
                        filterOut.push(c.trim());
                    });
                } else {
                    filterOut = [categories];
                }
            } else if (_.isArray(categories)) {
                filterOut = categories;
            } else {
                throw new Error('Bot configuration is likely wrong. The \'categories\' section cannot be interpreted as an oracle filter.');
            }
            const result = [];
            _.forEach(all, function (x) {
                if (_.includes(filterOut, x.Category) && x.UserId === userId) {
                    result.push(x);
                }
            });
            return result;
        }
    }

    /***
     * The question is asked once to be resolved.
     * Note that things still fail here when a more specific question is after a generic version.
     * This is due to the for-loop and first-found exit.
     * Things are different when using an SQL-based answering system like the Qwiery Enterprise version has.
     * @param question
     * @param session
     * @param userSpecific If true this looks into the user stash only
     * @returns {*}
     */
    askOnce(question, session, userSpecific) {
        session = _.defaults(session, {BotConfiguration: {categories: '*'}});
        let subset;
        const that = this;

        function runner() {

            // the oracle array in the app replaces whatever is in the backend
            const appOracleItems = that.getAppOracleSubset(session.Context.appId, session.BotConfiguration.categories, session.Key.UserId);
            if (utils.isDefined(appOracleItems) && appOracleItems.length > 0) {
                subset = appOracleItems;
            } else {
                if (userSpecific === true) {
                    subset = waitFor(that.oracle.getSubset(question, session.BotConfiguration.categories, session.Key.UserId));
                } else {
                    subset = waitFor(that.oracle.getSubset(question, session.BotConfiguration.categories));
                }
            }
            if (utils.isUndefined(subset) || subset.length === 0) {
                return null;
            }
            // loop over the subset
            const found = Oracle._findMatch(subset, question);

            if (found.bestOption === null) return null;

            if (utils.isUndefined(found.bestOption.Template.Answer)) {
                console.warn('QTL ' + found.bestOption.Id + ' has an empty Answer.');
                return null;
            }

            const result = {
                Wildcards: [],
                Template: null,
                Id: found.bestOption.Id,
                Questions: found.bestOption.Questions,
                Category: found.bestOption.Category,
                Topics: found.bestOption.Topics,
                Approved: found.bestOption.Approved || false
            };
            const template = found.bestOption.Template;

            const statistics = that.services.statistics;
            if (utils.isDefined(statistics)) {
                // async saving is OK here
                statistics.increaseTemplateUsageCount(found.bestOption.Id);
            }


            result.Template = _.cloneDeep(template); //crucial!
            const stack = question.split(/[\s:]+/).reverse();
            const d = found.bestGrab.split(/[\s:]+/).reverse();
            let v = '';
            let t = d.pop();
            let collect = false;
            let paramName = 1;
            while (stack.length > 0) {
                const word = stack.pop();
                if (word === t) {
                    collect = false;
                    if (!utils.isNullOrEmpty(v)) {
                        if (!_.some(result.Wildcards, {name: paramName})) {
                            result.Wildcards.push({
                                name: paramName,
                                value: v.trim()
                            });
                        }
                        v = '';
                    }
                    if (d.length > 0) t = d.pop();
                    else if (stack.length > 0 && t !== '*') {
                        throw 'Matching went wrong\nQuestion> ' + question;
                    }
                } else {
                    if (t.indexOf('%') === 0) {
                        paramName = t.substring(1);
                        collect = true;
                        v += ' ' + word;
                        if (d.length > 0) t = d.pop();
                    } else {
                        if (collect) v += ' ' + word;
                        else {
                            if (d.length > 0) t = d.pop();
                            // when redirecting to a smaller grab the stack is longer
                            // else if(stack.length > 0) {
                            //     throw "Matching went wrong\nquestion> " + question + "\nGrab> " + grab;
                            // }
                        }
                    }
                }
            }
            if (!utils.isNullOrEmpty(v) && !_.some(result.Wildcards, {name: paramName})) {
                result.Wildcards.push({
                    name: paramName,
                    value: v.trim()
                });
            }
            return result;
        }

        return async(runner)();

    }

    validate(qtl) {

        const that = this;
        return new Promise(function (resolve, reject) {
            if (!qtl.Template) {
                reject(new Error('Missing Template in QTL.'));
            } else {
                if (_.isString(qtl.Template)) {
                    qtl.Template = JSON.parse(qtl.Template);
                }
                if (utils.isUndefined(qtl.Questions)) {
                    reject(new Error('Questions is not defined.'));
                }
                if (utils.isUndefined(qtl.Template)) {
                    reject(new Error('Template is not defined.'));
                }

                if (utils.isUndefined(qtl.Template.Answer)) {
                    reject(new Error('Template>Answer is not defined.'));
                }
                if (utils.isUndefined(qtl.Id)) {
                    qtl.Id = utils.randomId();
                }

                that.oracle.checkDuplicates(qtl).then(function (duplicate) {
                    if (utils.isDefined(duplicate)) {
                        const grabber = _.isString(duplicate.Questions) ? duplicate.Questions : duplicate.Questions.join(', ');
                        reject(new Error('One or more duplicates found in: ' + grabber));
                    } else {
                        resolve();
                    }
                });

            }
        });
    }

    /***
     * Upserts QTL.
     * @param qtl
     * @returns {*}
     */
    learn(qtl) {

        const that = this;

        function runner() {
            waitFor(that.validate(qtl));
            const found = utils.isDefined(qtl.Id) ? waitFor(that.findId(qtl.Id)) : null;
            qtl = {
                Id: qtl.Id || -1,
                Questions: _.isString(qtl.Questions) ? [qtl.Questions] : qtl.Questions,
                Template: qtl.Template,
                Topics: qtl.Topics || [],
                UserId: qtl.UserId || 'Everyone',
                Category: qtl.Category || 'Diverse',
                Approved: true
            };

            if (utils.isDefined(found)) {
                const previousCategory = found.Category;
                let previousQuestions = found.Questions;
                if (_.isString(previousQuestions)) {
                    previousQuestions = [previousQuestions];
                }
                // remove from indices
                const removeFrom = _.difference(previousQuestions, qtl.Questions);
                if (removeFrom.length > 0) {
                    _.forEach(removeFrom, function (q) {
                        that.oracle.removeFromIndex(q);
                    })
                }
                // add to indices
                const addTo = _.difference(qtl.Questions, previousQuestions);
                if (addTo.length > 0) {
                    _.forEach(addTo, function (q) {
                        that.oracle.addToIndex(q);
                    })
                }
                // change category if needed
                if (previousCategory !== qtl.Category) {
                    waitFor(that.oracle.changeCategory(found, previousCategory, qtl.Category));
                }
                // update data
                found.Questions = qtl.Questions.map(function (q) {
                    return utils.normalizeInput(q);
                });

                found.Template = _.cloneDeep(qtl.Template);
                found.Topics = qtl.Topics;
                found.UserId = qtl.UserId;
                found.Category = qtl.Category;
                found.Approved = true;
                delete found.Keys;
                waitFor(found.save());
            } else {
                qtl.Questions = qtl.Questions.map(function (q) {
                    return utils.normalizeInput(q);
                });
                waitFor(that.oracle.addItem(qtl));
            }

            // merge the topics

            that.services.topics.mergeStandardTopics(qtl.Topics);
            //oracle.saveCategory(qtl.Category);
            return qtl.Id;
        }

        return async(runner)();
    }

    /***
     * This does not look up user-specific questions.
     * @param grab
     * @returns {*|boolean}
     */
    exists(grab) {
        return utils.isDefined(this.findQuestion(grab));
    }

    random() {
        return oracle.random();
    }

    findQuestion(question) {
        const subset = oracle.getSubset(question);
        return _.find(subset, function (qtl) {
            if (_.isString(qtl.Questions)) {
                return qtl.Questions === question;
            } else {
                for (let i = 0; i < qtl.Questions.length; i++) {
                    if (qtl.Questions[i] === question)
                        return true
                }
                return false;
            }
        });
    }

    /***
     * Find the specified id.
     * @param id
     * @returns {*}
     */
    findId(id) {
        return this.oracle.findId(id);
    }

    saveAppDataset(dataset, appId) {
        return this.oracle.saveAppDataset(dataset, appId);
    }

    randomNouns(size) {
        return new Promise(function (resolve, reject) {
            if (size === undefined) {
                size = 10;
            }
            const lang = require('../Language/');
            lang.randomWords('Noun', null, size).then(function (ar) {
                resolve(ar.join(', ').replace(/_/gi, ' '));
            });
        });
    }

    randomContent(question) {
        const pod = {
            'Content': chance.sentence(),
            'DataType': constants.podType.Text
        };
        const result = this.makeSession(pod);
        result.Input.Raw = question;
        return result;
    }
}

/**
 * @module Oracle
 */
module.exports = Oracle;
