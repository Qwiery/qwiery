const utils = require('../lib/utils');
const _ = require('lodash');
const WorkflowState = require('../lib/Services/Workflows/WorkflowState');
const WorkflowLoader = require('../lib/Services/Workflows/WorkflowLoader');
const Workflow = require('../lib/Services/Workflows/Workflow');
const Workflows = require('../lib/Services/Workflows');
const path = require('path');
const testUtils = require('./TestUtils');

const Qwiery = require('../lib');

/**
 * Helper function returning predefined workflows.
 * @param name
 * @param onlyDefinition if true only JSON is returned instead of a wf instance
 * @returns {*}
 */
function getFlow(name, onlyDefinition = false) {
    const someFlows = {

        triple: {
            Name: 'Dummy flow',
            States: [
                {
                    name: 'A',
                    type: 'Dummy',
                    isInitial: true,
                    final: false
                },
                {
                    name: 'B',
                    type: 'Dummy',
                    initial: false,
                    final: false
                },
                {
                    name: 'C',
                    type: 'Dummy',
                    initial: false,
                    final: true
                }
            ],
            Transitions: ['A->B', 'B-> C']
        },
        transient: {
            Name: 'Flow with transient state',
            States: [
                {
                    name: 'A',
                    type: 'Dummy',
                    isInitial: true
                },
                {
                    name: 'B',
                    type: 'Transient',
                    initial: false,
                    final: false
                },
                {
                    name: 'C',
                    type: 'Dummy',
                    initial: false,
                    final: true
                }
            ],
            Transitions: ['A->B', 'B-> C']
        },
        guessthenumber: {
            Name: 'Guess the number',
            Quit: 'XXX',
            States: [
                {
                    name: 'Guess',
                    type: 'CheckAnswer',
                    initial: true,
                    enter: 'Gimme the right number',
                    accept: 'Yeah!',
                    reject: 'Wrong guess',
                    parameters: {
                        expectedAnswer: '123'
                    }
                },
                {
                    name: 'Found',
                    type: 'YesNo',
                    enter: 'That was fun :) Do you want to have another go?'
                },
                {
                    name: 'Nope',
                    type: 'QA',
                    final: true,
                    enter: 'OK. No prob.'
                }
            ],
            Transitions: ['Guess->Found', 'Found->Nope, false', 'Found->Guess']
        },
        connectionstring: {
            Name: 'Connection string',
            States: {
                start: {
                    type: 'yesno',
                    enter: 'Do you want to create a connection string?',
                    initial: true
                },
                no: {
                    type: 'dummy',
                    enter: 'Okay, no prob.',
                    final: true
                },
                yes: {
                    type: 'dummy',
                    enter: 'Well, I am busy right now. Let\'s try later shall we?',
                    final: true
                }
            },
            Transitions: ['start->no, false', 'start->yes, true']
        },
        order: {
            Name: 'Ordering a ticket',
            States: {
                start: {
                    type: 'yesno',
                    enter: 'Do you want to order a train ticket?',
                    initial: true
                },
                no: {
                    type: 'dummy',
                    enter: 'Okay, just aksing.',
                    final: true
                },
                where: {
                    type: 'qa',
                    enter: 'Where to?',
                    variable: 'destination'
                },
                done: {
                    type: 'dummy',
                    enter: 'All set.',
                    final: true
                }
            },
            Transitions: [
                'start->no, false',
                'start->where, true',
                'where->done'
            ]
        },
        reintrance: {
            Name: 'Reintrance',
            States: {
                start: {
                    type: 'yesno',
                    enter: 'Do you want to move on?',
                    initial: true
                },
                no: {
                    type: 'dummy',
                    enter: 'Okay, just aksing.',
                    final: true
                },
                done: {
                    type: 'dummy',
                    enter: 'All set.',
                    final: true
                }
            },
            Transitions: [
                'start->no, false',
                'start->done, true'
            ]
        }
    };
    name = name.toLowerCase();
    if (someFlows[name]) {
        if (onlyDefinition === true) {
            return someFlows[name];
        } else {
            return new Workflow(someFlows[name]);
        }
    } else {
        throw new Error(`The predefined flow ${name} ain't there.`)
    }
}


