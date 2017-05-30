const
    Qwiery = require("qwiery"),
    ServiceBase = Qwiery.ServiceBase,
    StorageDomainBase = Qwiery.StorageDomainBase,
    utils = Qwiery.utils,
    Language = Qwiery.Language,
    _ = require('lodash');

/**
 * This is the storage class for the unknown nouns.
 * See the Qwiery tutorial on "How to store things".
 * @tutorial How_StoreThings
 */
class UnknownStorage extends StorageDomainBase {

    init(instantiator) {
        super.init(instantiator);
        return this.createCollection(
            {
                collectionName: "Unknowns",
                schema: {
                    word: String
                }
            })
    }

    upsertNoun(noun) {
        return this.Unknowns.upsert({word: noun}, {word: noun});
    }
}

/**
 * This is a service which picks out unknown nouns from
 * the input and stores it in a custom collection.
 * See the Qwiery tutorial on "How to store things".
 * @tutorial How_StoreThings
 */
class Unknowns extends ServiceBase {
    constructor() {
        super("unknowns");
    }

    init(instantiator) {
        super.init(instantiator);
        this.unknownStorage = new UnknownStorage(this.storage);
        return this.unknownStorage.init(instantiator);
    }

    async fetchUnknownNouns(input) {
        if(!_.isNil(input)) {
            const nouns = await Language.getNouns(input);
            if(nouns.length > 0) {
                const definitions = nouns
                    .map(async noun => ({
                        noun: noun,
                        definition: await Language.lookup(noun)
                    }));
                const what = await Promise.all(definitions);
                const unknowns = what
                    .filter(r => r.definition.length === 0)
                    .map(r => r.noun);
                return Promise.resolve(unknowns);
            }
        }
        return Promise.resolve([]);
    }

    async inspect(input) {
        const nouns = await this.fetchUnknownNouns(input);
        nouns.forEach(n => this.unknownStorage.upsertNoun(n));
    }
}

module.exports = Unknowns;