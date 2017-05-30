const Mutator = require('../lib/Services/QTL/mutator');
const p = Mutator.mutate;
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');
const _ = require('lodash');
const utils = require("../lib/utils");
const OracleService = require("../lib/Services/Oracle");
function min(a, b) {
    if(a < b) {
        return a;
    }
    return b;
}

function max(a, b) {
    if(a < b) {
        return b;
    }
    return a;
}

exports.arrayAccesor = function(test) {
    let obj = {
        a: 2,
        b: [1, 2, 3]
    };
    let acc = Mutator._attachArrayAccessor(obj);
    test.equal(acc["%b"](1), 2);
    test.equal(acc.a, 2);
    test.done();
};

exports.one = function(test) {
    p({z: "one %name"}, {name: "x"}).then(function(v) {
        test.deepEqual(v, {z: 'one x'});
        test.done();
    });
};

exports.default = function(test) {
    p({z: "%x:4"}).then(function(v) {
        test.deepEqual(v, {z: '4'});
        test.done();
    });
};

exports.getPath = function(test) {
    var obj = ["a", "b", "c"];
    var r = utils.getJsonPath(obj, "2");
    test.equal(r, "c");
    test.done();
};

exports.getVariableParts = function(test) {
    var r = OracleService._getVariableParts("%113");
    test.deepEqual(r, {
        full: "%113",
        name: "113",
        type: null,
        default: null,
        isSystem: false,
        isEmpty: false,
        isNumeric: true,
        hasExtendedDefault: false,
        hasType: false,
        hasDefault: false,
        hasExtendedType: false
    });

    r = OracleService._getVariableParts("%%summary");
    test.deepEqual(r, {
        full: "%%summary",
        name: "summary",
        type: null,
        default: null,
        isSystem: true,
        isNumeric: false,
        isEmpty: false,
        hasExtendedDefault: false,
        hasType: false,
        hasDefault: false,
        hasExtendedType: false
    });

    r = OracleService._getVariableParts("%stuff_Number");
    test.deepEqual(r, {
        full: "%stuff_Number",
        name: "stuff",
        type: "Number",
        isSystem: false,
        isEmpty: false,
        default: null,
        isNumeric: false,
        hasExtendedDefault: false,
        hasDefault: false,
        hasType: true,
        hasExtendedType: false
    });

    r = OracleService._getVariableParts("%stuff_(Number, something)");
    test.deepEqual(r, {
        full: "%stuff_(Number, something)",
        name: "stuff",
        type: ["Number", "something"],
        isSystem: false,
        isEmpty: false,
        default: null,
        isNumeric: false,
        hasExtendedDefault: false,
        hasDefault: false,
        hasType: true,
        hasExtendedType: true
    });

    r = OracleService._getVariableParts("%ikke:Lorenzo");
    test.deepEqual(r, {
        full: "%ikke:Lorenzo",
        name: "ikke",
        type: null,
        default: "Lorenzo",
        isSystem: false,
        isEmpty: false,
        isNumeric: false,
        hasExtendedDefault: false,
        hasDefault: true,
        hasType: false,
        hasExtendedType: false
    });

    r = OracleService._getVariableParts("%ikke:(around the corner!)");
    test.deepEqual(r, {
        full: "%ikke:(around the corner!)",
        name: "ikke",
        type: null,
        default: "around the corner!",
        isSystem: false,
        isNumeric: false,
        isEmpty: false,
        hasExtendedDefault: true,
        hasDefault: true,
        hasType: false,
        hasExtendedType: false
    });

    r = OracleService._getVariableParts("%HARP_X:TRIPOLAR");
    test.deepEqual(r, {
        full: "%HARP_X:TRIPOLAR",
        name: "HARP",
        type: "X",
        default: "TRIPOLAR",
        isEmpty: false,
        isNumeric: false,
        hasExtendedDefault: false,
        isSystem: false,
        hasDefault: true,
        hasType: true,
        hasExtendedType: false
    });

    r = OracleService._getVariableParts("%HARP_(X,U):(TRIPOLAR 137)");
    test.deepEqual(r, {
        full: "%HARP_(X,U):(TRIPOLAR 137)",
        name: "HARP",
        type: ["X", "U"],
        default: "TRIPOLAR 137",
        isEmpty: false,
        isSystem: false,
        isNumeric: false,
        hasExtendedDefault: true,
        hasDefault: true,
        hasType: true,
        hasExtendedType: true
    });

    r = OracleService._getVariableParts("%H5_");
    test.deepEqual(r, {
        full: "%H5_",
        name: "H5",
        type: null,
        isEmpty: false,
        default: null,
        isSystem: false,
        isNumeric: false,
        hasExtendedDefault: false,
        hasDefault: false,
        hasType: false,
        hasExtendedType: false
    });

    r = OracleService._getVariableParts("%H9:");
    test.deepEqual(r, {
        full: "%H9:",
        name: "H9",
        type: null,
        default: null,
        isSystem: false,
        isNumeric: false,
        isEmpty: false,
        hasExtendedDefault: false,
        hasDefault: false,
        hasType: false,
        hasExtendedType: false
    });

    test.done();
};