exports.ticket2 = async function (test) {
    const settings = {
        defaultApp: 'Flower',
        apps: [
            {
                name: 'Flower',
                id: '123',
                'pipeline': [
                    'Spam',
                    'Parsers',
                    'Edictor',
                    'Flows'
                ],
                noAnswer: 'Cannot answer this',
                oracle: [
                    {
                        'Template': {
                            'Answer': 'ThinkResult',
                            'Think': {
                                'CreateReturn': {
                                    'Workflow': {
                                        Id: 'UnitTest',
                                        Name: 'Testing workflow answers',
                                        SaveReminder: false,
                                        Reminder: 'Unfinished business',
                                        Quit: '---',
                                        States: {
                                            start: {
                                                type: 'yesno',
                                                enter: 'Are you sure about this?',
                                                initial: true
                                            },
                                            ask: {
                                                type: 'qa',
                                                enter: 'When did this happen?',
                                            },
                                            oops: {
                                                type: 'dummy',
                                                enter: 'Don\'t talk about things you are not certain about...',
                                                final: true
                                            },
                                            stop: {
                                                type: 'dummy',
                                                enter: 'OK, I will look up based on this: \n %%summary',
                                                final: true
                                            }
                                        },
                                        Transitions: ['start->ask', 'ask->stop', 'start->oops, false']
                                    }
                                }
                            }
                        },
                        'Questions': [
                            'It happened'
                        ]
                    }
                ]
            }
        ],
        system: {
            'coreServices': [
                // {
                //     name: "MemoryStorage",
                //     /**
                //      * This defines how/where things are stored and accessed by the default file-based storage.
                //      */
                //     "filePath": path.join(__dirname, "QwieryDB.json"),
                //     "autosaveInterval": 5000,
                //     "autoload": true
                // },
                {
                    'name': 'MongoStorage',
                    'connection': 'mongodb://localhost:27017/QwieryDB'
                },
                'System',
                'Graph',
                'Topics',
                'Personalization',
                'Pipeline',
                'Oracle',
                'Identity',
                'Apps',
                'Workflows'
            ],
            coreInterpreters: ['Spam', 'Parsers', 'Edictor', 'Flows']
        }
    };
    let qwiery = new Qwiery(settings);

    const answers = await qwiery.run(['it happened', 'quit'], {userId: 'Swa', return: 'flat'});
    console.log(answers);
    test.equal(_.last(answers), '---');
    test.done();

};

exports.interrupt = async function (test) {
    const settings = {
        defaultApp: 'Flower',
        apps: [
            {
                name: 'Flower',
                id: '123',
                'pipeline': [
                    'Spam',
                    'Parsers',
                    'Edictor',
                    'Flows'
                ],
                noAnswer: 'Cannot answer this',
                oracle: [
                    {
                        'Template': {
                            'Answer': 'ThinkResult',
                            'Think': {
                                'CreateReturn': {
                                    'Workflow': {
                                        Id: 'UnitTest',
                                        Name: 'Testing workflow answers',
                                        SaveReminder: true,
                                        Reminder: 'Unfinished business',
                                        States: {
                                            start: {
                                                type: 'yesno',
                                                enter: 'Are you sure about this?',
                                                initial: true
                                            },
                                            ask: {
                                                type: 'qa',
                                                enter: 'When did this happen?',
                                            },
                                            oops: {
                                                type: 'dummy',
                                                enter: 'Don\'t talk about things you are not certain about...',
                                                final: true
                                            },
                                            stop: {
                                                type: 'dummy',
                                                enter: 'OK, I will look up based on this: \n %%summary',
                                                final: true
                                            }
                                        },
                                        Transitions: ['start->ask', 'ask->stop', 'start->oops, false']
                                    }
                                }
                            }
                        },
                        'Questions': [
                            'It happened'
                        ]
                    }
                ]
            }
        ],
        system: {
            coreServices: [
                {
                    'name': 'MongoStorage',
                    'connection': 'mongodb://localhost:27017/QwieryDB'
                },
                'System',
                'Graph',
                'Topics',
                'Personalization',
                'Pipeline',
                'Oracle',
                'Identity',
                'Apps',
                'Workflows'],

            coreInterpreters: ['Spam', 'Parsers', 'Edictor', 'Flows']
        }
    };
    const q = new Qwiery(settings);
    const answers = await q.run(['It happened', 'yes', 'quit', 'yes', 'run:workflow: UnitTest', 'This Monday.'], {userId: utils.randomId(), return: 'text'});
    test.equal(answers.length, 6);
    console.log(answers);
    test.done();
};

