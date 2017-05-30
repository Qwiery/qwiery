const

    ServiceBase = require('../../../lib/Framework/ServiceBase'),
    _ = require('lodash');

class Hello extends ServiceBase {
    constructor(settings) {
        super(settings);
        this.pluginName = "hello";
    }

    say(){
        return "Hello";
    }
}

module.exports = Hello;