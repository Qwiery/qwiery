const utils = require('../../utils'),
    path = require('path'),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
const StorageDomainBase = require("../../Framework/StorageDomainBase");
const PersonalityStorage = require("./PersonalityStorage");
/**
 * Manages the personalization of users and the engine.
 *
 * @class Personalization
 * @extends {ServiceBase}
 * @see {@tutorial Personalization}
 */
class Personality extends ServiceBase {
    /**
     * Creates an instance of Personality.
     * @param {any} settings
     *
     * @memberOf Personality
     */
    constructor(settings) {
        super();
        this.pluginName = "personality";
    }

    /**
     * @inheritdoc
     */
    init(instantiator) {
        super.init(instantiator);
        this.personality = new PersonalityStorage(this.storage);
        return this.personality.init(instantiator);
    }

    addPersonality(name, ctx) {
        return this.personality.addPersonality(ctx.userId, name);
    }

    getPersonalitySpectrum(ctx) {
        return this.personality.getPersonalitySpectrum(ctx.userId);
    }

    getPersonalityValue(name, ctx) {
        return this.personality.getPersonalityValue(ctx.userId, name);
    }

    clearAllUserPersonality(ctx) {
        return this.personality.getPersonalityValue(ctx.userId);
    }

    clearUserPersonality(name, ctx) {
        return this.personality.clearUserPersonality(ctx.userId, name);
    }
}
module.exports = Personality;