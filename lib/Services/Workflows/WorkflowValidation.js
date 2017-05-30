const
    utils = require('../../utils'),
    WorkflowState = require('./WorkflowState'),
    StateTransition = require('./StateTransition'),
    path = require('path'),
    async = require('asyncawait/async'),
    waitFor = require('asyncawait/await'),
    _ = require('lodash');
/**
 * Static methods related to flow validation.
 */
class WorkflowValidation {
    static transitionsExists(transition, flow) {
        for(let i = 0; i < flow.transitions.length; i++) {
            const tr = flow.transitions[i];
            if(tr.from === transition.from && tr.to === transition.to && tr.value === transition.value) {
                return true;
            }
        }
        return false;
    }

    static checkEndpointsExist(definition, flow) {
        if(!WorkflowValidation.stateNameExists(definition.from, flow)) {
            throw new Error("The transition source '" + definition.from + "' does not exist.");
        }
        if(!WorkflowValidation.stateNameExists(definition.to, flow)) {
            throw new Error("The transition target '" + definition.to + "' does not exist.");
        }
    }

    /**
     * Checks that the given workflow definition.
     * @param definition {any} A workflow definition.
     * @private
     */
    static validateFlow(definition) {
        WorkflowValidation.validateProperties(definition);
        WorkflowValidation.validateTopology(definition);
    }

    /**
     * Renames some of the props in the states
     * which have simpler names, e.g. 'enter' instead of 'enterMessage'.
     * Converts the loose format to the actual format.
     * @param definition
     */
    static rephrase(definition) {

        // translates the loose state format to the strict one
        if(_.isPlainObject(definition.States)) {
            let newStates = [];
            _.forOwn(definition.States, function(v, k) {
                v.name = k;
                newStates.push(v);
            });
            definition.States = newStates;
        }

        // renaming some props
        if(definition.States) {
            for(let i = 0; i < definition.States.length; i++) {
                const stateDefinition = definition.States[i];
                WorkflowValidation._renameMessage(stateDefinition, "enter", "enterMessage");
                WorkflowValidation._renameMessage(stateDefinition, "deactivate", "deactivateMessage");
                WorkflowValidation._renameMessage(stateDefinition, "accept", "acceptMessage");
                WorkflowValidation._renameMessage(stateDefinition, "reject", "rejectMessage");
                WorkflowValidation._renameMessage(stateDefinition, "initial", "isInitial");
                WorkflowValidation._renameMessage(stateDefinition, "execute", "executeMessage");
                WorkflowValidation._renameMessage(stateDefinition, "final", "isFinal");
            }
        }

        // translates the short format like A->B to the strict format
        if(definition.Transitions) {
            for(let i = 0; i < definition.Transitions.length; i++) {
                const transitionDefinition = definition.Transitions[i];
                definition.Transitions[i] = WorkflowValidation.parseTransition(transitionDefinition);
            }
        }

    }

    /**
     * Reformats the transition definition if in compact form.
     * That is, something like
     *      A->B
     * is reformatted as
     *  {from: A, to: B}
     * @param definition
     */
    static parseTransition(definition) {
        if(_.isString(definition)) {
            const parts = definition.split("->");
            if(parts.length === 1) {
                throw new Error(`The transition '${definition}' should contain "->'.`);
            }
            let to = parts[1].trim();
            let value = true;
            if(to.indexOf(",") > 1) {
                const tov = to.split(",");
                to = tov[0].trim();
                value = tov[1];
                // convert string to actual type if possible
                try {
                    value = utils.tryConvertToBoolean(value);
                } catch(e) {
                    //
                }
            }
            return {
                from: parts[0].trim(),
                to: to,
                value: value
            }
        }
        return definition;
    }

    /**
     * Some of the props on the serialized flow state
     * have a simpler name for readability.
     * @param options
     * @param name {string} The name to replace.
     * @param newName {string} The new name to use.
     * @private
     */
    static _renameMessage(options, name, newName) {
        if(!options) {
            return;
        }
        if(options[name]) {
            if(_.isFunction(options[name])){
                // likely that this something like an inline state with a custom execute function
                return;
            }
            options[newName] = options[name];
            delete options[name];
        }
    }

    /**
     * Ensures that there is a beginning and an end.
     * @param definition {any} A workflow definition.
     * @private
     */
    static validateTopology(definition) {
        if(utils.isDefined(definition.Transitions) && definition.Transitions.length > 0 && utils.isUndefined(definition.States)) {
            throw new Error("Cannot have a workflow with transitions but without states.");
        }
        WorkflowValidation.checkInitialState(definition);
        WorkflowValidation.checkFinalState(definition);


    }

