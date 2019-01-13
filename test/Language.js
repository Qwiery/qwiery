const Language = require("../lib/Services/Language");
const _ = require("lodash");

exports.capture = function(test) {
    test.equal(Language.capture("username", "They call me John and I am 32 years old."), "John");
    test.done();
};


exports.parse = async function(test) {
    const what = await Language.getPOS("John likes the blue house at the end of the street.");
    const nouns = what.filter(function(x) {
        return x.tag === "NNS" || x.tag === "NN";
    }).map(function(x) {
        return x.word.toLowerCase();
    });
    test.equal(nouns.length, 3);
    test.deepEqual(nouns, ["house", "end", "street"]);
    test.done();
};

exports.unknowns = function(test) {
async function fetchUnknownNouns(input) {
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

    fetchUnknownNouns("The legendary king of Scotland was an abricedarity.").then(function(u) {
        test.equal(u.length, 1);
        test.equal(u[0], "abricedarity");
        test.done();
    });
};
