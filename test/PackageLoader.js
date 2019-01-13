const Loader = require("../lib/Services/PackageLoader");
const loader = new Loader();
const _ = require("lodash");
const path = require("path");
let counter = 0;
loader.services = {
    oracle: {
        loadFile(){
            counter += 1;
        }
    }
};

exports.noUrl = async function (test) {
    let logger = [];
    const r = await loader.getPackage("something", null, null, logger);
    test.ok(_.isNull(r.path));
    test.equal(logger.length, 1);
    test.ok(logger[0].indexOf("No rep") >= 0);
    test.done();
};

exports.noConnection = function(test) {
    let logger = [];
    loader.getPackage("something", null, "http://somewhere.com", logger)
        .catch(
            x => console.log(">>" + x)
        )
        .then(function(r) {
            test.ok(_.isNull(r.path));
            test.ok(logger[0].indexOf("does not") >= 0);
            test.done();

        }, function(e) {
            console.log(e);
        });
};

exports.loadOracle = function(test) {
    let logger = [];
    counter = 0;
    const baseOracleFiles = path.join(__dirname, "../PackageServer/Packages/base/1.0/Oracle");
    loader.loadOracle(baseOracleFiles, logger);
    test.equal(counter, 6);
    test.done();
};
