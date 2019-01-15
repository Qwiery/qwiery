const Qwiery = require('../lib'),
    utils = require('../lib/utils'),
    texturize = require('../lib/texturize'),
    path = require('path'),
    _ = require('lodash');
exports.tracing = function (test) {
    const qwiery = new Qwiery();
    qwiery.ask('hello', {userId: 'Sharon', trace: true}).then(function (s) {
        const hb = utils.getTraceItem(s.Trace, 'HandledBy');
        test.ok(utils.isDefined(hb));
        console.log('Answer: ' + texturize.extractSimple(s));
        console.log('Handled by: ' + hb);
        test.done();
    });
};
/**
 * In this case the app cannot be used, because even the Pipeline service is not defined.
 */
exports.dumb = function (test) {
    const settings = {
        defaultApp: 'dumb',
        apps: [
            {
                name: 'dumb',
                id: 'dumb',
                pipeline: [
                    {
                        processMessage: function (session) {
                            if (session.Handled) return session;
                            return 'The time is now ' + new Date();
                        }
                    }
                ]
            }
        ],
        system: {
            coreServices: [],
            coreInterpreters: []
        }
    };

    const qwiery = new Qwiery(settings);
    qwiery.askFlat('hello', {userId: 'Sharon'}).then(function (answer) {
        console.log(answer);
        test.ok(answer.indexOf('is not defined') >= 0);
        test.done();

    });
};

exports.mostBasic = function (test) {
    const qwiery = new Qwiery();
    qwiery.ask('test', {userId: 'Sharon'}).then(function (s) {
        console.log(texturize.extractFlat(s));
        test.done();
    });
};

/**
 * When checkIdentity is true the user is checked
 * which in this case leads to an Error.
 * After registering the user things are OK.
 */
exports.checkIdentity = function (test) {
    const qwiery = new Qwiery({
        system: {
            checkIdentity: true
        }
    });
    test.expect(1);
    let userId = utils.randomId();
    qwiery.ask('test1', {userId: userId}).catch(function (e) {
        console.log(e.message);
        test.ok(true); // to satisfy expect(1) and ensure the exception was rasied
    }).then(function () {
        qwiery.services.identity.registerLocal(userId + '@qwiery.com', '123').then(function (newUser) {
            qwiery.ask('test2', {userId: newUser.id}).then(function () {
                test.done();
            });
        });
    });

};

/**
 * Inline pipeline processing.
 */
exports.inlinePipeliner = function (test) {
    const qwiery1 = new Qwiery({
        defaultApp: 'Q1',
        apps: [{
            'id': 'q1',
            'name': 'Q1',
            'pipeline': [
                {
                    processMessage: function (session) {
                        session.Output.Answer = 'Q1';
                        session.Handled = true;
                        session.Trace.push({'HandledBy': 'Inline'});
                        return Promise.resolve(session);
                    }
                }
            ]
        }]
    });
    qwiery1.ask('@Q1 hello', {userId: 'Sharon'}).then(function (s) {
        const answ = texturize.extractFlat(s);
        test.equal(answ, 'Q1');
        test.done();
    });
};

exports.externalInterpreterPlugin = function (test) {
    const q = new Qwiery({
        defaults: {
            pipeline: [
                'r11'
            ]
        },
        plugins: [
            {
                name: 'R11',
                path: path.join(__dirname, './plugins/RandomIntInterpreter')
            }
        ]
    });
    q.askFlat('Whatever...', {userId: 'Pete'}).then(function (a) {
        console.log(a);
        const n = parseInt(a);
        test.ok(!_.isNaN(a));
        test.done();
    });
};

exports.inlineInterpreterPlugin = function (test) {
    const q = new Qwiery({
        defaults: {
            pipeline: [
                'inter'
            ]
        },
        plugins: [
            {
                type: 'interpreter',
                name: 'inter',
                processMessage: function (session) {
                    session.Output.Answer = 'Yes sir!.';
                    session.Handled = true;
                    session.Trace.push({'HandledBy': 'Inline'});
                    return Promise.resolve(session);
                }
            }
        ]
    });
    q.askFlat('Call a cab please', {userId: 'Pete'}).then(function (a) {
        console.log(a);
        test.equal(a, 'Yes sir!.');
        test.done();
    });

};

exports.servicePlugin = function (test) {
    const q = new Qwiery({
        plugins: [
            {
                path: path.join(__dirname, './plugins/HelloService')
            }
        ]
    });
    test.ok(utils.isDefined(q.services.hello));
    test.equal(q.services.hello.say(), 'Hello');
    test.done();
};

exports.noAnswerFallback = function (test) {
    const noAnswer = utils.randomId();
    const q = new Qwiery({
        defaultApp: 'john',

        apps: [{
            id: 'john',
            name: 'john',
            noAnswer: noAnswer,
            pipeline: []
        }]
    });
    q.askFlat('anything', {userId: 'Anna'}).then(function (answer) {
        test.equal(answer, noAnswer);
        test.done();

    });
};