exports.replaceInPath = function(test) {

    var obj = {x: 33};
    utils.deepReplace(obj, 44, "x");
    test.equal(obj.x, 44);
    obj = {
        x: {
            y: {
                z: 12
            }
        }
    };
    utils.deepReplace(obj, 35, "x.y.z");
    test.equal(obj.x.y.z, 35);

    obj = {
        x: {
            y: {
                z: 12
            }
        }
    };
    utils.deepReplace(obj, 35, "x.y.z.u");
    test.equal(obj.x.y.z, 12);
    test.done();
};

exports.systemVariable = function(test) {
    const that = this;

    function runner() {
        let c = waitFor(p({z: "one %%name"}, {name: "x"}));
        test.deepEqual(c, {z: 'one %%name'});

        c = waitFor(p({z: "one %%name"}, {name: "x", getSystemVariable: (m) => "time"}));
        test.deepEqual(c, {z: 'one time'});

        c = waitFor(p({z: "one %%name for %x"}, {x: "me", getSystemVariable: (m) => "time"}));
        test.deepEqual(c, {z: 'one time for me'});

        c = waitFor(p({z: "one %%name for %x"}, {getVariable: (m) => Promise.resolve("her"), getSystemVariable: (m) => "time"}));
        test.deepEqual(c, {z: 'one time for her'});

        test.done();
    }

    return async(runner)();
};

exports.string = function(test) {
    p("one %name", {name: "x"}).then(function(v) {
        test.deepEqual(v, 'one x');
        test.done();
    });
};

exports.addAddress = function(test) {
    const template = {
        "Id": "Pa9DqkVwIv",
        "Template": {
            "Answer": {
                "String": "I have added this."
            },
            "Think": {
                "Create": {
                    "Graph": {
                        "Nodes": [
                            {
                                "Title": "%1",
                                "DataType": "Address",
                                "Id": 1
                            }
                        ],
                        "Links": []
                    }
                }
            }
        },
        "UserId": "Everyone",
        "Category": "Core",
        "Questions": "add address: %1"
    };

    test.done();
};

exports.wildcard = function(test) {
    p("Hello %1.", {1: "John"}).then(function(r) {
        test.equal(r, "Hello John.");
        test.done();
    });
};

exports.pi = function(test) {
    const template = {id: '%{ Math.PI }'};
    const context = {clientId: '123', z: () => Math.PI, Math: Math};
    p(template, context).then(function(v) {
        test.deepEqual(v, {id: Math.PI.toString()});
        test.done();
    });

};

exports.func = function(test) {
    const template = {
        name: '%{ func("jim") }',
        username: '%{ func(a) }',
        age: "%{age()}"
    };
    const context = {
        a: 'Kop',
        age: () => 44,
        func: function(value) {
            return value;
        },
    };
    p(template, context).then(function(v) {
        test.deepEqual(v, {name: 'jim', username: 'Kop', age: 44});
        test.done();
    });

};

exports.arrayAccess = function(test) {
    const template = {id: '%{ arr[0] }', name: '%{ arr[2] }', count: '%{ arr[1] }'};
    const context = {arr: ['123', 248, 'doodle']};
    p(template, context).then(function(v) {
        test.deepEqual(v, {id: '123', name: 'doodle', count: '248'});
        test.done();
    });

};

