const Mutator = require('../lib/Services/QTL/mutator');
const p = Mutator.mutate;

const _ = require('lodash');
const utils = require('../lib/utils');
const OracleService = require('../lib/Services/Oracle');

function min(a, b) {
    if (a < b) {
        return a;
    }
    return b;
}

function max(a, b) {
    if (a < b) {
        return b;
    }
    return a;
}

exports.basic = async function (test) {
    const templ = {'%join': ['a', 'b', 'c']};
    const result = await p(templ);
    test.equal(result, 'a b c');
    test.done();
};

exports.arrayAccesor = function (test) {
    let obj = {
        a: 2,
        b: [1, 2, 3]
    };
    let acc = Mutator._attachArrayAccessor(obj);
    // the array elements can be accessed as a function
    test.equal(acc['%b'](1), 2);
    test.equal(acc.a, 2);
    // the original remains in the context
    test.deepEqual(acc.b, [1, 2, 3]);
    test.done();
};

exports.one = async function (test) {
    let r = await p({z: 'one %name'}, {name: 'x'});
    test.deepEqual(r, {z: 'one x'});
    r = await p({z: 'one %name'}, {stuff: 'd'});
    // if unresolved it remains as-is
    test.deepEqual(r, {z: 'one %name'});
    r = await p({z: 'my name is %name:(Anna Smith)'}, {stuff: 'd'});
    // the brackets are necessary for defaults with spaces
    test.deepEqual(r, {z: 'my name is Anna Smith'});
    test.done();
};

exports.default = function (test) {
    p({z: '%x:4'}).then(function (v) {
        test.deepEqual(v, {z: '4'});
        test.done();
    });
};

exports.getPath = function (test) {
    let obj = ['a', 'b', 'c'];
    let r = utils.getJsonPath(obj, '2');
    test.equal(r, 'c');

    obj = {
        'a': 5,
        'b': [1, 5]
    };
    r = utils.getJsonPath(obj, 'b.1');
    test.equal(r, 5);
    test.done();
};