exports.workflowAnswer = async function (test) {
    const settings = {
        defaultApp: 'Flower',
        apps: [
            {
                name: 'Flower',
                id: '123',
                'pipeline': [
                    'Spam',
                    'Parsers',
                    'Edictor',
                    'Flows'
                ],
                noAnswer: 'Cannot answer this',
                oracle: [
                    {
                        'Template': {
                            'Answer': 'ThinkResult',
                            'Think': {
                                'CreateReturn': {
                                    'Workflow': {
                                        Name: 'Testing workflow answers',
                                        States: {
                                            start: {
                                                type: 'yesno',
                                                enter: 'Are you sure about this?',
                                                initial: true
                                            },
                                            ask: {
                                                type: 'qa',
                                                enter: 'When did this happen?',
                                            },
                                            oops: {
                                                type: 'dummy',
                                                enter: 'Don\'t talk about things you are not certain about...',
                                                final: true
                                            },
                                            stop: {
                                                type: 'dummy',
                                                enter: 'OK, I will look it up',
                                                final: true
                                            }
                                        },
                                        Transitions: ['start->ask', 'ask->stop', 'start->oops, false']
                                    }
                                }
                            }
                        },
                        'Questions': [
                            'It happened'
                        ]
                    }
                ]
            }
        ],
        system: {
            coreServices: [
                {
                    'name': 'MongoStorage',
                    'connection': 'mongodb://localhost:27017/QwieryDB'
                },
                'System',
                'Graph',
                'Topics',
                'Personalization',
                'Pipeline',
                'Oracle',
                'Identity',
                'Apps',
                'Workflows'],

            coreInterpreters: ['Spam', 'Parsers', 'Edictor', 'Flows']
        }
    };
    const q = new Qwiery(settings);
    const answers = await q.run(['It happened', 'yes', 'Last week'], {userId: utils.randomId(), return: 'text'});
    test.equal(answers.length, 3);
    console.log(answers);
    test.done();
};

exports.stateBasics = function (test) {
    const state = new WorkflowState();
    test.equal(state.isActive, false);

    // activation
    state.enterMessage = utils.randomId();
    let wasRaised = false;
    state.onActivate = function (msg, s) {
        test.equal(msg, state.enterMessage);
        test.equal(s, state);
        wasRaised = true;
    };
    state.activate(false);
    test.equal(wasRaised, false);
    state.activate(true);
    test.equal(wasRaised, true);

    // deactivate
    wasRaised = false;
    state.onDeactivate = function (msg, s) {
        test.equal(msg, state.deactivateMessage);
        test.equal(s, state);
        wasRaised = true;
    };
    state.deactivateMessage = utils.randomId();
    state.deactivate();
    test.equal(wasRaised, true);
    test.equal(state.isActive, false);

    // execute
    wasRaised = false;
    state.executeMessage = utils.randomId();
    const input = utils.randomId();
    state.onExecute = function (msg, inp, s) {
        test.equal(msg, state.executeMessage);
        test.equal(s, state);
        test.equal(inp, input);
        wasRaised = true;
    };
    test.throws(function () {
            state.execute(input);
        },
        'Should throw an error because the state is not active.'
    );
    test.equal(wasRaised, false);
    state.activate();
    wasRaised = false;
    state.execute(input);
    test.equal(wasRaised, true);

    // accept
    wasRaised = false;
    state.acceptMessage = utils.randomId();
    const transitionValue = utils.randomId();
    state.onAccept = function (msg, v, s) {
        test.equal(msg, state.acceptMessage);
        test.equal(s, state);
        test.equal(v, transitionValue);
        wasRaised = true;
    };
    state.accept(transitionValue);
    test.equal(wasRaised, true);

    // reject
    wasRaised = false;
    state.rejectMessage = utils.randomId();
    const reason = utils.randomId();
    state.onReject = function (msg, r, s) {
        test.equal(msg, r);
        test.equal(s, state);
        test.equal(r, reason);
        wasRaised = true;
    };
    // with a reason the msg is the given reason
    state.reject(reason);

    state.onReject = function (msg, r, s) {
        test.equal(msg, state.rejectMessage);
    };
    // without a reason the msg is the rejectMessage
    state.reject();

    test.equal(wasRaised, true);


    test.done();
};