exports.deepAccess = function(test) {
    const template = {image_version: '%{task.images[0].versions[0]}', name: '%{task.images[0].name}'};
    const context = {
        task: {
            images: [{versions: ['12.10'], name: 'ubuntu'}],
        },
    };
    p(template, context).then(function(v) {
        test.deepEqual(v, {image_version: '12.10', name: 'ubuntu'});
        test.done();
    });
};

exports.switchOne = function(test) {
    const template = {
        a: {
            "%switch": '"case" + a',
            case1: 'a',
        }
    };
    const context = {a: '1'};
    p(template, context).then(function(v) {
        test.deepEqual(v, {a: 'a'});
        test.done();
    });

};

exports.thenthen = function(test) {
    const template = {
        val: {
            "%if": 'key1 > key2',
            "%then": {
                b: {
                    "%if": 'key3 > key4',
                    "%then": '%{ x }',
                    "%else": '%{ y }',
                },
            },
            "%else": {b: 'failed'},
        },
    };

    const context = {key1: 2, key2: 1, key3: 4, key4: 3, x: 'a', y: 'b'};
    p(template, context).then(function(v) {
        test.deepEqual(v, {val: {b: 'a'}});
        test.done();
    });
};

exports.async = function(test) {
    const that = this;

    function runner() {
        const template = {
            val: {
                "%eval": "go()"
            },
        };

        const context = {go: () => Promise.resolve(10)};
        let r = waitFor(p(template, context));
        test.deepEqual(r, {val: 10});
        // console.log(r);
        test.done();
    }

    return async(runner)();
};

exports.join1 = function(test) {
    const that = this;

    function runner() {
        const template = {
            m: {
                "%join": [
                    "all", "is", "well"
                ]
            }
        };
        let r = waitFor(p(template));
        test.deepEqual(r, {m: "all is well"});
        test.done();
    }

    return async(runner)();
};

exports.join2 = function(test) {
    const that = this;

    function runner() {
        const template = {
            m: {
                "%join": [
                    "all", {"%eval": "is()"}, "well"
                ]
            }
        };
        let r = waitFor(p(template, {
            is: () => Promise.resolve("is")
        }));
        test.deepEqual(r, {m: "all is well"});
        test.done();
    }

    return async(runner)();
};

exports.join3 = function(test) {
    const that = this;

    function runner() {
        const template = {
            m: {
                "%join": [
                    "all", {"%eval": "a.b[1]"}, "well"
                ]
            }
        };
        let r = waitFor(p(template, {
            a: {b: ["", "is"]}
        }));
        test.deepEqual(r, {m: "all is well"});
        test.done();
    }

    return async(runner)();
};

exports.join4 = function(test) {
    const that = this;

    function runner() {
        const template = {
            m: {
                "%join": [
                    "all",
                    {
                        "%if": "a.c==10",
                        "%then": "is not",
                        "%else": "is"
                    },
                    "well"
                ]
            }
        };
        let r = waitFor(p(template, {
            a: {
                b: ["", "is"],
                c: 12
            }
        }));
        test.deepEqual(r, {m: "all is well"});
        test.done();
    }

    return async(runner)();
};

exports.join5 = function(test) {

    const that = this;

    function runner() {
        let obj = {
            "x": {
                "%join": ["a", "b", "c"]
            }
        };
        let r = waitFor(p(obj));
        test.deepEqual(r, {x: "a b c"});

        obj = {
            "x": {
                "%join": ["a", {
                    "%join": ["2", "3"]
                }, "c"]
            }
        };
        r = waitFor(p(obj));
        test.deepEqual(r, {x: "a 2 3 c"});

        obj = {
            "x": {
                "%join": ["a", {"%join": ["-"]}, "c"]
            }
        };
        r = waitFor(p(obj));
        test.deepEqual(r, {x: "a - c"});
        test.done();
    }

    return async(runner)();
};

exports.singularEval = function(test) {
    function runner() {
        let r = waitFor(p({"%eval": "is()"}, {
            is: () => Promise.resolve("is")
        }));
        test.equal(r, "is");
        test.done();
    }

    return async(runner)();
};

