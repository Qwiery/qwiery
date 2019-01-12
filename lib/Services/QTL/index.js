const
    utils = require('../../utils'),
    ServiceBase = require('../../Framework/ServiceBase'),
    Language = require('../Language'),
    datetimeParser = require('../../Understanding/Datetime'),
    _ = require('lodash');
const Mutator = require('../QTL/mutator');

/**
 * One of the few services which are automatically added by another service,
 * in this case the Oracle service.
 * QTL mutates template into final answers.
 * @class QTL
 */
class QTL extends ServiceBase {
    constructor() {
        super('qtl');
    }

    /***
     * Mutates the template by making choices, joins, mutations and such.
     * @param oracleItem
     * @param session
     * @returns {*}
     */
    async mutateOracleItem(oracleItem, session) {
        if (QTL._answerIsIntent(oracleItem.Template)) {
            oracleItem.Template.Answer = QTL._resolveIntent(oracleItem.Template.Answer, oracleItem.Wildcards, session.Context);
            return oracleItem;
        } else {
            oracleItem.Template = await this.mutate(oracleItem.Template, session, oracleItem.Wildcards, null);
            return oracleItem;
        }
    }

    mutate(template, session, wildcards, variables) {
        if (utils.isUndefined(template)) {
            throw new Error('Trying to mutate an undefined.');
        }
        if (!_.isPlainObject(template) && !_.isString(template) && !_.isNumber(template)) {
            console.error(template);
            throw new Error('Mutation should apply to a plain object not an instance.');
        }
        const ctx = session.Context;
        if (utils.isUndefined(ctx)) {
            debugger
        }

        //assert(utils.isDefined(template.States), "Likely not a workflow definition.");
        return Mutator.mutate(template, this.mutationContext(session, variables, wildcards));
    }

    /**
     * The execution context of QTL.
     * In here sits everything the QTL mutator needs to resolve variable and external parts.
     * @param session
     * @param variables
     * @param wildcards
     * @return {*}
     */
    mutationContext(session, variables, wildcards) {
        const that = this;
        const ctx = session.Context;
        return {
            // fetches things like %Username
            getVariable(m) {
                return that.services.personalization.getPersonalization(m, ctx);
            },
            // fetches things like %%time
            getSystemVariable(m) {
                return that.services.system.getSystemVariable(m, ctx)
            },
            // fetches the %entity items
            getEntity(id) {
                return that.services.graph.getEntity(id, ctx);
            },
            // fetches the %1, %2...
            getWildcard(m) {
                let found = _.find(wildcards, {name: m});
                return found ? found.value : null;
            },
            // just a test
            isEvening: () => {
                return (new Date().getHours()) > 19;
            },

            interpreteAsAppointment(input) {
                const e = datetimeParser.parse(input);

            },
            // the security context
            ctx: ctx,
            setPersonalization(key, value) {
                return that.services.personalization.addPersonalization(key, value, ctx);
            },
            setPersonality(name) {
                return that.services.personality.addPersonality(name, ctx);
            },
            capture(key, value) {
                value = Language.capture(key, value);
                return that.services.personalization.addPersonalization(key, value, ctx);
            },
            hasPersonalization(key) {
                return new Promise(function (resolve, reject) {
                    that.services.personalization.getPersonalization(key, ctx).then(function (value) {
                        resolve(utils.isDefined(value));
                    });
                });
            },
            spaceNameExists(name) {
                let exact = true;
                if (name.indexOf('*') >= 0) {
                    exact = false;
                    name = name.replace(/\*/gi, '');
                }
                return that.services.graph.getWorkspaceIdByName(name, ctx, exact).then(function (id) {
                    return utils.isDefined(id);
                });
            },
            deleteSpace(name) {
                let exact = true;
                if (name.indexOf('*') >= 0) {
                    exact = false;
                    name = name.replace(/\*/gi, '');
                }
                // on trying to delete the default space this will catch the error and present it to the surface
                return that.services.graph.getWorkspaceIdByName(name, ctx, exact).then(function (id) {
                    let msg = 'Done.';
                    return that.services.graph.deleteWorkspace(id, ctx)
                        .catch(function (e) {
                            msg = e.message;
                        })
                        .then(function () {
                            return msg;
                        });

                });
            },
            deleteTag(tagName) {
                return that.services.graph.deleteTag(tagName, ctx);
            },
            deleteEntity(id) {
                return that.services.graph.deleteNode(id, ctx);
            },
            tagExists(tagName) {
                return that.services.graph.tagExists(tagName, ctx);
            },
            entityExists(id) {
                return that.services.graph.nodeExists(id, ctx);
            },
            get language() {
                return session.Language || 'english';
            },
            get services() {
                return that.services;
            },
            variables: variables || {}

        }
    }

    static _answerIsIntent(template) {

        if (template.Answer) {
            if (_.isArray(template.Answer) && template.Answer.length === 1) {
                return template.Answer[0].DataType === 'Intent';
            }
        } else {
            return false;
        }
    }

    /***
     * An intent is a special type of answer to be used by a relay party (app builders e.g.).
     * The params in an intent can only be from the input or from  the system.
     * @param obj
     * @param wildcards A dictionary with the wildcard values found.
     * @param ctx
     * @returns Always returns an array.
     */
    static _resolveIntent(obj, wildcards, ctx) {

        let found;
        let param;
        let i;
        /*
         *    Should be something like
         *   [
         *       {
         *           "DataType": "Intent",
         *           "Answer": "Hello $name",
         *           "Parameters": [
         *               {
         *                   "id": "745va1czub",
         *                   "name": "name",
         *                   "default": "you",
         *                   "type": "String"
         *               }
         *           ]
         *       }
         *   ]
         */

        if (!_.isPlainObject(obj) && !(_.isArray(obj) && obj.length === 1 && _.isPlainObject(obj[0]))) {
            throw new Error('The intent resolver expects a plain object or an array with a single plain object.');
        }
        let subject = obj;
        if (_.isArray(obj)) {
            subject = subject[0];
        }
        if (utils.isUndefined(subject) || utils.isUndefined(subject.DataType) || subject.DataType !== 'Intent') {
            throw new Error('The DataType of an intent should be set (DataType: \'Intent\').');
        }
        if (wildcards && wildcards.length > 0) {
            // augment the parameters with the wildcards found
            for (i = 0; i < subject.Parameters.length; i++) {
                param = subject.Parameters[i];
                found = _.find(wildcards, {name: param.name});
                param.value = utils.isDefined(found) ? found.value : null;
            }
            const normalGetters = subject.Answer.match(/((?=^)|\s)\$\w+/gi);
            if (utils.isDefined(normalGetters)) {
                for (i = 0; i < normalGetters.length; i++) {
                    const getter = normalGetters[i].trim();
                    if (getter.length === 1) continue; // standalone $
                    const name = getter.substring(1);
                    found = _.find(wildcards, {name: name});
                    if (found) {
                        subject.Answer = subject.Answer.replace(new RegExp('\\$' + name, 'gi'), found.value);
                    }
                }
            }
        } else {
            for (i = 0; i < subject.Parameters.length; i++) {
                param = subject.Parameters[i];
                param.value = null;
            }
            // nothing to replace in the asnwer since there are no wildcards
        }
        return [subject];

    }

}

module.exports = QTL;
