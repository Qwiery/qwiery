const fs = require('fs-extra'),
    utils = require('../../utils'),
    constants = require('../../constants'),
    ServiceBase = require('../../Framework/ServiceBase'),
    OracleService = require('../Oracle'),
    path = require('path'),
    _ = require('lodash');
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');

const parser = require('./prattparser');

const moment = require('moment');

const keywords = ['%eval', '%if', '%rand', '%join', '%service', '%entity'];
const DATEEXPR = /([0-9]+ *d(ays?)?)? *([0-9]+ *h(ours?)?)? *([0-9]+ *m(in(utes?)?)?)?/;
const freeVariableRegx = /(%+)\w+(\_)?(\:((\([\w,\s]+\))|\w+))?/gi;
const normalRegx = /%{(.*)}/gmi;
const systemRegx = /(\%{2})\w+/gi;

/**
 * Transforms QTL.
 */
class Mutator {

    /**
     * Gateway to transforming a template.
     * @param _template A template.
     * @param _context The context through which externals can be resolved.
     * @returns {*|*}
     */
    static mutate(_template, _context = {}) {

        const template = _.clone(_template);
        const context = _context;//_.clone(_context);
        const ctx = Mutator._attachArrayAccessor(context);
        return Mutator._render(template, ctx);
    }

    static safeEval(src, context) {
        return parser.parse(src, context);
    }

    /**
     * Converts the given data into a context object
     * where array-values can be accessed.
     * @example
     * // this data
     * {a:3, b:[1,2]}
     * // will give a context object
     * {%a:3, %b: i=> [1,2][i], %b: [1,2]}
     * @param data Some data blob
     * @param ctx The context which will be augmented.
     * @private
     */
    static _attachArrayAccessor(data, ctx = {}) {

        _.forOwn(data, function (value, key) {
            if (_.isArray(value)) {
                ctx['%' + key] = index => value[index];
                ctx[key] = value;
            } else if (_.isPlainObject(value)) {
                ctx[key] = Mutator._attachArrayAccessor(value);
            } else {
                ctx[key] = value;
            }
        });
        return ctx;
    }

    static _dummyEval(template, ctx) {
        // if there are %-thing in the root this dummyfying ensures they are handled too

        let dummy = {dummy: template};
        return new Promise(function (resolve, reject) {
            Mutator._render(dummy, ctx).then(function (v) {
                resolve(v.dummy);
            });
        });
    }

    static _shouldBeInterpreted(stuff) {
        for (let k in stuff) {
            if (stuff.hasOwnProperty(k)) {
                if (_.includes(keywords, k)) {
                    return true;
                }
            }
        }
        return false;
    }

    static _render(template, ctx) {
        if (_.isString(template)) {
            return Mutator._replace(template, ctx);
        }

        if (Mutator._shouldBeInterpreted(template)) {
            return Mutator._dummyEval(template, ctx);
        }

        function runner() {
            for (let key in template) {
                if (template.hasOwnProperty(key)) {
                    let value = template[key];
                    if (key.toLowerCase() === 'workflow') {
                        // the flow preprocessing should occur dynamically
                        // since the flow is saved between sessions.
                        // Otherwise the initial preprocessed result would be saved
                        // and used for the remains of the flow.
                        continue;
                    }
                    if (_.isString(value)) {
                        template[key] = waitFor(Mutator._replace(template[key], ctx));
                    } else {
                        waitFor(Mutator._handleConstructs(template, key, ctx));
                    }
                }
            }
            return template;
        }

        return async(runner)();
    }

    static _handleConstructs(template, key, ctx) {
        const that = this;
        if (utils.isUndefined(template[key])) {
            return Promise.resolve();
        }

        function runner() {
            if (template[key].hasOwnProperty('%if')) {
                waitFor(Mutator._handleIf(template, key, ctx));
            } else if (template[key].hasOwnProperty('%switch')) {
                waitFor(Mutator._handleSwitch(template, key, ctx));
            } else if (template[key].hasOwnProperty('%eval')) {
                waitFor(Mutator._handleEval(template, key, ctx));
            } else if (template[key].hasOwnProperty('%fromNow')) {
                waitFor(Mutator._handleFromNow(template, key, ctx));
            } else if (template[key].hasOwnProperty('%join')) {
                waitFor(Mutator._handleJoin(template, key, ctx));
            } else if (template[key].hasOwnProperty('%rand')) {
                waitFor(Mutator._handleRandom(template, key, ctx));
            } else if (template[key].hasOwnProperty('%service')) {
                waitFor(Mutator._handleServiceCall(template, key, ctx));
            } else if (template[key].hasOwnProperty('%entity')) {
                waitFor(Mutator._handleEntityCall(template, key, ctx));
            } else {
                waitFor(Mutator._render(template[key], ctx));
            }
        }

        return async(runner)();
    }

