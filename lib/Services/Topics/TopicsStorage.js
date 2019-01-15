const utils = require('../../utils'),
    path = require('path'),
    _ = require('lodash');
const ServiceBase = require('../../Framework/ServiceBase');
const StorageDomainBase = require('../../Framework/StorageDomainBase');

/**
 * Manages the topical data.
 *
 * @class TopicsStorage
 * @extends {StorageDomainBase}
 */
class TopicsStorage extends StorageDomainBase {

    init(instantiator) {
        super.init(instantiator);
        return this.createCollections(
            {
                collectionName: 'Topics',
                schema: {
                    userId: String,
                    topics: [{
                        name: String,
                        value: Number
                    }]
                },
                index: 'userId'
            },
            {
                collectionName: 'StandardTopics',
                schema: {
                    name: String
                }
            },
            {
                collectionName: 'TopicsHistory',
                schema: {
                    userId: String,
                    topics: [{
                        name: String,
                        date: Date
                    }]

                }
            });
    }

    /**
     * Fetches the topics the user touched.
     * Since at most fifty topics are kept per user the list returned is limited to fifty as well.
     * @param userId {string} The user identifier.
     * @returns {Promise<array<object>>} The resolve promise contains an array with descending date.
     */
    getTopicHistory(userId) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.TopicsHistory.findOne({userId: userId}).then(function (user) {
                if (utils.isUndefined(user)) {
                    resolve([]);
                } else {
                    // return descending in date, most recent first
                    resolve(_.reverse(_.sortBy(user.topics, 'date')));
                }
            });
        });
    }

    /**
     * Adds a topic to the history stack of the user.
     * The topic is only added if different from the previous
     * and truncations of the history occurs after fifty items.
     * @param userId
     * @param topicName
     * @return {Promise}
     */
    addTopicHistory(userId, topicName) {
        const that = this;

        function mergeCap(newList, list) {
            if (_.isString(newList)) {
                newList = [newList];
            }
            let merged = list;

            for (let i = 0; i < newList.length; i++) {
                const name = newList[i].toLowerCase();
                //take latest 49
                merged = _.take(_.reverse(_.sortBy(merged, 'date')), 49);
                merged.push({
                    name: name,
                    date: new Date()
                });
            }
            return merged;
        }

        return new Promise(function (resolve, reject) {
            that.TopicsHistory.findOne({userId: userId}).then(function (user) {
                if (utils.isDefined(user)) {
                    // is it different from the last one?
                    const recent = _.last(_.sortBy(user.topics, 'date'));
                    if (recent.name === topicName) {
                        resolve(); // same as last time
                    } else {
                        user.topics = mergeCap(topicName, user.topics);
                        that.TopicsHistory.update(user, {userId: userId}).then(function () {
                            resolve();
                        });
                    }
                } else {
                    user = {
                        userId: userId,
                        topics: mergeCap(topicName, [])
                    };
                    that.TopicsHistory.insert(user).then(function () {
                        resolve();
                    });
                }
            });
        });
    }

    getAllStandardTopics() {
        return this.StandardTopics.find({}, {'name': true});
    }

    removeAllStandardTopics() {
        return this.StandardTopics.remove({});
    }

    standardTopicExists(topicName) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.StandardTopics.findOne({name: {'$regex': '^' + topicName, $options: 'i'}}).then(function (ut) {
                resolve(utils.isDefined(ut));
            });
        });
    }

    addStandardTopic(topicName) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.StandardTopics.findOne({name: {'$regex': '^' + topicName, $options: 'i'}}).then(function (ut) {
                // only add if not already there
                if (utils.isUndefined(ut)) {
                    that.StandardTopics.insert({
                        name: topicName
                    }).then(function () {
                        resolve();
                    });
                }
            });
        });

    }

    /**
     * Adds a single topic to the ones used by the given user.
     * @param topicName {string|array} The topic to add.
     * @param userId
     * @return {Promise}
     */
    async addTopic(topicName, userId) {

        const that = this;

        // whethe string or list, this merges the stats
        function mergeCount(newList, list) {
            if (_.isString(newList)) {
                newList = [newList];
            }
            let merged = list;
            for (let i = 0; i < newList.length; i++) {
                const name = newList[i].trim().toLowerCase();
                let item = _.find(merged, {name: name});
                if (utils.isUndefined(item)) {
                    merged.push({
                        name: name,
                        value: 1
                    });
                } else {
                    item.value += 1;
                }
            }
            return merged;
        }

        let user = await (that.Topics.findOne({userId: userId}));
        if (utils.isUndefined(user)) {

            await (that.Topics.insert({
                userId: userId,
                topics: mergeCount(topicName, [])
            }));
        } else {
            user.topics = mergeCount(topicName, user.topics);
            await (that.Topics.update(user, {userId: userId}));
        }
    }

    async clearUserTopics(userId) {
        let user = await (this.Topics.findOne({userId: userId}));
        if (utils.isDefined(user)) {
            user.topics = [];
            this.Topics.update(user, {userId: userId});
        }
    }

    /**
     *
     * @param userId
     * @returns {Promise<Dictionary>}
     */
    async getUserTopics(userId) {
        let ut = await (this.Topics.findOne({userId: userId}));
        if (utils.isUndefined(ut)) {
            return {};
        } else {
            const r = {};
            for (let i = 0; i < ut.topics.length; i++) {
                const topic = ut.topics[i];
                r[topic.name] = topic.value;
            }
            return r;
        }
    }

}

module.exports = TopicsStorage;