exports.singularIf = function(test) {
    function runner() {
        let r = waitFor(p({"%if": "5>3", "%then": 7}, {
            is: () => Promise.resolve("is")
        }));
        test.equal(r, 7);
        test.done();
    }

    return async(runner)();
};

exports.random = function(test) {
    function runner() {
        let r = waitFor(p({
            "%if": "5<12",
            "%then": {
                "%rand": [
                    1, 2, 3, 4, 5
                ]
            }
        }));
        test.ok(_.isNumber(r));
        test.done();
    }

    return async(runner)();
};

exports.freeVars = function(test) {
    const template = {answer: "The name is %name,%x"};
    const context = {name: "P", x: 5};
    p(template, context).then(function(v) {
        test.equal(v["answer"], 'The name is P,5');
        test.done();
    });
};

exports.deepVars = function(test) {
    const template = {
        answer: {
            raw: [{
                a: "%name, your age is %age!"
            }]
        }
    };
    const context = {age: 45, name: "Anna"};
    p(template, context).then(function(v) {
        test.deepEqual(v["answer"], {raw: [{a: "Anna, your age is 45!"}]});
        test.done();
    });
};
exports.pi = function(test) {
    const template = {id: '%{ Math.PI }'};
    const context = {clientId: '123', z: () => Math.PI, Math: Math};
    p(template, context).then(function(v) {
        test.deepEqual(v, {id: Math.PI.toString()});
    });
    test.done();
};

exports.deepArray = function(test) {
    const template = {id: '%{ arr[0] }', name: '%{ arr[2] }', count: '%{ arr[1] }'};
    const context = {arr: ['123', 248, 'doodle']};
    p(template, context).then(function(v) {
        test.deepEqual(v, {id: '123', name: 'doodle', count: '248'});
        test.done();
    });
};

exports.upperString = function(test) {
    const template = {
        key1: '%{ toUpper( "hello world") }',
        key2: '%{  toLower(toUpper("hello world"))   }',
        key3: '%{   toLower(  toUpper(  text))  }',
    };
    const context = {
        toUpper: function(text) {
            return text.toUpperCase();
        },
        toLower: function(text) {
            return text.toLowerCase();
        },
        text: 'hello World',
    };
    const output = {
        key1: 'HELLO WORLD',
        key2: 'hello world',
        key3: 'hello world',
    };
    p(template, context).then(function(v) {
        test.deepEqual(v, output);
    });
    test.done();
};

exports.deepPropertyAccess = function(test) {
    const template = {image_version: '%{task.images[0].versions[0]}', name: '%{task.images[0].name}'};
    const context = {
        task: {
            images: [{versions: ['12.10'], name: 'ubuntu'}],
        },
    };
    p(template, context).then(function(v) {
        test.deepEqual(v, {image_version: '12.10', name: 'ubuntu'})
        test.done();
    });
};

exports.simpleIf1 = function(test) {
    const template = {
        a: {
            "%if": '1 < 2',
            "%then": 'a',
            "%else": 'b',
        },
    };
    const context = {};
    p(template, context).then(function(v) {
        test.deepEqual(v, {a: 'a'});
        test.done();
    });
};

exports.simpleIf2 = function(test) {
    const template = {
        a: {
            "%switch": '"case" + a',
            case1: 's',
        }
    };
    const context = {a: 1};
    p(template, context).then(function(v) {
        test.deepEqual(v, {a: 's'});
        test.done();
    });
};

exports.case1 = function(test) {
    const template = {
        a: {
            "%switch": '"case" + b',
            case1: 'x',
            case2: 'z',
        }
    };
    const context = {a: '1', b: '2'};
    p(template, context).then(function(v) {
        test.deepEqual(v, {a: 'z'});
        test.done();
    });
};
exports.eval1 = function(test) {
    const template = {
        value: [
            {"%eval": 'func(0)'},
            {"%eval": 'func(0)'},
            {"%eval": 'func(-1)'},
            {"%eval": 'func(-2)'},
            {"%eval": 'func(0)'},
            {"%eval": 'func(0)'},
            {"%eval": 'func(0)'},
            {"%eval": 'func(0)'},
            {"%eval": 'func(0)'},
            {"%eval": 'func(1+1)'},
        ]
    };
    let i = 0;
    const context = {
        func: function(x) {
            i += 1;
            return x + i;
        },
    };
    const output = {
        value: [1, 2, 2, 2, 5, 6, 7, 8, 9, 12],
    };
    p(template, context).then(function(v) {
        test.deepEqual(v, output);
        test.done();
    });
};