    static _handleIf(template, key, context) {
        let hence;
        let condition = template[key]['%if'];
        let hold = undefined;

        function runner() {
            if (_.isString(condition)) {
                hold = waitFor(Mutator.safeEval(condition, context));
            } else {

                const err = new Error('invalid construct');
                err.message = '%if construct must be a string which eval can process';
                throw err;
            }

            if (hold) {
                hence = template[key]['%then'];
                if (_.isString(hence)) {
                    template[key] = waitFor(Mutator._replace(hence, context));
                } else if (hence.hasOwnProperty('%eval')) {
                    template[key] = waitFor(Mutator._dummyEval(template[key]['%then'], context));
                } else {
                    template[key] = waitFor(Mutator._render(hence, context));
                }
            } else {
                hence = template[key]['%else'];
                if (typeof hence === 'string' || hence instanceof String) {
                    template[key] = waitFor(Mutator._replace(hence, context));
                } else if (hence.hasOwnProperty('%eval')) {
                    template[key] = waitFor(Mutator._dummyEval(template[key]['%else'], context));
                } else {
                    template[key] = waitFor(Mutator._render(hence, context));
                }
            }
        }

        return async(runner)();
    }

    static _handleSwitch(template, key, context) {
        const that = this;

        function runner() {
            let condition = template[key]['%switch'];
            let case_option;
            if (typeof condition === 'string' || condition instanceof String) {
                case_option = waitFor(Mutator.safeEval(condition, context));
            } else {
                const err = new Error('invalid construct');
                err.message = '%switch construct must be a string which eval can process';
                throw err;
            }
            let case_option_value = template[key][case_option];
            if (typeof case_option_value === 'string' || case_option_value instanceof String) {
                template[key] = waitFor(Mutator._replace(case_option_value, context));
            } else if (case_option_value.hasOwnProperty('%eval')) {
                template[key] = waitFor(Mutator._dummyEval(case_option_value, context));
            } else {
                template[key] = waitFor(Mutator._render(case_option_value, context));
            }
        }

        return async(runner)();
    }

    static _handleEval(template, key, context) {
        const that = this;

        function runner() {
            let expression = template[key]['%eval'];
            if (_.isString(expression)) {
                template[key] = waitFor(Mutator.safeEval(expression, context));
                // console.log(template[key]);
            } else {
                throw new Error('%eval-value should be a string.')
            }
        }

        return async(runner)();
    }

    static _handleServiceCall(template, key, context) {
        const that = this;


        function runner() {
            let expression = template[key]['%service'];
            if (_.isPlainObject(expression)) {
                let url = expression.URL || expression.url;
                url = waitFor(Mutator._replace(url, context));
                delete expression.url; // if any
                expression.URL = url;
                if (utils.isUndefined(url)) {
                    throw new Error('A %service call needs a url-property.');
                }
                template[key] = waitFor(utils.getServiceData(expression));
            } else {
                throw new Error('A %service-value should be a service definition (with url and path properties).')
            }
        }

        return async(runner)();
    }

    static _handleEntityCall(template, key, context) {
        const that = this;

        function runner() {
            let expression = template[key]['%entity'];
            if (_.isPlainObject(expression)) {
                let datatype = expression.DataType || expression.Datatype;
                if (utils.isUndefined(datatype)) {
                    throw new Error('An %entity call needs a datatype-property.');
                }
                if (context.getEntity) {
                    const found = waitFor(context.getEntity(expression.Id));
                    if (found) {
                        template[key] = found.Title;
                    }
                } else {
                    template[key] = '[entity]';
                }

            } else {
                throw new Error('An %entity-value should be a entity definition (with DataType and Id properties).')
            }
        }

        return async(runner)();
    }