exports.setVariables = function (test) {
    const wf = {};
    const state = new WorkflowState({
        name: 'ttf',
        workflow: wf
    });
    const value = utils.randomId();
    state.setVariable(value);
    test.equal(wf.variables.ttf, value);
    state.setVariable(value, 'kopp');
    test.equal(wf.variables.kopp, value);

    test.done();
};

exports.toJson = function (test) {
    const state = new WorkflowState({
        name: 'aks',
        enter: utils.randomId()
    });
    const json = state.toJSON();
    // does it use toJson?
    const cloned = _.clone(state);
    test.equal(state.enter, cloned.enter);
    test.equal(state.name, cloned.name);
    test.equal(json.name, state.name);
    test.equal(json.id, state.id);

    test.done();
};

exports.stateCtor = function (test) {
    const def = {
        enter: utils.randomId(),
        deactivateMessage: utils.randomId(),
        rejectionMessage: utils.randomId(),
        id: utils.randomId(),
    };
    const state = new WorkflowState(def);
    test.equal(state.id, def.id);
    test.equal(state.enter, def.enter);
    test.equal(state.deactivateMessage, def.deactivateMessage);
    test.equal(state.rejectionMessage, def.rejectionMessage);

    test.done();
};

exports.validateTopology = function (test) {
    let def = {
        Name: 'gof'
    };
    test.throws(function () {
            let wf = new Workflow(def);
        },
        'Missing everything.'
    );
    def.States = [];
    test.throws(function () {
            let wf = new Workflow(def);
        },
        'Missing Transitions.'
    );
    def.Transitions = [];
    test.throws(function () {
            let wf = new Workflow(def);
        },
        'Missing at least one state.'
    );

    test.done();
};

exports.replaceVariables = function (test) {
    let wf = getFlow('Triple');
    wf._variables = {
        a: 5,
        b: 7,
        c: 90
    };
    let input = 'Not true that var_a plus var_b is var_c!';
    let r = Workflow._replaceVariables(input, wf);
    test.equal(r, 'Not true that 5 plus 7 is 90!');
    test.done();
};

exports.start = async function (test) {
    let wf = getFlow('Triple');
    let session = Qwiery.newSession('hello');
    await wf.start(session);
    test.ok(wf._isActive === true);
    test.equal(wf.states.length, 3);
    test.equal(wf.transitions.length, 2);
    let single = wf.states[0];
    test.equal(single.isActive, true);
    let found = wf.findState('kk');
    test.ok(utils.isUndefined(found));
    found = wf.findState('A');
    test.ok(utils.isDefined(found));
    found = wf.findTransition('A', 9);
    test.ok(utils.isUndefined(found));
    found = wf.findTransition('A', true);
    test.ok(utils.isDefined(found) && found.to === 'B');
    test.ok(utils.isUndefined(wf.previousStateName));
    test.equal(wf.currentStateName, 'A');
    test.done();

};

exports.createInstance = function (test) {

    let state = WorkflowLoader.createInstance({type: 'DummyState', name: 'Juppo'});
    test.ok(utils.isDefined(state));
    let DummyState = require('../lib/Services/Workflows/States/Dummy');
    test.ok(state instanceof DummyState);
    test.equal(state.name, 'Juppo');
    test.done();
};

