const utils = require('../../utils'),
    path = require('path'),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
const StorageDomainBase = require("../../Framework/StorageDomainBase");
/**
 * Storage specific to the Personality service.
 *
 * @class PersonalityStorage
 * @extends {StorageDomainBase}
 */
class PersonalityStorage extends StorageDomainBase {

    init(instantiator) {
        super.init(instantiator);
        return this.createCollections(
            {
                collectionName: "Personality",
                schema: {
                    userId: String,
                    personalities: [{
                        name: String,
                        value: Number
                    }]
                }
            });
    }

    /**
     * Adds the given personality or increases the count of the personality.
     * @param name {string} The name of the personality.
     * @param userId {String} The user id.
     * @return {Promise} Does not return anything.
     */
    addPersonality(userId, name) {
        const that = this;
        name = name.toLowerCase();
        return this.Personality.findOne({'userId': userId}).then(function(found) {
            if(utils.isDefined(found)) {
                const item = _.find(found.personalities, {name: name});
                if(item) {
                    item.value = item.value + 1;
                } else {
                    found.personalities.push({
                        name: name,
                        value: 1
                    });
                }
                that.Personality.upsert(found, {'userId': userId});
            } else {
                that.Personality.insert({
                    userId: userId,
                    personalities: [
                        {
                            name: name,
                            value: 1
                        }]
                });
            }
        });
    }

    /**
     * Returns the personality of the specified user.
     * @param userId {String} The user id.
     * @returns {Promise<T>}
     */
    getPersonalitySpectrum(userId) {
        return this.Personality.findOne({'userId': userId}).then(function(found) {
            if(_.isNil(found)) {
                return [];
            } else {
                return found.personalities;
            }
        });

    }


    /**
     * Returns all the personality value of a specific name.
     * @param userId {string} The user id.
     * @param name {string} The name of the personality.
     * @returns {Promise<number>}
     */
    getPersonalityValue(userId, name) {
        return this.getPersonalitySpectrum(userId).then(function(p) {
            const found = _.find(p, {name: name.toLowerCase()});
            if(_.isNil(found)) {
                return 0;
            } else {
                return found.value;
            }
        });
    }

    /**
     * Remove the personality of the specified user.
     * @param userId
     * @returns {Promise.<T>}
     */
    clearAllUserPersonality(userId) {
        return this.Personality.remove({userId: userId});
    }

    /**
     * Removes the specified personality name.
     * @param userId
     * @param name
     * @return {Promise}
     */
    clearUserPersonality(userId, name) {
        const that = this;
        return this.Personality.findOne({'userId': userId}).then(function(found) {
            if(utils.isDefined(found)) {
                _.remove(found.personalities, function(x) {
                    return x.name.toLowerCase() === name.toLowerCase();
                });
                that.Personality.upsert(found, {'userId': userId});
            }
        });
    }
}
module.exports = PersonalityStorage;