exports.deepIf1 = function(test) {
    const template = {
        val: {
            "%if": 'key1 > key2',
            "%then": {
                b: {
                    "%if": 'key3 > key4',
                    "%then": '%{ x }',
                    "%else": '%{ z }',
                },
            },
            "%else": {b: 'failed'},
        },
    };
    const context = {key1: 2, key2: 1, key3: 4, key4: 3, x: 'a', z: 'b'};
    p(template, context).then(function(v) {
        test.deepEqual(v, {val: {b: 'a'}});
        test.done();
    });
};

exports.deepIf2 = function(test) {
    const template = {
        val: {
            "%if": 'key1 < key2',
            "%else": {
                b: {
                    "%if": 'key3 < key4',
                    "%then": '%{ foo }',
                    "%else": '%{ bar }',
                },
            },
            "%then": {b: 'failed'},
        },
    };

    const context = {key1: 2, key2: 1, key3: 4, key4: 3, foo: 'a', bar: 'b'};
    p(template, context).then(function(v) {
        test.deepEqual(v, {val: {b: 'b'}});
        test.done();
    });
};

exports.deepIf3 = function(test) {
    const template = {
        val: {
            "%if": 'key1 < key2',
            "%else": {
                b: {
                    "%if": 'key3 > key4',
                    "%then": {
                        c: {
                            "%if": 'key5 < key6',
                            "%then": 'abc',
                            "%else": '%{ bar }',
                        },
                    },
                    "%else": 'follow',
                },
            },
            "%then": {b: 'failed'},
        },
    };

    const context = {key1: 2, key2: 1, key3: 4, key4: 3, key5: 6, key6: 5, foo: 'a', bar: 'b'};
    p(template, context).then(function(v) {
        test.deepEqual(v, {val: {b: {c: 'b'}}});
        test.done();
    });
};

exports.deepIf4 = function(test) {
    const template = {
        a: {
            b: {
                "%if": '2 < 3',
                "%then": {"%eval": 'one()'},
                "%else": {"%eval": 'two()'},
            }
        }
    };
    const context = {
        one: () => 1,
        two: () => 2,
    };
    p(template, context).then(function(v) {
        test.deepEqual(v, {a: {b: 1}});
        test.done();
    });
};

exports.deepIf5 = function(test) {
    const template = {
        a: {
            b: {
                "%if": '2 > 3',
                "%then": {"%eval": 'one()'},
                "%else": {"%eval": 'two()'},
            }
        }
    };
    const context = {
        one: () => Promise.resolve(1),
        two: () => 2,
    };
    p(template, context).then(function(v) {
        test.deepEqual(v, {a: {b: 2}});
        test.done();
    });
};

exports.nestedEval = function(test) {
    const template = {a: {b: {"%eval": 'a.b'}}};
    const context = {
        a: {
            b: {
                c: {
                    d: 1,
                },
            },
        },
    };
    p(template, context).then(function(v) {
        test.deepEqual(v, {a: {b: {c: {d: 1}}}});
        test.done();
    });
};

exports.time = function(test) {
    const template = {
        enter: {
            "%if": "isEvening()",
            "%then": ((new Date().getHours()) > 19)? "A" :"B",
            "%else": ((new Date().getHours()) > 19)? "B" :"A",
        }
    };

    p(template, {
        isEvening: () => {
            return (new Date().getHours()) > 19;
        }
    }).then(function(v) {
        test.deepEqual(v, {enter: "A"});
        test.done();
    });
};

exports.interpolation = function(test) {
    const template = {
        a: {
            "%switch": '"case" + a',
            caseA: '%{ a }',
        }
    };
    const context = {a: 'A'};
    p(template, context).then(function(v) {
        test.deepEqual(v, {a: "A"});
        test.done();
    });
};

