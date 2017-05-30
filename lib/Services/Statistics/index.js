const
    StatisticsStorage = require("./StatisticsStorage"),
    utils = require('../../utils'),
    ServiceBase = require('../../Framework/ServiceBase'),
    requestIp = require('request-ip'),
    _ = require('lodash');
/**
 * Keeps track of interactions and stats.
 *
 * @class Statistics
 * @extends {ServiceBase}
 */
class Statistics extends ServiceBase {
    constructor() {
        super("statistics");

    }

    /**
     * Initializes this service.
     */
    init(instantiator) {
        super.init(instantiator);
        this.graph = this.services.graph;
        this.statistics = new StatisticsStorage(this.storage);
        return this.statistics.init(instantiator);
    }

    getGlobalUsageStats() {
        return this.statistics.getGlobalUsageStats();
    }

    increaseTemplateUsageCount(id, delta = 1) {
        return this.statistics.increaseTemplateUsageCount(id, delta);
    }

    addAnswerTiming(timing) {
        return this.statistics.addAnswerTiming(timing);
    }

    increaseAnswerCountForToday() {
        return this.statistics.increaseAnswerCountForToday();
    }

    /**
     * Stores analytics info.
     */
    addLanguageUsage(a) {
        return this.statistics.addLanguageUsage(a);
    }

    getUserBotsStats(ctx) {
        return this.statistics.getUserBotsStats(ctx.userId);
    }

    addAskUsage(a) {
        return this.statistics.addAskUsage(a);
    }

    getLanguageUsageCount(ctx) {
        return this.statistics.getLanguageUsageCount(ctx.userId);
    }

    getLanguageUsageSeries(ctx) {
        return this.statistics.getLanguageUsageSeries(ctx.userId);
    }

    getQuestionUsageCount(ctx) {
        return this.statistics.getQuestionUsageCount(ctx.userId);
    }

    getTemplateUsage(id) {
        return this.statistics.getTemplateUsage(id);
    }

    getTimings() {
        return this.statistics.getTimings();
    }

    getLastAskUsage(n = 10) {
        return this.statistics.getLastAskUsage(n);
    }

    getLastLanguageUsage(n = 10) {
        return this.statistics.getLastLanguageUsage(n);
    }

    /**
     * Wraps some client request info.
     * @param req Http request.
     * @returns {{url: *, userId: string, method, body, ip: (*|string)}}
     */
    static getBasicInfo(req) {
        let clientIp = requestIp.getClientIp(req);
        if(clientIp === "::1") {
            clientIp = "local"
        }
        return {
            url: req.originalUrl,
            userId: utils.isDefined(req.ctx) ? req.ctx.userId : "Anonymous",
            method: req.method,
            body: JSON.stringify(req.body),
            ip: clientIp
        };
    }

    /***
     * Posts the usage of a service for analytical purposes.
     * @param req Http request
     * @param res Http response
     * @param next Callback.
     */
    static postLanguageUsage(req, res, next) {
        const clientIp = requestIp.getClientIp(req);
        const u = {
            url: req.originalUrl,
            userId: utils.isDefined(req.ctx) ? req.ctx.userId : "Not secured yet",
            method: req.method,
            body: JSON.stringify(req.body),
            ip: clientIp
        };
        Statistics.addLanguageUsage(u);
        // no need to wait for processing
        next();
    }
}
module.exports = Statistics;