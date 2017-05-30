const utils = require('../../utils'),
    path = require('path'),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
const StorageDomainBase = require("../../Framework/StorageDomainBase");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
/**
 * Manages the storage of history.
 * 
 * @class FullHistoryStorage
 * @extends {StorageDomainBase}
 */
class FullHistoryStorage extends StorageDomainBase {

    init(instantiator) {
        super.init(instantiator);
        return this.createCollections(
            {
                collectionName: "FullHistory",
                schema: {
                    "ExchangeId": Number,
                    "AppId": String,
                    "Handled": Boolean,
                    "Historize": Boolean,
                    "Input": {
                        "Raw": String,
                        "Timestamp": String
                    },
                    "Key": {
                        "CorrelationId": String,
                        "UserId": String
                    },
                    "Output": {
                        "Answer": {type: Array, "default": []},
                        "Timestamp": String
                    },
                    "Context": {
                        "userId": String,
                        "appId": String
                    },
                    "Entities": {
                        "mentions": {type: Array, "default": []},
                        "hashtags": {type: Array, "default": []},
                        "cashtags": {type: Array, "default": []},
                        "links": {type: Array, "default": []}
                    },
                    "Timing": String,
                    "Trace": {type: Array, "default": []}
                }
            });
    }

    /**
     * Returns the length of the user's history.
     * @param userId
     * @returns {Promise<T>}
     */
    getHistoryCount(userId) {
        return this.FullHistory.count({'Key.UserId': userId});
    }

    /**
     * Returns a single history item of the user.
     * @param correlationId
     * @param userId
     * @returns {Promise<T>}
     */
    getUserHistoryItem(correlationId, userId) {
        return this.FullHistory.findOne({'Key.UserId': userId, 'Key.CorrelationId': correlationId});
    }

    /**
     * Returns the full user history.
     * @param userId
     * @param size The size to return. If not set the whole stack is returned.
     * @returns {Promise<T>}
     */
    getFullHistory(userId, size = 1000) {
        return this.FullHistory.find({'Key.UserId': userId}, "ExchangeId", size);
    }

    getLast(userId){
        return this.FullHistory.find({'Key.UserId': userId}, {ExchangeId:true}, 1);
    }
    /**
     * Appends the given history item.
     * @param item
     * @returns {Promise<T>}
     */
    append(item) {
        return this.FullHistory.insert(item);
    }
}
module.exports = FullHistoryStorage;