exports.switchEval = function(test) {
    const template = {
        a: {
            "%switch": '"case" + a',
            caseA: {"%eval": 'obj'},
        }
    };
    const context = {a: 'A', obj: {b: 1}};
    p(template, context).then(function(v) {
        test.deepEqual(v, {a: {b: 1}});
        test.done();
    });
};

exports.joinWithService = function(test) {
    let context = {};
    const obj = {
        "%join": ["This is a number:", {
            "%service": {
                URL: "http://randomprofile.com/api/api.php?countries=GBR&format=json",
                Path: "profile.passportNumber"
            }
        }]
    };
    p(obj, context).then(function(v) {
        test.ok(_.isString(v));
        let n = parseInt(v.replace("This is a number: ", ""));
        test.ok(_.isNumber(n));
        test.done();
    });
};

exports.replaceServiceCalls = function(test) {
    test.expect(5);
    const obj = {
        x: {
            "%service": {
                URL: "http://randomprofile.com/api/api.php?countries=GBR&format=json",//http://api.qwiery.com/data/randomNumbers/10",
                Path: "profile.age"
            }

        },
        y: {
            z: {
                "%service": {
                    URL: "http://randomprofile.com/api/api.php?countries=GBR&format=json",
                    Path: "profile.passportNumber"
                }
            }
        },
        z: 56
    };
    p(obj).then(function(replaced) {
        test.ok(replaced.x !== undefined);
        test.ok(_.isNumber(parseInt(replaced.x)));
        test.ok(replaced.y.z !== undefined);
        test.ok(_.isNumber(parseInt(replaced.y.z)));
        test.equal(replaced.z, 56);
        test.done();
    });

};
exports.workflow1 = function(test) {
    const obj = {
        "Template": {
            "Answer": "ThinkResult",
            "Think": {
                "CreateReturn": {
                    "Workflow": {
                        Name: "Ordering train ticket",
                        Quit: "Right, let's forget about it shall we?",
                        States: {
                            start: {
                                type: "yesno",
                                enter: "So, you want to order a train ticket?",
                                accept: "Let's do this...",
                                initial: true
                            },
                            where: {
                                type: "qa",
                                enter: "Where to?",
                                variable: "destination"
                            },
                            when: {
                                type: "qa",
                                enter: "When do you wish to leave?"
                            },
                            stop: {
                                type: "dummy",
                                enter: "OK, all forgotten.",
                                final: true
                            },
                            ok: {
                                type: "dummy",
                                enter: "Right, all set. Will sent you the ticket by mail. %%summary",
                                final: true
                            }
                        },
                        Transitions: ["start->where", "where->when", "when->ok", "start->stop, false"]
                    }
                }
            }
        },
        "Questions": [
            "go"
        ]
    };
    p(obj).then(function(replaced) {
        test.ok(JSON.stringify(replaced).indexOf("%%summary") > -1);
        test.done();
    });

};

// exports.fromNow1 = function(test) {
//     const tk = require('timekeeper');
//     const date = new Date('2017-01-19T16:27:20.974Z');
//     tk.freeze(date);
//     const template = {time: {%fromNow: ''}};
//     const context = {};
//     p(template, context).then(function(v) {
//         test.deepEqual(v['time'], '2017-01-19T16:27:20.974Z');
//         tk.reset();
//         test.done();
//     });
// };
//
// exports.fromNow2 = function(test) {
//     const tk = require('timekeeper');
//     const date = new Date('2017-01-19T16:27:20.974Z');
//     tk.freeze(date);
//     const template = {time: {%fromNow: '2 days 3 hours'}};
//     const context = {};
//     p(template, context).then(function(v) {
//         test.deepEqual(v['time'], '2017-01-21T19:27:20.974Z');
//         tk.reset();
//         test.done();
//     });
// };
//
// exports.fromNow3 = function(test) {
//     const tk = require('timekeeper');
//     const date = new Date('2017-01-19T16:27:20.974Z');
//     tk.freeze(date);
//     const template = {time: {%fromNow: '-1 hours'}};
//     const context = {};
//     p(template, context).then(function(v) {
//         test.deepEqual(v['time'], '2017-01-19T16:27:20.974Z');
//         tk.reset();
//         test.done();
//     });
// };