exports.nameDouble = function (test) {
    test.throws(function () {
            let wf = new Workflow({
                States: [
                    {
                        type: 'Dummy',
                        name: 'A'
                    },
                    {
                        type: 'Dummy',
                        name: 'a'
                    }
                ]
            })
        },
        'Cannot have duplicate names.'
    );
    test.done();
};

exports.noInitial = function (test) {

    test.throws(function () {
            let wf = new Workflow({

                States: [
                    {
                        type: 'Dummy',
                        name: 'A',
                        isFinal: true
                    },
                    {
                        type: 'Dummy',
                        name: 'B',
                        isInitial: true
                    }
                ]
            })
        },
        'Missing name property.'
    );
    test.done();
};

exports.twoInitial = function (test) {
    let passed = false;
    try {
        let wf = new Workflow({
            Name: 'aha',
            States: [
                {
                    type: 'Dummy',
                    name: 'A',
                    isFinal: true,
                    isInitial: true
                },
                {
                    type: 'Dummy',
                    name: 'B',
                    isInitial: true
                }
            ],

        })
    } catch (e) {
        // console.log(e.message);
        passed = true;
    }

    test.ok(passed === true);
    test.done();
};

exports.execute = function (test) {
    let wf = getFlow('Triple');
    let session = Qwiery.newSession('hello');
    wf.start(session).then(function () {
        test.ok(wf._isActive === true);
        wf.start(session).then(function () {
            test.equal(wf.previousStateName, 'A');
            test.equal(wf.currentStateName, 'B');
            test.done();

        });
    });
};

exports.activationMessages = function (test) {
    let wf = getFlow('Triple');
    wf.run(['begin', 'first', 'second']).then(function (spy) {
        test.deepEqual(spy.stateSequence, ['A', 'B', 'C']);
        test.done();
    });

};

// exports.Spy = function(test) {
//     let passed = false;
//     const fakeFlow = {
//         onQuit: function(msg, state) {
//             passed = true;
//             test.equal(state, 123);
//             test.equal(msg, "yes");
//         }
//     };
//     const spy = new WorkflowSpy(fakeFlow, true);
//     test.equal(spy.quitMessage, null);
//     fakeFlow.onQuit("yes", 123);
//     test.equal(spy.hasQuit, true);
//     test.equal(spy.quitMessage, "yes");
//     test.done();
// };

exports.yesno = function (test) {
    let wf = {
        Name: 'Yes/No ',
        States: [
            {
                name: 'A',
                type: 'yesno',
                isInitial: true
            },
            {
                name: 'B',
                type: 'dummy',
                isFinal: true
            }
        ],
        Transitions: [
            {
                from: 'A',
                to: 'B',
                value: true
            }
        ]
    };
    Workflow.run(wf, ['begin', 'bad', 'yes']).then(function (spy) {
        test.deepEqual(spy.stateSequence, ['A', 'B']);
        //console.log(spy.digest);
        test.done();
    });
};

exports.externalState = async function (test) {
    let wf = {
        Name: 'External state',
        States: [
            {
                name: 'A',
                path: path.join(__dirname, './states', 'Random'),
                isInitial: true
            },
            {
                name: 'B',
                type: 'dummy',
                isFinal: true
            }
        ],
        Transitions: [
            {
                from: 'A',
                to: 'B',
                value: true
            }
        ]
    };
    const spy = await Workflow.run(wf, ['begin', 'whatever']);
    test.deepEqual(spy.stateSequence, ['A', 'B']);
    let number = spy.flow.variables['randomNumber'];
    test.ok(utils.isDefined(number) && _.isNumber(number));
    test.done();
};

exports.guessTheNumber = function (test) {
    const flow = getFlow('GuessTheNumber');
    flow.run(['let\'s play', 'uh', '5', 15, 44, 66, 'quit']).then(function (spy) {
        //console.log(spy.digest);
        test.done();
    });
};