exports.custom2 = function (test) {
    // Q2 uses the RandomAnswer pipeline
    const qwiery2 = new Qwiery({
        defaultApp: 'Q2',
        apps: [{
            'id': 'q2',
            'name': 'Q2'
        }]
    });
    console.log(qwiery2.services.names);
    qwiery2.ask('@Q2 hello', {userId: 'Sharon'}).then(function (s) {
        const answ = texturize.extractSimple(s);
        console.log('>> ' + answ);
        test.ok(answ.length > 0);
        test.done();
    });
};

exports.missingApp = function (test) {
    const qwiery = new Qwiery();
    test.expect(1);
    qwiery.ask('@xx Hello XX!', {userId: 'Sharon'}).then(function (s) {
        const answ = texturize.extractSimple(s);
        console.log(answ);
        test.ok(answ.indexOf('does not exist') > -1);
        test.done();
    });
};

exports.config = function (test) {
    const defaultConfig = require('../lib/config.default');
    const qwiery = new Qwiery();
    test.deepEqual(qwiery.settings.apps, defaultConfig.apps);
    test.deepEqual(qwiery.settings.defaults, defaultConfig.defaults);
    test.done();
};

exports.newSession = async function (test) {
    const qwiery = new Qwiery();
    try {
        await qwiery._createNewSession(undefined, {});
        test.ok(false);
    } catch (e) {
        test.ok(true);
    }
    try {
        await qwiery._createNewSession(undefined, {userId: 4});
        test.ok(false);
    } catch (e) {
        test.ok(true);
    }
    try {
        await qwiery._createNewSession('hello');
        test.ok(false);
    } catch (e) {
        test.ok(true);
    }

    const q = utils.randomId();
    qwiery._createNewSession(q, {userId: 'ikke'}).then(function (session) {
        test.equal(session.Input.Raw, q);
        test.deepEqual(session.Context, {userId: 'ikke', appId: 'default'});
        test.equal(session.Key.UserId, 'ikke');
        test.done();
    });
};

exports.parseForEntities = function (test) {
    const qwiery = new Qwiery();
    const entities = Qwiery._parseForEntities('Look at this #first and @second and http://third.com.');
    test.equal(entities.mentions.length, 1);
    test.equal(entities.mentions[0], 'second');
    test.equal(entities.links.length, 1);
    test.equal(entities.links[0], 'http://third.com');
    test.equal(entities.cashtags.length, 0);
    test.equal(entities.hashtags.length, 1);
    test.equal(entities.hashtags[0], 'first');
    test.done();
};

exports.oraclesInConfig = function (test) {
    // if you specify an oracle in the app it replaces
    // whatever there is in the backend.
    const qwiery = new Qwiery({
        defaultApp: 'Elli',
        apps: [
            {
                id: 'Elli',
                name: 'Elli',
                oracle: [{
                    'Id': '23452',
                    'Questions': ['Cool'],
                    'Template': {
                        'Answer': {
                            '%if': '3>2',
                            '%then': 'Isn\'t it?'
                        }
                    },
                    'UserId': 'Everyone',
                    'Category': 'Special'
                }]
            }
        ],
        defaults: {
            pipeline: [
                'Edictor'
            ]
        },
        system: {
            coreInterpreters: ['Spam', 'RandomAnswers', 'Edictor'],
        }
    });
    qwiery.ask('Cool', {userId: 'Sharon'}).then(function (s) {
        console.log(texturize.extractFlat(s));
        test.equal(s.Output.Answer[0].Content, 'Isn\'t it?');
        test.done();
    });
};

/**
 * This shows that you can use the incoming language as
 * a criterium to answer differently.
 * @param test
 */
exports.languageDependent = function (test) {
    const qwiery = new Qwiery({
        defaultApp: 'Elli',
        apps: [
            {
                id: 'Elli',
                name: 'Elli',
                oracle: [{
                    'Id': '23452',
                    'Questions': ['Wat vind jij er van?'],
                    'Template': {
                        'Answer': {
                            '%if': 'language==\'dutch\'',
                            '%then': 'Ja, vind ik ook.',
                            '%else': 'Well, how interesting.'
                        }
                    },
                    'UserId': 'Everyone',
                    'Category': 'Special'
                }]
            }
        ],
        defaults: {
            pipeline: [
                'Parsers',
                'Edictor'
            ]
        },
        system: {
            coreInterpreters: ['Spam', 'Parsers', 'RandomAnswers', 'Edictor'],
        }
    });
    qwiery.ask('Wat vind jij er van?').then(function (s) {
        test.equal(s.Output.Answer[0].Content, 'Ja, vind ik ook.');
        test.done();
    });
};


