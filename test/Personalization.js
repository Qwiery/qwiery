const utils = require("../lib/utils");
const _ = require("lodash");
const testUtils = require("./TestUtils");
const ctx = {userId: utils.randomId()};

exports.Personalization = async function (test) {
    let Personalization = require("../lib/Services/Personalization");
    let p = new Personalization();

    let instantiator = await (testUtils.getInstantiator());

    await (p.init(instantiator));
    await (p.addPersonalization("Taste", "Sushi", ctx));
    let taste = await (p.getPersonalization("Taste", ctx));
    test.equal(taste, "Sushi");
    await (p.clearAllUserPersonalizations(ctx));
    test.done();

};

exports.addPersonalization = async function (test) {
    let Personalization = require("../lib/Services/Personalization");
    let p = new Personalization();

    let settings = {};

    let instantiator = await (testUtils.getInstantiator());

    await (p.init(instantiator));
    await (p.addPersonalization("color", "red", ctx));
    let color = await (p.getPersonalization("color", ctx));
    test.equal(color, "red");
    // upsert
    await (p.addPersonalization("color", "green", ctx));
    color = await (p.getPersonalization("color", ctx));
    test.equal(color, "green");

    await (p.addPersonalization("span", 155, ctx));
    let all = await (p.getUserPersonalizations(ctx));
    test.equal(all.length, 2);

    await (p.clearAllUserPersonalizations(ctx));
    all = await (p.getUserPersonalizations(ctx));
    test.equal(all.length, 0);

    test.done();
};

exports.enginePersonalization = async function (test) {
    let Personalization = require("../lib/Services/Personalization");
    let p = new Personalization();

    let instantiator = await (testUtils.getInstantiator());
    await (p.init(instantiator));
    await (p.addEnginePersonalization("color", "orange", "myapp"));
    const color = await (p.getEnginePersonalization("color", "myapp"));
    test.equal(color, "orange");
    test.done();
};
