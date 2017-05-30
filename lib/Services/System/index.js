/*
 * Fetches system variables.
 * A system variable appears in QTL with a double $$.
 * */
const path = require("path"),
    fs = require('fs-extra'),
    utils = require('../../utils'),
    ServiceBase = require('../../Framework/ServiceBase'),
    _ = require('lodash');
const dateFormat = require('dateformat');
/**
 * Access to various system-level info.
 *
 * @class System
 * @extends {ServiceBase}
 */
class System extends ServiceBase {
    constructor() {
        super("system");
    }

    static getDateTime() {
        return dateFormat(new Date(), "dddd, mmmm dS yyyy h:MM TT");
    }

    static getDate() {
        return dateFormat(new Date(), "dddd, mmmm dS yyyy");
    }

    static getTime() {
        return dateFormat(new Date(), "h:MM TT");
    }

    getSystemVariable(name, ctx) {
        const that = this;
        let pjson;
        return new Promise(function(resolve, reject) {
            switch(name.toLowerCase()) {
                case "time":
                    resolve(System.getTime());
                    break;
                case "date":
                    resolve(System.getDate());
                    break;
                case "datetime":
                    resolve(System.getDateTime());
                    break;
                case "userid":
                    resolve(ctx.userId);
                    break;
                case "version":
                    pjson = require('../../../package.json');
                    resolve(pjson.version);
                    break;
                case "versiondate":
                    pjson = require('../../../package.json');
                    resolve(pjson._versionDate);
                    break;
                case "emotions":
                    if(this.services.emotions) {

                        const r = this.services.emotions.getEmotionalState(ctx.appId);
                        let output = "", goalDetails = "", total = 0;
                        _.forEach(r.goals, function(goal) {
                            total += goal.likelihood;
                        });
                        goalDetails = _.map(r.goals, function(goal) {
                            return "- " + goal.name + ": " + _.round(goal.likelihood * 100 / total, 2) + "%";
                        }).join(", \\n");
                        if(r.state.length > 0) {
                            // map to 100%
                            total = 0;
                            _.forEach(r.state, function(state) {
                                total += state.intensity;
                            });
                            if(total === 0) {
                                resolve("Very little feelings right now." + "\\n\\n The things that trigger me and how much it's been discussed: \\n\\n" + goalDetails)
                            }
                            else {
                                output = _.map(r.state, function(state) {
                                    return "- " + state.name + ": " + _.round(state.intensity * 100 / total, 2) + "%";
                                }).join(", \\n");
                                resolve("This is how I feel right now: \\n\\n" + output + "\\n\\n The things that trigger me and how much it's been discussed: \\n\\n" + goalDetails);
                            }
                        } else {
                            resolve("No particular feelings right now. That's a good thing, right?\\n\\n" + "If you wish to know the details of my goals, there you are: \\n\\n" + goalDetails);
                        }
                    } else {
                        resolve("I'm sorry but my emotional module is switched off.");
                    }
                    break;
                case "appname": case "botname":
                    resolve(that.services.apps.getAppName(ctx));
                    break;
                case "serviceurl":
                    pjson = require('../../../package.json');
                    resolve(pjson._serviceUrl);
                    break;
                case "randomwords":
                    if(this.services.language) {
                        lang.randomWords(null, null, 10).then(function(ar) {
                            resolve(ar.join(", ").replace(/_/gi, " "));
                        });
                    } else {
                        resolve("Language_Plugin_Not_Available");
                    }
                    break;
                case "summary":
                    // the %%summary is a workflow variable which gets replaced by the WorkflowSpy.
                    // so can remain
                    resolve("%%summary");
                    break;
                default:
                    resolve(`[unknown system parameter '${name.toLowerCase()}']`);
            }

        })
    }
}
/**
 * @module System
 */
module.exports = System;
