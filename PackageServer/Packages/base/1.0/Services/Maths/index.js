const
    Qwiery = require("qwiery"),
    ServiceBase = Qwiery.ServiceBase,
    utils = Qwiery.utils,
    _ = require('lodash');
/**
 * Some math utils.
 *
 * @class Maths
 * @extends {ServiceBase}
 */
class Maths extends ServiceBase {
    constructor() {
        super("maths");
    }

    /**
     * Gets an array of integers.
     * 
     * @param {number} [n=10] The length of the array to return.
     * @returns 
     * 
     * @memberof Maths
     */
    getArray(n = 10) {
        return _.range(n).map(function(x) {
            return parseInt(Math.random() * 1000);
        });
    }
}

module.exports = Maths;