exports.quitFlow = function (test) {
    const flow = getFlow('GuessTheNumber');
    flow.run(['let\'s play', 'uh', 'quit']).then(function (spy) {
        // console.log(spy.digest);
        test.equal(_.last(spy.log)[1], 'XXX'); // the Quit of the flow
        test.done();

    });
};

exports.upsertLibraryItem = async function (test) {
    let item = {
        userId: 'Jonny',
        workflow: {
            Name: 'some workflow'
        },
        id: 'xip'
    };
    test.expect(1);
    let instantiator = await (testUtils.getInstantiator());
    let p = new Workflows();
    await (p.init(instantiator));
    await (p.upsertLibraryItem(item));
    let found = await (p.getLibraryItem(item.id));
    test.equal(found.workflow.Name, item.workflow.Name);
    test.done();
};

exports.simulate = async function (test) {
    const flow = getFlow('GuessTheNumber', true);
    let instantiator = await (testUtils.getInstantiator());
    let p = new Workflows();
    await (p.init(instantiator));
    p.run(flow, ['let\'s play', 'uh', '5', 15, 44, 66, 'quit']).then(function (spy) {
        // console.log(spy.digest);
        test.equal(spy.stateSequence.length, 1);
        test.equal(spy.hasQuit, true);
        test.done();
    });
};

exports.connectionstringSimple = function (test) {
    const flow = getFlow('connectionstring');
    flow.run(['I need to connect', 'yes']).then(function (spy) {
        //console.log(spy.digest);
        test.done();
    });
};

/**
 * This simulates the real thing with saved flow in backend.
 * At the end of this the flow is cleaned up so nothing remains
 * of this interaction.
 */
exports.connectionstringSaved = async function (test) {
    const flow = getFlow('connectionstring', true);
    let instantiator = await (testUtils.getInstantiator());
    let p = new Workflows();
    await (p.init(instantiator));
    p.run(flow, ['I need to connect', 'yes']).then(function (spy) {
        //console.log(spy.digest);
        test.equal(spy.stateSequence.length, 2);
        test.equal(spy.hasQuit, false);
        test.done();
    });
};

exports.ticket = async function (test) {
    const flow = getFlow('order', true);
    let instantiator = await (testUtils.getInstantiator());
    let p = new Workflows();
    await (p.init(instantiator));
    p.run(flow, ['Need a ticket', 'yes', '', 'London']).then(function (spy) {
        console.log(spy.digest);
        test.equal(spy.stateSequence.length, 3);
        test.equal(spy.hasQuit, false);
        test.equal(spy.flow.variables.destination, 'London');
        test.done();
    });
};

exports.reintranceOverflow = async function (test) {

    const flow = getFlow('Reintrance', true);

    let instantiator = await (testUtils.getInstantiator());
    let p = new Workflows();
    await (p.init(instantiator));
    p.run(flow, ['a', 'a', 'a', 'a', 'a', 'a']).then(function (spy) {
        console.log(spy.digest);
        test.equal(spy.stateSequence.length, 1);
        test.equal(spy.hasQuit, true);
        test.done();
    });
};

exports.transient = async function (test) {

    const flow = getFlow('Transient', true);

    let instantiator = await (testUtils.getInstantiator());
    let p = new Workflows();
    await (p.init(instantiator));
    const spy = await p.run(flow, ['go', 'A']);
    console.log(spy.digest);
    test.equal(spy.stateSequence.length, 3, 'Should pass three states.');
    test.equal(spy.variables.SideEffect, 'Hello there!', 'The transient state should set the variable.');
    test.done();
};

/**
 * The messages can be dynamic, based on the input.
 * This makes it easier to develop custom things without
 * custom states.
 */
