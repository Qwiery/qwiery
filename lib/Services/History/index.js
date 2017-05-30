/*
 Manages the history and trail of users.
 * */
const utils = require('../../utils'),
    path = require('path'),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
const Session = require("../../Framework/Session");
const StorageDomainBase = require("../../Framework/StorageDomainBase");
const HistoryStorage = require("./HistoryStorage");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');

/**
 * Manages the trail of exchanges.
 *
 * @class History
 * @extends {ServiceBase}
 */
class History extends ServiceBase {
    constructor() {
        super("history");
        // keeps track of the interactions but only loads what is necessary
        //this.counterProxy = {};
        this.keepFlatHistory = false;
    }


    /***
     * Initializes this service.
     */
    init(instantiator) {
        super.init(instantiator);
        this.keepFlatHistory = instantiator.settings.system.keepFlatHistory;
        this.historyStorage = new HistoryStorage(this.storage);
        return this.historyStorage.init(instantiator);

    }

    getUserTrail(ctx) {
        const that = this;

        function runner() {
            const userHistory = waitFor(that.historyStorage.getFullHistory(ctx.userId, 10));
            return _.map(userHistory, function(e) {
                if(e.Handled) {
                    const isEntity = e.Output.Answer[0].DataType === "SingleEntity";
                    const entity = utils.isDefined(e.Output.Answer[0].Entity) ? e.Output.Answer[0].Entity : null;
                    let title = "The entity was not found or has been deleted.";
                    if(utils.isDefined(entity)) {
                        title = entity.Title || "No title was set";
                    }
                    return {
                        Title: isEntity ? title : e.Input.Raw,
                        Input: e.Input.Raw,
                        Timestamp: e.Input.Timestamp,
                        IsEntity: isEntity,
                        Id: entity === null ? null : entity.Id,
                        DataType: isEntity ? e.Output.Answer[0].Entity.DataType : null

                    };
                } else {
                    return {
                        Title: e.Input.Raw,
                        Input: e.Input.Raw,
                        Timestamp: e.Input.Timestamp,
                        IsEntity: false,
                        Id: null,
                        DataType: null

                    };
                }

            });
        }

        return async(runner)();
    }

    getLast(ctx) {
        return this.historyStorage.getLast(ctx.userId);
    }

    getHistoryCount(ctx) {
        const that = this;

        function runner() {
            // if(that.counterProxy[ctx.userId]) {
            //     return that.counterProxy[ctx.userId];
            // } else {
            //     const count = waitFor(that.historyStorage.getHistoryCount(ctx.userId));
            //     that.counterProxy[ctx.userId] = count;
            //     return count;
            // }
            return waitFor(that.historyStorage.getHistoryCount(ctx.userId));

        }

        return async(runner)();
    }

    getUserHistory(ctx, count = 1000) {
        const that = this;

        function runner() {
            const userHistory = waitFor(that.historyStorage.getFullHistory(ctx.userId, count));
            return _.map(userHistory, function(e) {
                const isEntity = e.Output.Answer[0].DataType === "SingleEntity";
                const entity = utils.isDefined(e.Output.Answer[0].Entity) ? e.Output.Answer[0].Entity : null;
                let title = "The entity was not found or has been deleted.";
                if(utils.isDefined(entity)) {
                    title = entity.Title || "No title was set";
                }
                return {
                    Input: isEntity ? title : e.Input.Raw,
                    IsEntity: isEntity,
                    NodeId: entity === null ? null : entity.Id,
                    Timestamp: e.Output.Timestamp,
                    CorrelationId: e.Key.CorrelationId
                }
            }).reverse();
        }

        return async(runner)();

    }

    getUserHistoryItem(correlationId, ctx) {
        return this.historyStorage.getUserHistoryItem(correlationId, ctx.userId).then(function(found) {
            if(utils.isDefined(found)) {
                found.CorrelationId = correlationId; // for compat with production
            }
            return found;
        });
    }

    addHistoryItem(item, ctx) {
        const that = this;
        let tosave = item;
        if(item instanceof Session) {
            tosave = item.toJSON();
        }
        const clone = _.clone(tosave);
        function runner() {
            // if(that.counterProxy[ctx.userId]) {
            //     that.counterProxy[ctx.userId] = that.counterProxy[ctx.userId] + 1;
            // } else {
            //     const count = waitFor(that.historyStorage.getHistoryCount(ctx.userId));
            //     that.counterProxy[ctx.userId] = count + 1;
            // }
            delete clone.BotConfiguration;
            waitFor(that.historyStorage.append(clone));
            if(that.services.statistics) {
                waitFor(that.services.statistics.increaseAnswerCountForToday());
            }
        }

        return async(runner)();
    }

    getGlobalUsageStats() {
        return new Promise(function(resolve, reject) {
            storage.statistics.getGlobalUsageStats().then(function(raw) {
                const mapped = _.map(raw, function(v, k) {
                    return {
                        Type: k, // something like "8/11/2016"
                        Weight: v
                    }
                });
                resolve(mapped);
            });
        });
    }
}
module.exports = History;