exports.getVariableParts = function (test) {
    let r = OracleService._getVariableParts('%113');
    test.deepEqual(r, {
        full: '%113',
        name: '113',
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

    r = OracleService._getVariableParts('%%summary');
    test.deepEqual(r, {
        full: '%%summary',
        name: 'summary',
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

    r = OracleService._getVariableParts('%stuff_Number');
    test.deepEqual(r, {
        full: '%stuff_Number',
        name: 'stuff',
        type: 'Number',
        isSystem: false,
        isEmpty: false,
        default: null,
        isNumeric: false,
        hasExtendedDefault: false,
        hasDefault: false,
        hasType: true,
        hasExtendedType: false
    });

    r = OracleService._getVariableParts('%stuff_(Number, something)');
    test.deepEqual(r, {
        full: '%stuff_(Number, something)',
        name: 'stuff',
        type: ['Number', 'something'],
        isSystem: false,
        isEmpty: false,
        default: null,
        isNumeric: false,
        hasExtendedDefault: false,
        hasDefault: false,
        hasType: true,
        hasExtendedType: true
    });

    r = OracleService._getVariableParts('%ikke:Lorenzo');
    test.deepEqual(r, {
        full: '%ikke:Lorenzo',
        name: 'ikke',
        type: null,
        default: 'Lorenzo',
        isSystem: false,
        isEmpty: false,
        isNumeric: false,
        hasExtendedDefault: false,
        hasDefault: true,
        hasType: false,
        hasExtendedType: false
    });

    r = OracleService._getVariableParts('%ikke:(around the corner!)');
    test.deepEqual(r, {
        full: '%ikke:(around the corner!)',
        name: 'ikke',
        type: null,
        default: 'around the corner!',
        isSystem: false,
        isNumeric: false,
        isEmpty: false,
        hasExtendedDefault: true,
        hasDefault: true,
        hasType: false,
        hasExtendedType: false
    });

    r = OracleService._getVariableParts('%HARP_X:TRIPOLAR');
    test.deepEqual(r, {
        full: '%HARP_X:TRIPOLAR',
        name: 'HARP',
        type: 'X',
        default: 'TRIPOLAR',
        isEmpty: false,
        isNumeric: false,
        hasExtendedDefault: false,
        isSystem: false,
        hasDefault: true,
        hasType: true,
        hasExtendedType: false
    });

    r = OracleService._getVariableParts('%HARP_(X,U):(TRIPOLAR 137)');
    test.deepEqual(r, {
        full: '%HARP_(X,U):(TRIPOLAR 137)',
        name: 'HARP',
        type: ['X', 'U'],
        default: 'TRIPOLAR 137',
        isEmpty: false,
        isSystem: false,
        isNumeric: false,
        hasExtendedDefault: true,
        hasDefault: true,
        hasType: true,
        hasExtendedType: true
    });

    r = OracleService._getVariableParts('%H5_');
    test.deepEqual(r, {
        full: '%H5_',
        name: 'H5',
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

    r = OracleService._getVariableParts('%H9:');
    test.deepEqual(r, {
        full: '%H9:',
        name: 'H9',
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

    r = OracleService._getVariableParts('Nothing to see here');
    test.equal(r, null);

    test.done();
};


exports.replaceInPath = function (test) {

    let obj = {x: 33};
    utils.deepReplace(obj, 44, 'x');
    test.equal(obj.x, 44);
    obj = {
        x: {
            y: {
                z: 12
            }
        }
    };
    utils.deepReplace(obj, 35, 'x.y.z');
    test.equal(obj.x.y.z, 35);

    obj = {
        x: {
            y: {
                z: 12
            }
        }
    };
    utils.deepReplace(obj, 35, 'x.y.z.u');
    test.equal(obj.x.y.z, 12);
    obj = {
        x: {
            y: {
                z: 12
            }
        }
    };
    // following will not work since the object reference cannot be changed in js
    const ret = utils.deepReplace(obj, 101, '.');
    test.equal(obj.x.y.z, 12);
    // but the returned one will always be correct
    test.equal(ret, 101);
    test.done();
};

exports.systemVariable = async function (test) {
    let c = await (p({z: 'one %%name'}, {name: 'x'}));
    test.deepEqual(c, {z: 'one %%name'});

    c = await (p({z: 'one %%name'}, {name: 'x', getSystemVariable: (m) => 'time'}));
    test.deepEqual(c, {z: 'one time'});

    c = await (p({z: 'one %%name for %x'}, {x: 'me', getSystemVariable: (m) => 'time'}));
    test.deepEqual(c, {z: 'one time for me'});

    c = await (p({z: 'one %%name for %x'}, {getVariable: (m) => Promise.resolve('her'), getSystemVariable: (m) => 'time'}));
    test.deepEqual(c, {z: 'one time for her'});

    test.done();
};

exports.string = function (test) {
    p('one %name', {name: 'x'}).then(function (v) {
        test.deepEqual(v, 'one x');
        test.done();
    });
};

exports.addAddress = function (test) {
    const template = {
        'Id': 'Pa9DqkVwIv',
        'Template': {
            'Answer': {
                'String': 'I have added this.'
            },
            'Think': {
                'Create': {
                    'Graph': {
                        'Nodes': [
                            {
                                'Title': '%1',
                                'DataType': 'Address',
                                'Id': 1
                            }
                        ],
                        'Links': []
                    }
                }
            }
        },
        'UserId': 'Everyone',
        'Category': 'Core',
        'Questions': 'add address: %1'
    };

    test.done();
};

exports.wildcard = function (test) {
    p('Hello %1.', {1: 'John'}).then(function (r) {
        test.equal(r, 'Hello John.');
        test.done();
    });
};

exports.pi = function (test) {
    const template = {id: '%{ Math.PI }'};
    const context = {clientId: '123', z: () => Math.PI, Math: Math};
    p(template, context).then(function (v) {
        test.deepEqual(v, {id: Math.PI.toString()});
        test.done();
    });

};

exports.func = function (test) {
    const template = {
        name: '%{ func("jim") }',
        username: '%{ func(a) }',
        age: '%{age()}'
    };
    const context = {
        a: 'Kop',
        age: () => 44,
        func: function (value) {
            return value;
        },
    };
    p(template, context).then(function (v) {
        test.deepEqual(v, {name: 'jim', username: 'Kop', age: 44});
        test.done();
    });

};

exports.arrayAccess = function (test) {
    const template = {id: '%{ arr[0] }', name: '%{ arr[2] }', count: '%{ arr[1] }'};
    const context = {arr: ['123', 248, 'doodle']};
    p(template, context).then(function (v) {
        test.deepEqual(v, {id: '123', name: 'doodle', count: '248'});
        test.done();
    });

};

exports.deepAccess = function (test) {
    const template = {image_version: '%{task.images[0].versions[0]}', name: '%{task.images[0].name}'};
    const context = {
        task: {
            images: [{versions: ['12.10'], name: 'ubuntu'}],
        },
    };
    p(template, context).then(function (v) {
        test.deepEqual(v, {image_version: '12.10', name: 'ubuntu'});
        test.done();
    });
};

exports.switchOne = async function (test) {
    const template = {
        a: {
            '%switch': '"case" + a',
            case1: 'a',
        }
    };
    const context = {a: '1'};
    let v = await p(template, context);
    test.deepEqual(v, {a: 'a'});
    test.done();

};

exports.thenthen = async function (test) {
    let template = {
        val: {
            '%if': 'key1 > key2',
            '%then': {
                b: {
                    '%if': 'key3 > key4',
                    '%then': '%{ x }',
                    '%else': '%{ y }',
                },
            },
            '%else': {b: 'failed'},
        },
    };

    const context = {key1: 2, key2: 1, key3: 4, key4: 3, x: 'a', y: 'b'};
    let v = await p(template, context);
    test.deepEqual(v, {val: {b: 'a'}});


    test.done();
};

exports.async = async function (test) {
    const template = {
        val: {
            '%eval': 'go()'
        },
    };

    const context = {go: () => Promise.resolve(10)};
    let r = await p(template, context);
    test.deepEqual(r, {val: 10});
    test.done();
};

exports.join1 = async function (test) {
    const template = {
        m: {
            '%join': [
                'all', 'is', 'well'
            ]
        }
    };
    let r = await (p(template));
    test.deepEqual(r, {m: 'all is well'});
    test.done();
};

exports.join2 = async function (test) {
    const template = {
        m: {
            '%join': [
                'all', {'%eval': 'is()'}, 'well'
            ]
        }
    };
    let r = await (p(template, {
        is: () => Promise.resolve('is')
    }));
    test.deepEqual(r, {m: 'all is well'});
    test.done();
};

exports.join3 = async function (test) {
    const template = {
        m: {
            '%join': [
                'all', {'%eval': 'a.b[1]'}, 'well'
            ]
        }
    };
    let r = await p(template, {
        a: {b: ['', 'is']}
    });
    test.deepEqual(r, {m: 'all is well'});

    r = await p({a: '%{2*9}'});
    test.deepEqual(r, {a: 18});
    test.done();
};

exports.join4 = async function (test) {
    const template = {
        m: {
            '%join': [
                'all',
                {
                    '%if': 'a.c==10',
                    '%then': 'is not',
                    '%else': 'is'
                },
                'well'
            ]
        }
    };
    let r = await (p(template, {
        a: {
            b: ['', 'is'],
            c: 12
        }
    }));
    test.deepEqual(r, {m: 'all is well'});
    test.done();
};

exports.join5 = async function (test) {
    let obj = {
        'x': {
            '%join': ['a', 'b', 'c']
        }
    };
    let r = await (p(obj));
    test.deepEqual(r, {x: 'a b c'});

    obj = {
        'x': {
            '%join': ['a', {
                '%join': ['2', '3']
            }, 'c']
        }
    };
    r = await (p(obj));
    test.deepEqual(r, {x: 'a 2 3 c'});

    obj = {
        'x': {
            '%join': ['a', {'%join': ['-']}, 'c']
        }
    };
    r = await (p(obj));
    test.deepEqual(r, {x: 'a - c'});
    test.done();
};

exports.singularEval = async function (test) {
    let r = await (p({'%eval': 'is()'}, {
        is: () => Promise.resolve('is')
    }));
    test.equal(r, 'is');
    test.done();
};

exports.singularIf = async function (test) {
    let r = await (p({'%if': '5>3', '%then': 7}, {
        is: () => Promise.resolve('is')
    }));
    test.equal(r, 7);
    test.done();
};

exports.random = async function (test) {
    let r = await (p({
        '%if': '5<12',
        '%then': {
            '%rand': [
                1, 2, 3, 4, 5
            ]
        }
    }));
    test.ok(_.isNumber(r));
    test.done();
};

exports.freeVars = function (test) {
    const template = {answer: 'The name is %name,%x'};
    const context = {name: 'P', x: 5};
    p(template, context).then(function (v) {
        test.equal(v['answer'], 'The name is P,5');
        test.done();
    });
};

exports.deepVars = function (test) {
    const template = {
        answer: {
            raw: [{
                a: '%name, your age is %age!'
            }]
        }
    };
    const context = {age: 45, name: 'Anna'};
    p(template, context).then(function (v) {
        test.deepEqual(v['answer'], {raw: [{a: 'Anna, your age is 45!'}]});
        test.done();
    });
};
exports.pi = function (test) {
    const template = {id: '%{ Math.PI }'};
    const context = {clientId: '123', z: () => Math.PI, Math: Math};
    p(template, context).then(function (v) {
        test.deepEqual(v, {id: Math.PI.toString()});
    });
    test.done();
};

exports.deepArray = function (test) {
    const template = {id: '%{ arr[0] }', name: '%{ arr[2] }', count: '%{ arr[1] }'};
    const context = {arr: ['123', 248, 'doodle']};
    p(template, context).then(function (v) {
        test.deepEqual(v, {id: '123', name: 'doodle', count: '248'});
        test.done();
    });
};

exports.upperString = function (test) {
    const template = {
        key1: '%{ toUpper( "hello world") }',
        key2: '%{  toLower(toUpper("hello world"))   }',
        key3: '%{   toLower(  toUpper(  text))  }',
    };
    const context = {
        toUpper: function (text) {
            return text.toUpperCase();
        },
        toLower: function (text) {
            return text.toLowerCase();
        },
        text: 'hello World',
    };
    const output = {
        key1: 'HELLO WORLD',
        key2: 'hello world',
        key3: 'hello world',
    };
    p(template, context).then(function (v) {
        test.deepEqual(v, output);
    });
    test.done();
};

exports.deepPropertyAccess = function (test) {
    const template = {image_version: '%{task.images[0].versions[0]}', name: '%{task.images[0].name}'};
    const context = {
        task: {
            images: [{versions: ['12.10'], name: 'ubuntu'}],
        },
    };
    p(template, context).then(function (v) {
        test.deepEqual(v, {image_version: '12.10', name: 'ubuntu'})
        test.done();
    });
};

exports.simpleIf1 = function (test) {
    const template = {
        a: {
            '%if': '1 < 2',
            '%then': 'a',
            '%else': 'b',
        },
    };
    const context = {};
    p(template, context).then(function (v) {
        test.deepEqual(v, {a: 'a'});
        test.done();
    });
};

exports.simpleIf2 = function (test) {
    const template = {
        a: {
            '%switch': '"case" + a',
            case1: 's',
        }
    };
    const context = {a: 1};
    p(template, context).then(function (v) {
        test.deepEqual(v, {a: 's'});
        test.done();
    });
};

exports.case1 = async function (test) {
    let template = {
        a: {
            '%switch': '"case" + b',
            case1: 'x',
            case2: 'z',
        }
    };
    const context = {a: '1', b: '2'};
    let v = await p(template, context);
    test.deepEqual(v, {a: 'z'});
    template = {
        a: {
            '%switch': {'%join': ['case', '%b']},
            'case 1': 'x',
            'case 2': 'z',
        }
    };
    try {
        v = await p(template, context);
        test.ok(false);
    } catch (e) {
        test.ok(true); // to be explicit
    } finally {
        test.done();
    }

};

exports.eval1 = async function (test) {
    const template = {
        value: [
            {'%eval': 'func(0)'},
            {'%eval': 'func(0)'},
            {'%eval': 'func(-1)'},
            {'%eval': 'func(-2)'},
            {'%eval': 'func(0)'},
            {'%eval': 'func(0)'},
            {'%eval': 'func(0)'},
            {'%eval': 'func(0)'},
            {'%eval': 'func(0)'},
            {'%eval': 'func(1+1)'},
        ]
    };
    let i = 0;
    const context = {
        func: function (x) {
            i += 1;
            return x + i;
        },
    };
    const output = {
        value: [1, 2, 2, 2, 5, 6, 7, 8, 9, 12],
    };
    let v = await p(template, context);
    test.deepEqual(v, output);

    // note that the whole %eval block is being replace.
    v = await p({'%eval': '(18+7)/5'});
    test.deepEqual(v, 5);

    // all objects used should be defined in the context, even the standard JS ones
    v = await p({'%eval': '41+ Math.sin(Math.PI/2)'}, {'Math': Math});
    test.deepEqual(v, 42);

    // custom functions work as well
    v = await p({'%eval': '41+ give(1)'}, {'give': (i) => i});
    test.deepEqual(v, 42);


    test.done();
};

exports.deepIf1 = function (test) {
    const template = {
        val: {
            '%if': 'key1 > key2',
            '%then': {
                b: {
                    '%if': 'key3 > key4',
                    '%then': '%{ x }',
                    '%else': '%{ z }',
                },
            },
            '%else': {b: 'failed'},
        },
    };
    const context = {key1: 2, key2: 1, key3: 4, key4: 3, x: 'a', z: 'b'};
    p(template, context).then(function (v) {
        test.deepEqual(v, {val: {b: 'a'}});
        test.done();
    });
};

exports.deepIf2 = function (test) {
    const template = {
        val: {
            '%if': 'key1 < key2',
            '%else': {
                b: {
                    '%if': 'key3 < key4',
                    '%then': '%{ foo }',
                    '%else': '%{ bar }',
                },
            },
            '%then': {b: 'failed'},
        },
    };

    const context = {key1: 2, key2: 1, key3: 4, key4: 3, foo: 'a', bar: 'b'};
    p(template, context).then(function (v) {
        test.deepEqual(v, {val: {b: 'b'}});
        test.done();
    });
};

exports.deepIf3 = function (test) {
    const template = {
        val: {
            '%if': 'key1 < key2',
            '%else': {
                b: {
                    '%if': 'key3 > key4',
                    '%then': {
                        c: {
                            '%if': 'key5 < key6',
                            '%then': 'abc',
                            '%else': '%{ bar }',
                        },
                    },
                    '%else': 'follow',
                },
            },
            '%then': {b: 'failed'},
        },
    };

    const context = {key1: 2, key2: 1, key3: 4, key4: 3, key5: 6, key6: 5, foo: 'a', bar: 'b'};
    p(template, context).then(function (v) {
        test.deepEqual(v, {val: {b: {c: 'b'}}});
        test.done();
    });
};

exports.deepIf4 = function (test) {
    const template = {
        a: {
            b: {
                '%if': '2 < 3',
                '%then': {'%eval': 'one()'},
                '%else': {'%eval': 'two()'},
            }
        }
    };
    const context = {
        one: () => 1,
        two: () => 2,
    };
    p(template, context).then(function (v) {
        test.deepEqual(v, {a: {b: 1}});
        test.done();
    });
};

exports.deepIf5 = function (test) {
    const template = {
        a: {
            b: {
                '%if': '2 > 3',
                '%then': {'%eval': 'one()'},
                '%else': {'%eval': 'two()'},
            }
        }
    };
    const context = {
        one: () => Promise.resolve(1),
        two: () => 2,
    };
    p(template, context).then(function (v) {
        test.deepEqual(v, {a: {b: 2}});
        test.done();
    });
};

exports.nestedEval = function (test) {
    const template = {a: {b: {'%eval': 'a.b'}}};
    const context = {
        a: {
            b: {
                c: {
                    d: 1,
                },
            },
        },
    };
    p(template, context).then(function (v) {
        test.deepEqual(v, {a: {b: {c: {d: 1}}}});
        test.done();
    });
};

exports.time = function (test) {
    const template = {
        enter: {
            '%if': 'isEvening()',
            '%then': ((new Date().getHours()) > 19) ? 'A' : 'B',
            '%else': ((new Date().getHours()) > 19) ? 'B' : 'A',
        }
    };

    p(template, {
        isEvening: () => {
            return (new Date().getHours()) > 19;
        }
    }).then(function (v) {
        test.deepEqual(v, {enter: 'A'});
        test.done();
    });
};

exports.interpolation = function (test) {
    const template = {
        a: {
            '%switch': '"case" + a',
            caseA: '%{ a }',
        }
    };
    const context = {a: 'A'};
    p(template, context).then(function (v) {
        test.deepEqual(v, {a: 'A'});
        test.done();
    });
};

exports.switchEval = function (test) {
    const template = {
        a: {
            '%switch': '"case" + a',
            caseA: {'%eval': 'obj'},
        }
    };
    const context = {a: 'A', obj: {b: 1}};
    p(template, context).then(function (v) {
        test.deepEqual(v, {a: {b: 1}});
        test.done();
    });
};

exports.joinWithService = function (test) {
    let context = {};
    const obj = {
        '%join': ['This is a number:', {
            '%service': {
                URL: 'http://randomprofile.com/api/api.php?countries=GBR&format=json',
                Path: 'profile.passportNumber'
            }
        }]
    };
    p(obj, context).then(function (v) {
        test.ok(_.isString(v));
        let n = parseInt(v.replace('This is a number: ', ''));
        test.ok(_.isNumber(n));
        test.done();
    });
};

exports.replaceServiceCalls = async function (test) {
    test.expect(5);
    const obj = {
        x: {
            '%service': {
                URL: 'http://randomprofile.com/api/api.php?countries=GBR&format=json',//http://api.qwiery.com/data/randomNumbers/10",
                Path: 'profile.age'
            }

        },
        y: {
            z: {
                '%service': {
                    URL: 'http://randomprofile.com/api/api.php?countries=GBR&format=json',
                    Path: 'profile.passportNumber'
                }
            }
        },
        z: 56
    };
    const replaced = await p(obj);
    test.ok(replaced.x !== undefined);
    test.ok(_.isNumber(parseInt(replaced.x)));
    test.ok(replaced.y.z !== undefined);
    test.ok(_.isNumber(parseInt(replaced.y.z)));
    test.equal(replaced.z, 56);
    test.done();

};
exports.workflow1 = function (test) {
    const obj = {
        'Template': {
            'Answer': 'ThinkResult',
            'Think': {
                'CreateReturn': {
                    'Workflow': {
                        Name: 'Ordering train ticket',
                        Quit: 'Right, let\'s forget about it shall we?',
                        States: {
                            start: {
                                type: 'yesno',
                                enter: 'So, you want to order a train ticket?',
                                accept: 'Let\'s do this...',
                                initial: true
                            },
                            where: {
                                type: 'qa',
                                enter: 'Where to?',
                                variable: 'destination'
                            },
                            when: {
                                type: 'qa',
                                enter: 'When do you wish to leave?'
                            },
                            stop: {
                                type: 'dummy',
                                enter: 'OK, all forgotten.',
                                final: true
                            },
                            ok: {
                                type: 'dummy',
                                enter: 'Right, all set. Will sent you the ticket by mail. %%summary',
                                final: true
                            }
                        },
                        Transitions: ['start->where', 'where->when', 'when->ok', 'start->stop, false']
                    }
                }
            }
        },
        'Questions': [
            'go'
        ]
    };
    p(obj).then(function (replaced) {
        test.ok(JSON.stringify(replaced).indexOf('%%summary') > -1);
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