exports.dynamicLogic = function (test) {
    const settings = {
        defaultApp: 'Flower',
        apps: [
            {
                name: 'Flower',
                id: '123',
                'pipeline': [
                    'Spam',
                    'Parsers',
                    'Edictor',
                    'Flows'
                ],
                noAnswer: 'Cannot answer this',
                oracle: [
                    {
                        'Template': {
                            'Answer': 'ThinkResult',
                            'Think': {
                                'CreateReturn': {
                                    'Workflow': {
                                        Name: 'Dynamic flow',
                                        States: [
                                            {
                                                name: 'A',
                                                type: 'Dummy',
                                                enter: 'Enter 1,2, or 3.',

                                                isInitial: true
                                            },
                                            {
                                                name: 'C',
                                                type: 'Dummy',

                                                enter: {
                                                    '%if': 'variables.A==\'1\'',
                                                    '%then': 'You said one.',
                                                    '%else': 'You did not say one.'
                                                },
                                                final: true
                                            }
                                        ],
                                        Transitions: ['A->C']
                                    }
                                }
                            }
                        },
                        'Questions': [
                            'go'
                        ]
                    }
                ]
            }
        ],
        system: {
            'coreServices': [
                // {
                //     name: "MemoryStorage",
                //     /**
                //      * This defines how/where things are stored and accessed by the default file-based storage.
                //      */
                //     "filePath": path.join(__dirname, "QwieryDB.json"),
                //     "autosaveInterval": 5000,
                //     "autoload": true
                // },
                {
                    'name': 'MongoStorage',
                    'connection': 'mongodb://localhost:27017/QwieryDB'
                },
                'System',
                'Graph',
                'Topics',
                'Personalization',
                'Pipeline',
                'Oracle',
                'Identity',
                'Apps',
                'Workflows'
            ],
            coreInterpreters: ['Spam', 'Parsers', 'Edictor', 'Flows']
        }
    };
    let qwiery = new Qwiery(settings);
    setTimeout(function () {
        qwiery.run(['go', '1'], {userId: 'Swa', return: 'text'}).then(function (answers) {
            console.log(answers);
            test.equal(_.last(answers).trim(), 'You said one.');
            test.done();
        });
    }, 300)

};

exports.forecast = async function (test) {
    const server = require('child_process').fork(path.join(__dirname, '../Faker'), {detached: true});
    server.send('start');
    await utils.sleep();
    const settings = {
        defaultApp: 'Forecaster',
        apps: [
            {
                name: 'Forecaster',
                id: 'Forecaster',
                'pipeline': [
                    'Spam',
                    'Parsers',
                    'Edictor',
                    'Flows'
                ],
                noAnswer: 'I\'m not made for this',
                oracle: [
                    {
                        'Template': {
                            'Answer': 'ThinkResult',
                            'Think': {
                                'CreateReturn': {
                                    'Workflow': {
                                        Name: 'Forecast flow',
                                        States: [
                                            {
                                                name: 'Where',
                                                type: 'QA',
                                                enter: 'For which location?',
                                                variable: 'location',
                                                isInitial: true
                                            },
                                            {
                                                name: 'Forecast',
                                                type: 'Dummy',
                                                enter: {
                                                    '%service': {
                                                        'Header': 'Current or specified location: %{variables.location}.',
                                                        'URL': `http://localhost:9002/weather/%{variables.location}`,
                                                        'Path': 'temperature'
                                                    }
                                                },
                                                final: true
                                            }
                                        ],
                                        Transitions: ['Where->Forecast']
                                    }
                                }
                            }
                        },
                        'Questions': [
                            'What %1 weather %2',
                            'Weather %1'
                        ]
                    }
                ]
            }
        ],
        system: {
            'coreServices': [

                {
                    'name': 'MongoStorage',
                    'connection': 'mongodb://localhost:27017/QwieryDB'
                },
                'System',
                'Graph',
                'Topics',
                'Personalization',
                'Pipeline',
                'Oracle',
                'Identity',
                'Apps',
                'Workflows'
            ],
            coreInterpreters: ['Spam', 'Parsers', 'Edictor', 'Flows']
        }
    };

    let qwiery = new Qwiery(settings);

    const answers = await qwiery.run(['weather', 'London'], {userId: 'Swa'}, false);
    console.log('Forecast answer: ' + JSON.stringify(answers[1].Output.Answer[1]));
    test.ok(parseInt(JSON.stringify(answers[1].Output.Answer[1])) > 0);
    console.log(answers[1].Output.Answer[0]);
    try {
        // if the server failed to start trying to stop it will raise an error
        server.send('stop');
        setTimeout(function () {
            server.kill();
            test.done();

        }, 500);
    }catch(e){}

};