    static _handleJoin(template, key, context) {
        const that = this;

        function runner() {
            const expression = template[key]['%join'];
            if (_.isString(expression)) {
                return;
            } else if (_.isArray(expression)) {
                for (let i = 0; i < expression.length; i++) {
                    expression[i] = waitFor(Mutator._render(expression[i], context));
                }
                template[key] = expression.join(' ');
            } else {
                throw new Error('%join value must be an array.')
            }
        }

        return async(runner)();
    }

    static _handleRandom(template, key, context) {
        const that = this;

        function runner() {
            const expression = template[key]['%rand'];
            if (_.isString(expression)) {
                return;
            } else if (_.isArray(expression)) {
                for (let i = 0; i < expression.length; i++) {
                    expression[i] = waitFor(Mutator._render(expression[i], context));
                }
                template[key] = _.sample(expression);
            } else {
                throw new Error('%rand value must be an array.')
            }
        }

        return async(runner)();
    }

    static _handleFromNow(template, key, context) {
        const that = this;

        function runner() {
            let expression = template[key]['%fromNow'];
            if (typeof expression === 'string' || expression instanceof String) {
                template[key] = waitFor(Mutator._dateToISOString(expression));
            } else {
                throw new Error('%fromNow value must be a string which eval can process.');
            }
        }

        return async(runner)();
    }

    static _dateToISOString(expression, context) {
        let match = undefined;
        if (match = DATEEXPR.exec(expression)) {
            const mom = new moment(new Date());
            const days = match[1] === undefined ? 0 : parseInt(match[1].split(' ')[0], 10);
            const hours = match[3] === undefined ? 0 : parseInt(match[3].split(' ')[0], 10);
            const minutes = match[5] === undefined ? 0 : parseInt(match[5].split(' ')[0], 10);
            mom.add(days, 'days');
            mom.add(hours, 'hours');
            mom.add(minutes, 'minutes');
            return mom.toISOString();
        }

        const err = new Error('invalid construct value');
        err.message = '%fromNow expression is incorrect';
        throw err;
    }


    static async _replace(parameterizedString, ctx) {
        const that = this;
        let match = undefined;
        // things like '%{...}'
        if (match = normalRegx.exec(parameterizedString)) {
            const replacementValue = waitFor(Mutator.safeEval(match[1].trim(), ctx));
            if (utils.isDefined(replacementValue)) {
                return parameterizedString.replace(normalRegx, replacementValue);
            }
        }
        // things like '%%time'
        if (match = parameterizedString.match(systemRegx)) {
            _.forEach(match, function (m) {
                if (m === undefined || m === null) {
                    return;
                }
                let parts = OracleService._getVariableParts(m);
                if (parts.isEmpty) {
                    return;
                }
                if (ctx.hasOwnProperty('getSystemVariable')) {
                    const replacementValue = waitFor(ctx.getSystemVariable(parts.name));
                    if (utils.isDefined(replacementValue)) {
                        parameterizedString = parameterizedString.replace(m, replacementValue);
                    }
                }
            })
        }
        // things like '%dep_number:33'
        if (match = parameterizedString.match(freeVariableRegx)) {
            _.forEach(match, function (m) {
                if (m === undefined || m === null) {
                    return;
                }
                let parts = OracleService._getVariableParts(m);
                if (parts.isEmpty) {
                    return;
                }
                if (parts.isSystem) {
                    return;
                }
                let replacementValue = null;
                if (parts.isNumeric) {
                    replacementValue = (ctx.hasOwnProperty('getWildcard')) ? waitFor(ctx.getWildcard(parts.name)) : ctx[parts.name];
                } else {
                    replacementValue = (ctx.hasOwnProperty('getVariable')) ? waitFor(ctx.getVariable(parts.name)) : ctx[parts.name];
                }
                if (utils.isUndefined(replacementValue) && parts.hasDefault) {
                    replacementValue = parts.default;
                }
                if (utils.isDefined(replacementValue)) {
                    parameterizedString = parameterizedString.replace(m, replacementValue);
                }
            })
        }
        return parameterizedString;
    }
}

module.exports = Mutator;