exports.multiEngine = function (test) {
    // testing that each Qwiery instance has its own services
    const set1 = {
        'plugins': [
            {
                type: 'service',
                name: 'S',
                method: function () {
                    return 1;
                }
            }
        ]
    };
    const set2 = {
        'plugins': [
            {
                type: 'service',
                name: 'S',
                method: function () {
                    return 2;
                }
            }
        ]
    };
    const q1 = new Qwiery(set1);
    const q2 = new Qwiery(set2);
    // plugins are available as lowercase!
    test.ok(utils.isDefined(q1.services.s));
    test.ok(utils.isDefined(q2.services.s));
    test.equal(q1.services.s.method(), 1);
    test.equal(q2.services.s.method(), 2);
    test.done();
};

/**
 * Answers can be single strings, plain objects or arrays.
 * Note that the answer always returns an array.
 * If the template answer is a string it will be converted to
 * a plain Text object.
 */
exports.multianswer = function (test) {

    const ctx = {userId: utils.randomId()};
    const settings = {
        defaultApp: 'Jonas',
        apps: [
            {
                name: 'Jonas',
                id: 'Jonas',
                oracle: [
                    {
                        'Template': {
                            'Answer': [
                                {
                                    'String': 'Answer 1'
                                },
                                {
                                    'String': 'Answer 2'
                                }
                            ]
                        },
                        'Questions': [
                            'q1'
                        ]
                    },
                    {
                        'Template': {
                            'Answer': {
                                m: 1,
                                p: 2
                            }
                        },
                        'Questions': [
                            'q2'
                        ]
                    },
                    {
                        'Template': {
                            'Answer': '123'
                        },
                        'Questions': [
                            'q3'
                        ]
                    }
                ]
            }
        ]
    };
    const q = new Qwiery(settings);
    q.ask('q1', ctx).then(function (session) {
        test.ok(_.isArray(session.Output.Answer));
        test.equal(session.Output.Answer.length, 2);
        q.ask('q2', ctx).then(function (session) {
            test.ok(_.isPlainObject(session.Output.Answer[0]));
            test.equal(session.Output.Answer[0].p, 2);
            q.ask('q3', ctx).then(function (session) {
                test.ok(_.isPlainObject(session.Output.Answer[0]));
                test.equal(session.Output.Answer[0].Content, '123');
                test.done();
            });
        });

    });
};

exports.mostBasicTemplate = function (test) {

    const ctx = {userId: utils.randomId()};
    const settings = {
        defaultApp: 'Jonas',
        apps: [
            {
                name: 'Jonas',
                id: 'Jonas',
                oracle: [
                    {
                        Questions: 'What is time',
                        Template: {
                            Answer: 'Time is the essence of life.'
                        }
                    }
                ]
            }
        ]
    };
    const q = new Qwiery(settings);
    q.askFlat('What is time?', ctx).then(function (answer) {
        test.equal(answer, 'Time is the essence of life.');
        test.done();
    });
};

exports.questionArray = function (test) {

    let settings = {
        defaults: {
            pipeline: ['RandomAnswers']
        }
    };
    const q = new Qwiery(settings);
    q.ask(['A', 'B', 'C'], {userId: utils.randomId(), return: 'text'}).then(function (answers) {
        test.equal(answers.length, 3);
        console.log(answers);
        test.done();
    });
};

exports.detectLanguage = function (test) {
    const q = new Qwiery();
    q.ask('Dit is gewoon goed gemaakt').then(function (session) {
        test.equal(session.Language, 'dutch');
        test.done();
    });
};

exports.detectSentiment = function (test) {
    const q = new Qwiery();
    q.ask('Your answers are horrendously bad.').then(function (session) {
        test.ok(session.Sentiment < 0); // likely this is -2
        test.done();
    });
};

exports.keywords = async function (test) {
    const q = new Qwiery();
    const session = await q.ask('quantum physics is so cool.');
    test.equal(session.Keywords.length, 3);
    test.done();
};

exports.dateParsing = async function (test) {
    const qwiery = new Qwiery();
    const s = await qwiery.ask('I leave for Paris on the 22nd of March.', {userId: 'Sharon'});
    test.ok(s.Dates.length > 0);
    test.equal(s.Dates[0].date.toDateString(), new Date(2019, 2, 22).toDateString());
    test.done();
};

exports.parallization = function (test) {

    const ctx = {userId: utils.randomId()};
    const settings = {
        defaultApp: 'Par',
        apps: [
            {
                name: 'Par',
                id: 'Par',
                pipeline: [
                    [
                        {
                            name: 'A',
                            processMessage(session) {
                                session.Output.Answer = 'First';
                                return session;
                            }
                        },
                        {
                            name: 'B',
                            processMessage(session) {
                                return new Promise(function (resolve, reject) {
                                    // simulate remote service
                                    setTimeout(function () {
                                        session.Output.Answer = 'Second';
                                        resolve(session);
                                    }, 1700)
                                });
                            }
                        }
                    ]
                ]

            }
        ],

    };
    const q = new Qwiery(settings);
    q.ask('Whatever', ctx).then(function (ss) {
        test.equal(ss.Output.Answer.length, 2);
        test.equal(ss.Output.Answer[0], 'First');
        test.equal(ss.Output.Answer[1], 'Second');
        test.done();
    });
};
