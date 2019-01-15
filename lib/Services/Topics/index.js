const utils = require('../../utils'),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
const TopicsStorage = require("./TopicsStorage");

/**
 * Manages the topics used in exchanges.
 * @class
 * @extends ServiceBase
 * @tutorial Topics
 */
class Topics extends ServiceBase {
    constructor() {
        super("topics");
    }

    init(instantiator) {
        super.init(instantiator);
        this.topics = new TopicsStorage(this.storage);
        return this.topics.init(instantiator);
    }

    /**
     * Fetches the topics the user touched.
     * Since at most fifty topics are kept per user the list returned is limited to fifty as well.
     * @param userId {string} The user identifier.
     * @returns {Promise<array<object>>} The resolve promise contains an array with descending date.
     */
    getTopicHistory(ctx) {
        return this.topics.getTopicHistory(ctx.userId);
    }

    /**
     * Adds a topic to the history stack of the user.
     * The topic is only added if different from the previous
     * and truncations of the history occurs after fifty items.
     * @param userId
     * @param topicName
     * @return {Promise}
     */
    addTopicHistory(ctx, topicName) {
        return this.topics.addTopicHistory(ctx.userId, topicName);
    }

    /**
     * Returns the statistics of the topics the user has discussed.
     * The series is sorted in descending weight order. The most used topic appears first.
     * @param ctx The security context.
     * @return {Promise}
     */
    getUserTopics(ctx) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.topics.getUserTopics(ctx.userId).then(function(topics) {
                let mapped = _.map(topics, function(v, k) {
                    return {Type: k, Weight: v}
                });
                // most important first.
                mapped = _.reverse(_.sortBy(mapped, "Weight"));
                resolve(mapped);
            });
        });
    }

    /**
     * This adds the usage of a topic by the user.
     * The `getUserTopics` method returns the statistics created by this method.
     * Note that the lowercased version of the topic is added.
     * This also automatically calls the `addTopicHistory` method.
     * @param topicName {string|array<string>} The topic or array of topics to add.
     * @param ctx The security context.
     * @return {Promise}
     */
    addUserTopics(topicName, ctx) {
        return Promise.all([this.topics.addTopic(topicName, ctx.userId),
            this.topics.addTopicHistory(ctx.userId, topicName)]);
    }

    clearUserTopics(ctx) {
        return this.topics.clearUserTopics(ctx.userId);
    }

    /***
     * Fetches the standard topics.
     */
    static getStandardTopics() {
        //return JSON.parse(fs.readFileSync(standardTopicsPath, 'utf8'));
        return [
            "Computers",
            "Geography",
            "Science",
            "Movies",
            "Life",
            "People",
            "Finance",
            "Biology",
            "Sports",
            "Div",
            "Time",
            "Date",
            "Statistics",
            "Feelings",
            "Physics",
            "Music",
            "Location",
            "Name",
            "Astrology",
            "Education",
            "Personality",
            "Something cool"
        ];
    }

    /***
     * Merges the given set of topics with the standard set.
     * This catalog of topics minimizes the proliferation of topics
     * and should be used with neuralnet mappings.
     * @param topicNames
     */
    mergeStandardTopics(topicNames) {
        this.topics.getAllStandardTopics().then(function(data) {
            const currentSet = _.map(data, function(x) {
                return x.name;
            });
            for(let i = 0; i < topicNames.length; i++) {
                const topicName = topicNames[i];
                const found = _.find(currentSet, function(name) {
                    return name.toLowerCase() === topicName.toLowerCase();
                });
                if(!utils.isDefined(found)) {
                    this.services.storage.topics.addStandardTopic(topicName);
                }
            }
        });

    }

    removeAllStandardTopics() {
        return this.topics.removeAllStandardTopics();
    }

    addStandardTopic(name) {
        return this.topics.addStandardTopic(name);
    }

    standardTopicExists(name) {
        return this.topics.standardTopicExists(name);
    }

}
module.exports = Topics;
