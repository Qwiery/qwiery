const utils = require('../../utils'),
    path = require('path'),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
const StorageDomainBase = require("../../Framework/StorageDomainBase");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
/**
 * Manages the storage of statistical data.
 * 
 * @class StatisticsStorage
 * @extends {StorageDomainBase}
 */
class StatisticsStorage extends StorageDomainBase {


    init(instantiator) {
        super.init(instantiator);
        return this.createCollections(
            {
                collectionName: "LanguageUsage",
                storageName: "stats_LanguageUsage",
                schema: {
                    url: String,
                    userId: String,
                    method: String,
                    body: String,
                    ip: String,
                    date: Date
                }
            },
            {
                collectionName: "AskUsage",
                storageName: "stats_AskUsage",
                schema: {
                    url: String,
                    userId: String,
                    method: String,
                    body: String,
                    ip: String,
                    appId: String,
                    date: Date
                }
            },
            {
                collectionName: "AnswersPerDay",
                storageName: "stats_AnswersPerDay",
                schema: {
                    value: Number,
                    date: String
                }
            },
            {
                collectionName: "TimingPerAnswer",
                storageName: "stats_TimingPerAnswer",
                schema: {
                    value: Number,
                    date: Date
                }
            },
            {
                collectionName: "TemplateUsage",
                storageName: "stats_TemplateUsage",
                schema: {
                    value: Number,
                    templateId: String
                }
            }
        );

    }

    /**
     * Increase the template usage count with the given delta.
     * @param id
     * @param delta
     * @returns {Promise<T>}
     */
    increaseTemplateUsageCount(id, delta = 1) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.TemplateUsage.findOne({'templateId': id}).then(function(found) {
                if(utils.isDefined(found)) {
                    found.value = found.value + delta;
                    that.TemplateUsage.update(found, {'templateId': id}).then(function() {
                        resolve();
                    });
                } else {
                    that.TemplateUsage.insert({
                        templateId: id,
                        value: 1
                    }).then(function() {
                        resolve();
                    });
                }
            });
        });
    }

    /**
     * Returns how many times the template with the specified id has been used.
     * @param id {string} The id of the template.
     * @returns {Promise<Number>}
     */
    getTemplateUsage(id) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.TemplateUsage.findOne({'templateId': id}).then(function(found) {
                if(utils.isDefined(found)) {
                    resolve(found.value);
                } else {
                    resolve(0);
                }
            });
        });
    }

    /**
     * Keeps the millisecs it took to answer a question.
     * @param timing
     * @returns {Promise<T>}
     */
    addAnswerTiming(timing) {
        return this.TimingPerAnswer.insert({
            date: new Date(),
            value: timing
        });

    }

    /**
     * Returns the timings.
     * @returns {Promise.<array>}
     */
    getTimings() {
        return this.TimingPerAnswer.find();

    }

    /**
     * Adds to the global usage for today.
     * @returns {Promise<T>}
     */
    increaseAnswerCountForToday(delta = 1) {
        const that = this;
        return new Promise(function(resolve, reject) {
            const key = new Date().toLocaleDateString();
            that.AnswersPerDay.findOne({'date': key}).then(function(found) {
                if(utils.isDefined(found)) {
                    found.value = found.value + delta;
                    that.AnswersPerDay.update(found,{'date': key}).then(function() {
                        resolve()
                    });
                } else {
                    that.AnswersPerDay.insert({
                        date: key,
                        value: 1
                    }).then(function() {
                        resolve();
                    });
                }
            });
        });
    }

    /**
     * Returns the amount of questions per day.
     * {
         *  "10/5/16": 548,
         *  "9/5/16": 445
         * }
     * @returns {Promise<T>}
     */
    getGlobalUsageStats() {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.AnswersPerDay.find().then(function(all) {
                const data = {};
                for(let i = 0; i < all.length; i++) {
                    const item = all[i];
                    data[item.date] = item.value;
                }
                resolve(data);
            });
        });

    }

    /**
     * Stores analytics info about the language services usage.
     *
     * @example
     *
     * var u = {
         *   url: req.originalUrl,
         *   userId: utils.isDefined(req.ctx) ? req.ctx.userId : "Not secured yet",
         *   method: req.method,
         *   body: JSON.stringify(req.body),
         *   ip: clientIp
         * };
     */
    addLanguageUsage(u) {
        u["date"] = new Date();
        return this.LanguageUsage.insert(u);

    }

    /**
     * Gets the last N usage items.
     * @param n {Number} The number of feedback to return.
     */
    getLastLanguageUsage(n = 10) {
        return this.LanguageUsage.find({}, {date: true}, n);
    }

    /**
     * Adds analytics info about the API requests.
     *
     *      url: String,
     *      userId: String,
     *      method: String,
     *      body: String,
     *      ip: String,
     *      appId: String,
     *      date: Date
     * @param u {object}
     * @returns {Promise.<T>}
     */
    addAskUsage(u) {
        u["date"] = new Date();
        return this.AskUsage.insert(u);
    }

    /**
     * Gets the last N usage items.
     * @param n {Number} The number of usages to return.
     */
    getLastAskUsage(n = 10) {
        return this.AskUsage.find({}, {date: true}, n);
    }

    getLanguageUsageCount(userId) {
        return this.LanguageUsage.count({userId: userId});
    }

    getLanguageUsageSeries(userId) {
        return this.LanguageUsage.find({userId: userId});
    }

    getQuestionUsageCount(templateId) {
        return this.AskUsage.count({templateId: templateId});
    }

    getUserBotsStats(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.storage.apps.getUserAppsIds(userId).then(function(apps) {
                const reqs = [];
                for(let i = 0; i < apps.length; i++) {
                    const bot = apps[i];
                    reqs.push(that.getBotUsage(userId, bot.id));
                }
                Promise.all(reqs).then(function(stats) {
                    const final = [];
                    for(let i = 0; i < apps.length; i++) {
                        const bot = apps[i];
                        final.push({
                            id: bot.id,
                            name: bot.name,
                            series: _.find(stats, {appId: bot.id}).series
                        });
                    }
                    resolve(final);
                });
            });
        });
    }

    getBotUsage(userId, appId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.AskUsage.find({appId: appId}).then(function(usage) {
                const groups = _.groupBy(usage, function(item) {
                    return item.date.toString().substring(0, 10);
                });
                const lseries = _.map(groups, function(v, k) {
                    return {
                        Type: k,
                        Weight: v.length
                    }
                });
                resolve({
                    appId: appId,
                    series: lseries
                });
            });
        });
    }

}

module.exports = StatisticsStorage;