    /**
     * Checks that the various minimum requirements are fullfilled.
     * @param definition {any} A workflow definition.
     * @private
     */
    static validateProperties(definition) {

        if(utils.isUndefined(definition.Name)) {
            throw new Error("The workflow should have a 'Name' property.")
        }
        if(utils.isUndefined(definition.Name.trim().length === 0)) {
            throw new Error("The workflow should have a non-empty 'Name' property.")
        }


        if(utils.isDefined(definition.States) && definition.States.length > 0) {
            // <editor-fold desc="State names defined and unique">
            const names = [];
            for(let i = 0; i < definition.States.length; i++) {
                const state = definition.States[i];
                if(utils.isUndefined(state.name)) {
                    throw new Error("State " + i + " should have a unique 'name' property.");
                } else {
                    names.push(state.name);
                }
            }
            if(_.uniq(names).length !== names.length) {
                throw new Error("All state names should be unique across the workflow.");
            }
            // </editor-fold>

            // <editor-fold desc="Singleton">
            if(definition.States.length === 1) {
                const singleton = definition.States[0];
                if(utils.isUndefined(singleton.isInitial) || singleton.isInitial !== true) {
                    throw new Error("If the flow consists of a single state it should have 'isInitial:true' and 'isFinal:true'.")
                }
                if(utils.isUndefined(singleton.isFinal) || singleton.isFinal !== true) {
                    throw new Error("If the flow consists of a single state it should have 'isInitial:true' and 'isFinal:true'.")
                }
                if(utils.isDefined(definition.Transitions) && definition.Transitions.length > 0) {
                    throw new Error("If the flow consists of a single state the 'Transitions' collection should be empty.");
                }
            }
            // </editor-fold>
        } else {
            throw new Error("The workflow is empty, it should have at least one item in the 'States' array e.g. '{States:[{name: one }]}'.")
        }
    }

    static validateStateInstance(instance, workflow) {
        // if(!(instance instanceof WorkflowState)) {
        //     throw new Error("The given object is not a WorkflowState instance.");
        // }
        if(WorkflowValidation.stateNameExists(instance.name, workflow)) {
            throw new Error(`Duplicate name '${state.name}' in this workflow.`);
        }
    }

    /**
     * Checks that the initial state exists.
     * @param definition {any} A workflow definition.
     * @private
     */
    static checkInitialState(definition) {
        if(utils.isDefined(definition.States) && definition.States.length > 0) {

            const instate = _.filter(definition.States, {isInitial: true});
            if(instate.length === 0) {
                throw new Error("No initial state found in the workflow definition.");
            }
            if(instate.length > 1) {
                throw new Error("More than one initial state found in the workflow definition.");
            }
        }
    }

    /**
     * Checks that the final state exists.
     * @param definition {any} A workflow definition.
     * @private
     */
    static checkFinalState(definition) {
        if(utils.isDefined(definition.States) && definition.States.length > 0) {
            const finstate = _.filter(definition.States, {isFinal: true});
            if(finstate.length === 0) {
                throw new Error("No final state found in the workflow definition.");
            }

        }
    }

    static checkDuplicateTransition(transition, workflow) {
        _.forEach(workflow.transitions, function(t) {
            if(t.from.toLowerCase() === transition.from.toLowerCase() && t.to.toLowerCase() === transition.to.toLowerCase() && t.value === transition.value) {
                throw new Error(`Duplicate transition found: ${t.from} -> ${t.to}.`)
            }
        })
    }

    static stateNameExists(name, flow) {
        return utils.isDefined(WorkflowValidation.findState(name, flow));
    }

    /**
     * Finds the state with the given name in this workflow.
     * @param name
     * @param flow
     * @return {T}
     * @private
     */
    static findState(name, flow) {
        const found = _.find(flow.states, function(x) {
            return x.name.toLowerCase() === name.toLowerCase();
        });
        return found;
    }

    /**
     * Returns the transition starting at the given place and with the given transition value.
     * If there is a transition defined with value equal to '*' it will be picked as a catch-all.
     * @param from
     * @param value
     * @param flow
     * @return {*}
     */
    static findTransition(from, value, flow) {
        for(let i = 0; i < flow.transitions.length; i++) {
            const tr = flow.transitions[i];
            if(_.isString(tr.value)) {
                tr.value = tr.value.trim();
            }
            if(tr.from.toLowerCase() === from.toLowerCase() && tr.value === value) {
                return tr;
            }
        }
        // maybe there is a *-transition?
        for(let i = 0; i < flow.transitions.length; i++) {
            const tr = flow.transitions[i];
            if(_.isString(tr.value)) {
                tr.value = tr.value.trim();
            }
            if(tr.from.toLowerCase() === from.toLowerCase() && tr.value === "*") {
                return tr;
            }
        }

        return null;
    }
}

module.exports = WorkflowValidation;