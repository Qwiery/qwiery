const utils = require("../lib/utils"),
    Configurator = require("../lib/Configurator"),
    _ = require('lodash');
exports.defaultSettings = function(test) {
    const defaultConfig = require("../lib/config.default");
    const fused = Configurator.fuse(defaultConfig, {});
    test.deepEqual(fused, defaultConfig);
    test.done();
};


exports.importSettings = function(test) {
    let r = Configurator.importSettings([1, 2], [3, 4]);
    test.equal(r.length, 2);
    test.deepEqual(r, [3, 4]);
    r = Configurator.importSettings([1, 2], {
        strategy: "merge",
        items: [3, 4]
    });
    test.equal(r.length, 4);
    test.deepEqual(r, [1, 2, 3, 4]);

    test.throws(function() {
        r = Configurator.importSettings([1, 2], {
            strategy: "merge",
            x: [3, 4]
        });
    }, Error, "Items property missing.");
    r = Configurator.importSettings([1, 2], {

        items: [3, 4]
    });
    test.equal(r.length, 4);
    test.deepEqual(r, [1, 2, 3, 4]);
    r = Configurator.importSettings([1, 2], function(d) {
        test.deepEqual(d, [1, 2]);
        return [5, 6];
    });
    test.deepEqual(r, [5, 6]);
    test.done();
};

exports.fuse = function(test) {
    let r = Configurator.fuse({a: 1}, {b: 2});
    test.deepEqual(r, {a: 1, b: 2});

    r = Configurator.fuse({a: 1}, {a: 2});
    test.deepEqual(r, {a: 2});

    r = Configurator.fuse({apps: [3, 4]}, {apps: [2]});
    test.deepEqual(r, {apps: [2]});

    r = Configurator.fuse({apps: [3, 4]}, {apps: {strategy: "merge", items: [2]}});
    test.deepEqual(r, {apps: [3, 4, 2]});

    test.done();
};

exports.validatePlugins = function(test) {
    const set1 = {
        plugins: "not ok"
    };
    test.throws(function() {
            Configurator.validateCollection(set1);
        },
        Error,
        'plugins should be an array.'
    );
    const set2 = {
        plugins: {things: 44}
    };
    test.throws(function() {
            Configurator.validateCollection(set2);
        },
        Error,
        'plugins should be an array.'
    );
    const set3 = {};
    const conf = new Configurator(set3);
    test.equal(conf.settings.plugins.length, 0);
    const set4 = {
        plugins: [{things: 44}]
    };
    test.throws(function() {
            Configurator.validateCollection(set4);
        },
        Error,
        'Missing name.'
    );
    const set5 = {
        plugins: [{type: "Lupy"}]
    };
    test.throws(function() {
            Configurator.validateCollection(set5);
        },
        Error,
        'Missing type.'
    );
    const set6 = {
        plugins: [{name: "Lupy", type: "Yanni"}]
    };
    test.throws(function() {
            Configurator.validateCollection(set6);
        },
        Error,
        'Type is not one of allowed.'
    );
    const set7 = {
        plugins: [{name: "", type: "Yanni"}]
    };
    test.throws(function() {
            Configurator.validateCollection(set7);
        },
        Error,
        'Cannot have an empty name.'
    );
    const set8 = {
        plugins: [{name: "_ana", type: "Yanni"}]
    };
    test.throws(function() {
            Configurator.validateCollection(set8);
        },
        Error,
        'Name should be alphanumeric.'
    );
    const set9 = {
        plugins: [{name: "a$na", type: "Yanni"}]
    };
    test.throws(function() {
            Configurator.validateCollection(set9);
        },
        Error,
        'Name should be alphanumeric.'
    );
    const set10 = {
        plugins: [{name: "a1455na", type: "command", path: "/"}]
    };
    test.throws(function() {
            Configurator.validateCollection(set10);
        }, Error,
        'If path then no type.'
    );
    const set11 = {
        plugins: [{name: "a1455na", type: "command",}]
    };
    test.throws(function() {
            Configurator.validateCollection(set11);
        },
        'Missing "handle".'
    );
    const set12 = {
        plugins: [{
            name: "a1455na", type: "command", handle: function() {
            }, canHandle(input) {
                return false;
            }
        }]
    };
    try {
        Configurator.validateCollection(set12);
        test.equal(set12.plugins[0]._pluginSource, "inline");
    } catch(e) {
        test.fail(e.message)
    }

    const set13 = {
        plugins: ["InternalThing"]
    };
    try {
        Configurator.validateCollection(set13);
    } catch(e) {
        test.fail(e.message)
    }

    const set14 = {
        plugins: [{
            path: "/anaconda"
        }]
    };
    try {
        Configurator.validateCollection(set14);
        test.equal(set14.plugins[0]._pluginSource, "external");
    } catch(e) {
        test.fail(e.message)
    }
    const set15 = {
        plugins: ["Amy", "Ammy", "Amy"]
    };
    test.throws(function() {
            Configurator.validateCollection(set15);
        },
        'Duplicates".'
    );

    const set16 = {
        plugins: ["Amy", "X55", {
            name: "Amy",
            type: "interpreter",
            processMessage: function(session) {
            }
        }]
    };
    try {
        Configurator.validateCollection(set16);
    } catch(e) {
        console.log(e.message);
    }
    test.throws(function() {
            Configurator.validateCollection(set16);
        },
        'Duplicates.'
    );
    test.done();
};

exports.validateDefaultApp = function(test) {
    const set1 = {
        defaultApp: "akl",
        apps: ["Goiku"]
    };
    test.throws(function() {
            Configuration.validateDefaultApp(set1);
        },
        'The defaultApp is not an existing one.'
    );
    const set2 = {
        defaultApp: "akl",
        apps: ["akl"]
    };
    try {
        Configurator.validateApps(set2);
        Configurator.validateDefaultApp(set2);
    } catch(e) {
        test.fail(e.message)
    }
    const set3 = {
        defaultApp: "app1",
        apps: [{
            name: "app1",
            id: "244"
        }]
    };
    try {
        Configurator.validateApps(set3);
        Configurator.validateDefaultApp(set3);
    } catch(e) {
        test.fail(e.message)
    }
    test.done();
};