const utils = require('../lib/utils');
const _ = require('lodash');
const WorkflowState = require('../lib/Services/Workflows/WorkflowState');
const WorkflowStateOptions = require('../lib/Services/Workflows/WorkflowStateOptions');

exports.assign = async function (test) {

    const options = new WorkflowStateOptions();
    options.name = utils.randomId();
    options.rejectMessage = utils.randomId();
    const state = new WorkflowState(options);
    test.equal(state.name, options.name);
    test.equal(state.rejectMessage, options.rejectMessage);
    test.done();
};


exports.stateBasics = async function (test) {


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
    await state.activate(false);
    test.equal(wasRaised, false);
    await state.activate(true);
    test.equal(wasRaised, true);

    // deactivate
    wasRaised = false;
    state.onDeactivate = function (msg, s) {
        test.equal(msg, state.deactivateMessage);
        test.equal(s, state);
        wasRaised = true;
    };
    state.deactivateMessage = utils.randomId();
    await state.deactivate();
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
    // should raise an error because it's not active
    try {
        await state.execute(input);
        test.ok(false);
    } catch (e) {
        test.ok(true);
    }
    test.equal(wasRaised, false);
    await state.activate();
    wasRaised = false;
    await state.execute(input);
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
    await state.accept(transitionValue);
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
    await state.reject(reason);

    state.onReject = function (msg, r, s) {
        test.equal(msg, state.rejectMessage);
    };
    // without a reason the msg is the rejectMessage
    await state.reject();

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
    // if no var name the name of the state is used by default
    state.setVariable(value);
    test.equal(wf.variables.ttf, value);
    state.setVariable(value, 'kopp');
    test.equal(wf.variables.kopp, value);
    test.equal(state.getVariable('kopp'), value);

    test.done();
};

exports.onActivate = async function (test) {
    const wf = {};
    const state = new WorkflowState({
        name: 'st',
        workflow: wf
    });
    test.throws(() => {
            state.onActivate = 'a';
        },
        'Not a function.'
    );
    state.onActivate = ()=>{

    };
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