exports.personalization = function (test) {
    const settings = {
        defaultApp: 'Emma',
        apps: [
            {
                name: 'Emma',
                id: 'Forecaster',
                'pipeline': [
                    'Spam',
                    'Parsers',
                    'Edictor',
                    'Flows'
                ],
                noAnswer: 'No need for more, I knew your preference already.',
                oracle: [
                    {
                        'Template': {
                            'Answer': 'ThinkResult',
                            'Think': {
                                'CreateReturn': {
                                    'Workflow': {
                                        Name: 'Hello flow',
                                        States: [
                                            {
                                                name: 'Switch',
                                                type: 'decision',
                                                transition: '%{hasPersonalization(\'favcolor\')}',
                                                initial: true
                                            },
                                            {
                                                name: 'HasNot',
                                                type: 'QA',
                                                enter: 'I don\'t know yet. What is yours?',
                                                variable: 'favcolor',
                                                deactivate: {'%eval': 'setPersonalization(\'favcolor\', variables.favcolor)'}
                                            },
                                            {
                                                name: 'OK',
                                                type: 'Dummy',
                                                enter: 'Your favorite color is %favcolor',
                                                final: true
                                            }
                                        ],
                                        Transitions: ['Switch->OK, true', 'Switch->HasNot,false', 'HasNot->OK,*']
                                    }
                                }
                            }
                        },
                        'Questions': [
                            'What is my favorite color?'
                        ]
                    }
                ]
            }
        ],
        system: {
            'coreServices': [

                {
                    'name': 'MongoStorage',
                    'connection': 'mongodb://localhost:27017/QwieryDB'
                },
                'System',
                'Graph',
                'Topics',
                'Personalization',
                'Pipeline',
                'Oracle',
                'Identity',
                'Apps',
                'Workflows'
            ],
            coreInterpreters: ['Spam', 'Parsers', 'Edictor', 'Flows']
        }
    };
    let qwiery = new Qwiery(settings);

    qwiery.run(['Hello', 'Green'], {userId: 'Swa', return: 'text'}).then(function (answers) {
        console.log(answers);
        test.done();
    });

};

exports.choice = async function (test) {
    const settings = {
        defaultApp: 'Jon',
        apps: [
            {
                name: 'Jon',
                id: 'Forecaster',
                'pipeline': [
                    'Spam',
                    'Parsers',
                    'Edictor',
                    'Flows'
                ],
                noAnswer: '(*(*&^(*(S*FS))....',
                oracle: [
                    {
                        'Template': {
                            'Answer': 'ThinkResult',
                            'Think': {
                                'CreateReturn': {
                                    'Workflow': {
                                        Name: 'Pick out',
                                        States: [
                                            {
                                                name: 'Choice',
                                                type: 'Choice',
                                                choices: ['fruit', 'vegetables', 'meat'],
                                                variable: 'what',
                                                initial: true
                                            },
                                            {
                                                name: 'OK',
                                                type: 'Dummy',
                                                enter: 'You selected \'%{variables.what_value}\'.',
                                                final: true
                                            }
                                        ],
                                        Transitions: ['Choice->OK']
                                    }
                                }
                            }
                        },
                        'Questions': [
                            'Food'
                        ]
                    }
                ]
            }
        ],
        system: {
            'coreServices': [

                {
                    'name': 'MongoStorage',
                    'connection': 'mongodb://localhost:27017/QwieryDB'
                },
                'System',
                'Graph',
                'Topics',
                'Personalization',
                'Pipeline',
                'Oracle',
                'Identity',
                'Apps',
                'Workflows'
            ],
            coreInterpreters: ['Spam', 'Parsers', 'Edictor', 'Flows']
        }
    };
    let qwiery = new Qwiery(settings);

    const answers = await qwiery.run(['Food', '1'], {userId: 'Swa', return: 'text'});
    console.log(answers);
    test.done();

};
