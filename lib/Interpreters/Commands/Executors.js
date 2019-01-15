const utils = require('../../utils'),
    constants = require('../../constants'),
    Language = require('../../Services/Language'),
    Entities = require('../../Understanding/Entities'),
    _ = require('lodash');

/**
 * Static methods used by the commands. Each returns a pod collection.
 * @class Executors
 */
class Executors {

    /**
     * @return {string}
     */
    static get NotOK() {
        return _.sample([
            'I don\'t understand that command. ',
            'That wasn\'t clear to me',
            'Not sure what you mean.',
            'Can you be more specific?',
            'That did not work.'
        ]);
    }

    /**
     * Creates an array of Text pods from the given strings.
     * @param messages One or more string.
     * @return {Array<Pod>} A pod array.
     */
    static messagePods(...messages) {
        const r = [];
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (!_.isString(msg)) {
                throw new Error('Cannot make a message pod out of an object.');
            }
            r.push({
                'Content': msg,
                'DataType': constants.podType.Text
            })
        }
        return r;
    }

    /**
     * Retuns a pod array with a SingleEntity list.
     * @param array {Array} The array of items to present.
     * @param [listType=null] {string} The type of entities in the list.
     * @param [head=null] The optional Header.
     * @return {[*]}
     */
    static listPod(array, listType = null, head = null) {
        let r = {
            'DataType': constants.podType.List,
            'ListType': listType,
            'List': array
        };
        if (head) {
            r.Head = head;
        }
        return [r];
    }

    /**
     *
     * @param entity {Entity} The entity to present.
     * @param [head=null] The optional Header.
     * @return {{DataType: string, Entity: *}}
     */
    static singleEntityPod(entity, head = null) {
        const r = {
            DataType: 'SingleEntity',
            Entity: entity,
        };
        if (head) {
            r.Head = head;
        }
        return [r];
    }

    static async deleteTag(instruction, session, command) {
        const that = this;

        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to delete a tag, try with e.g. \'delete>tag> my new tag\'.');
        } else {
            if (instruction.HasNamedArguments) { // delete>tag> name: favorites, id: EA44fqsf
                return Executors.removeTag(instruction, session, command);
            } else { // delete>Tag> myTag
                const deletionWorkflow = {
                    'Name': 'Confirm deletion of tag.',
                    'SaveReminder': false,
                    'IsActive': false,
                    'Variables': {
                        'tagname': instruction.FirstParameter.value
                    },
                    'States': [
                        {
                            name: 'Exists',
                            type: 'decision',
                            transition: '%{tagExists(variables.tagname)}',
                            initial: true
                        },
                        {
                            'type': 'YesNo',
                            'name': 'Confirmation',
                            'variable': 'Username',
                            'enter': 'Are you sure?',
                            'reject': constants.DefaultYesNoRejectResponse
                        },

                        {
                            'type': 'QA',
                            'name': 'Deletion',
                            'final': true,
                            'execute': {'%eval': 'deleteTag(variables.tagname)'},
                            'enter': 'Done.'
                        },
                        {
                            name: 'NotThere',
                            type: 'dummy',
                            enter: 'Nothing to delete, the tag does not exist',
                            final: true
                        },
                        {
                            'type': 'QA',
                            'name': 'NoDeletion',
                            'final': true,
                            'enter': Language.getVariation(constants.NODELETION)
                        }
                    ],
                    'Transitions': ['Confirmation->Deletion',
                        'Confirmation->NoDeletion, false',
                        'Exists->Confirmation', 'Exists->NotThere, false']
                };

                let spy = await (command.services.workflows.runWorkflow(deletionWorkflow, session));
                return spy.toAnswer();
            }
        }
    }

    static async deleteEntity(instruction, session, command) {
        const that = this;

        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to delete a tag, try with e.g. \'delete>tag> my new tag\'.');
        } else {
            const deletionWorkflow = {
                'Name': 'Confirm deletion of entity.',
                'SaveReminder': false,
                'IsActive': false,
                'Variables': {
                    'entityId': instruction.FirstParameter.value
                },
                'States': [
                    {
                        name: 'Exists',
                        type: 'decision',
                        transition: '%{entityExists(variables.entityId)}',
                        initial: true
                    },
                    {
                        'type': 'YesNo',
                        'name': 'Confirmation',
                        'enter': 'Are you sure?',
                        'reject': constants.DefaultYesNoRejectResponse
                    },

                    {
                        'type': 'QA',
                        'name': 'Deletion',
                        'final': true,
                        'execute': {'%eval': 'deleteEntity(variables.entityId)'},
                        'enter': 'Done.'
                    },
                    {
                        name: 'NotThere',
                        type: 'dummy',
                        enter: 'Nothing to delete, the entity does not exist',
                        final: true
                    },
                    {
                        'type': 'QA',
                        'name': 'NoDeletion',
                        'final': true,
                        'enter': Language.getVariation(constants.NODELETION)
                    }
                ],
                'Transitions': ['Confirmation->Deletion',
                    'Confirmation->NoDeletion, false',
                    'Exists->Confirmation', 'Exists->NotThere, false']
            };

            let spy = await (command.services.workflows.runWorkflow(deletionWorkflow, session));
            return spy.toAnswer();
        }
    }

    static getTags(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'I don\'t understand this command. If you want to get the tags, try with e.g. \'get>tags:\'.');
        } else {
            return command.services.graph.getTags(session.Context);
        }
    }

    static getTag(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to get the tag, try with e.g. \'get>tag> <the name of the tag>\'.');
        } else {
            if (utils.isUndefined(instruction.FirstParameter) || instruction.FirstParameter.length === 0) {
                return Executors.messagePods(Executors.NotOK + 'If you want to get the entities of a tag, try with e.g. \'get> tag> music\'.');
            } else {
                return command.services.graph.tagExists(instruction.FirstParameter.value, session.Context).then(function (tf) {
                    if (tf === true) {
                        return command.services.graph.getTagEntities(instruction.FirstParameter.value, session.Context).then(function (list) {
                            list = list.map(function (x) {
                                return {Title: x.Title, DataType: x.DataType, Id: x.Id};
                            });
                            if (list.length === 0) {
                                return Executors.messagePods(`The tag '${instruction.FirstParameter.value}' does not tag any entity.`);
                            }
                            return Executors.listPod(list, null, `The entities tagged with '${instruction.FirstParameter.value}'.`);
                        });

                    } else {
                        return Executors.messagePods(`The tag '${instruction.FirstParameter.value}' doesn't exist.`);
                    }
                });
            }
        }
    }

    static async addTag(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to add a tag, try with e.g. \'`add>tag>` my new tag\'.');
        } else {
            if (utils.isUndefined(instruction.FirstParameter)) {
                return Executors.messagePods(Executors.NotOK + 'If you want to add a tag, try with e.g. \'`add>tag>` my new tag\'.');
            }
            await (command.services.graph.addTag(instruction.FirstParameter.value, session.Context));
            return Executors.messagePods('The tag has been added.');
        }
    }

    static async addTask(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to add a task, try with e.g. \'`add>task>` my new task\'.');
        } else {
            if (utils.isUndefined(instruction.FirstParameter)) {
                return Executors.messagePods(Executors.NotOK + 'If you want to add a task, try with e.g. \'`add>task>` my new task\'.');
            }
            let d;
            if (instruction.HasNamedArguments) {
                const x = instruction.getParameterObject();
                d = {
                    DataType: 'Task',
                    Title: x.title || x.Title,
                    Description: x.description || x.Description
                }
            } else {
                d = {
                    DataType: 'Task',
                    Title: instruction.FirstParameter.value
                }
            }
            await (command.services.graph.upsertEntity(d, session.Context));
            return Executors.messagePods('The task has been added.');
        }
    }

    static async addPerson(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to add a person, try with e.g. \'`add>person>` my new person\'.');
        } else {
            if (utils.isUndefined(instruction.FirstParameter)) {
                return Executors.messagePods(Executors.NotOK + 'If you want to add a person, try with e.g. \'`add>person>` my new person\'.');
            }
            let d;
            if (instruction.HasNamedArguments) {
                const x = instruction.getParameterObject();
                d = {
                    DataType: 'Person',
                    Title: x.title || x.Title,
                    Description: x.description || x.Description,
                    FirstName: x.firstname || x.FirstName,
                    LastName: x.lastname || x.LastName,
                }
            } else {
                // basic firstname/lastname splitting
                const parts = instruction.FirstParameter.value.split(' ');
                d = {
                    DataType: 'Person',
                    Title: instruction.FirstParameter.value,
                    FirstName: parts[0],
                    LastName: parts[0]
                }
            }
            await (command.services.graph.upsertEntity(d, session.Context));
            return Executors.messagePods('The person has been added.');
        }
    }

    static async addAddress(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to add a address, try with e.g. \'`add>address>` my new address\'.');
        } else {
            if (utils.isUndefined(instruction.FirstParameter)) {
                return Executors.messagePods(Executors.NotOK + 'If you want to add a address, try with e.g. \'`add>address>` my new address\'.');
            }
            let d;
            if (instruction.HasNamedArguments) {
                const x = instruction.getParameterObject();
                d = {
                    DataType: 'Address',
                    Title: x.title || x.Title,
                    Description: x.description || x.Description,
                    AddressLine1: x.addressline1 || x.AddressLine1 || x.street || x.addressline,
                    AddressLine2: x.addressline2 || x.AddressLine2,
                    City: x.city || x.City,
                    Country: x.country || x.Country,
                    Zip: x.zip || x.Zip
                }
            } else {
                d = {
                    DataType: 'Address',
                    Title: instruction.FirstParameter.value
                }
                // return Executors.messagePods(Executors.NotOK + "If you want to add a address, try with e.g. '`add>address>` street:..., city:...'.");
                // // basic firstname/lastname splitting
                // const parts = cmd.FirstParameter.value.split(" ");
                // d = {
                //     DataType: "Address",
                //     Title: cmd.FirstParameter.value,
                //     FirstName: parts[0],
                //     LastName: parts[0]
                // }
            }
            await (command.services.graph.upsertEntity(d, session.Context));
            return Executors.messagePods('The address has been added.');
        }
    }

    static async addPersonalization(instruction, session, command) {
        const nok = Executors.messagePods(Executors.NotOK + 'If you want to add a preference, try with e.g. \'`add>preference> key:..., value:...` \'.');
        if (instruction.Commands.length > 2) {
            return nok
        } else {
            if (utils.isUndefined(instruction.FirstParameter) || instruction.Parameters.length < 2 || !instruction.HasNamedArguments) {
                return nok;
            }
            const name = instruction.get('key') || instruction.get('name'); // let's be flexible
            const value = instruction.get('value');
            if (utils.isUndefined(name) || utils.isUndefined(value)) {
                return nok;
            }
            await (command.services.personalization.addPersonalization(name, value, session.Context));
            return Executors.messagePods('The preference has been added.');
        }
    }

    static async addAppointment(instruction, session, command) {
        if (instruction instanceof Entities.Appointment) {
            await (command.services.graph.upsertEntity(instruction.toJSON(), session.Context));
            return Executors.messagePods('The appointment has been added.');
        } else {
            const nok = Executors.messagePods(Executors.NotOK + 'If you want to add an appointment, try with e.g. \'`add>agenda> from:..., to:...` \'.');
            if (instruction.Commands.length > 2) {
                return nok
            } else {
                if (!instruction.HasNamedArguments) {
                    return nok;
                }
                const x = instruction.getParameterObject();
                // well, does the user use capitals or not?
                const d = {
                    From: x.from || x.From,
                    To: x.to || x.To,
                    AllDay: x.allday || x.AllDay,
                    Id: x.id || x.Id,
                    Description: x.description || x.Description,
                    DataType: 'Appointment',
                    Title: x.title || x.Title
                };
                const ag = new Entities.Appointment(d);
                await (command.services.graph.upsertEntity(ag.toJSON(), session.Context));
                return Executors.messagePods('The appointment has been added.');
            }
        }
    }

    static async addSpace(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to add a workspace, try with e.g. \'add>space> my new space\'.');
        } else {
            const exists = await (command.services.graph.getWorkspaceIdByName(instruction.FirstParameter.value, session.Context));

            if (exists) {
                return Executors.messagePods(`The space '${instruction.FirstParameter.value}' exists already.`);
            } else {
                const workspaceId = await (command.services.graph.addWorkspace({Name: instruction.FirstParameter.value}, session.Context));
                return Executors.messagePods('The new space was added and is now the active one. You can change the active workspace by using the command \'`set>space>` <the name of the space you have given>\'.');
            }

        }
    }

    static getSpace(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to get the notebooks, try with e.g. \'spaces>\' or \'notebooks>\'.');
        } else {
            if (utils.isUndefined(instruction.FirstParameter)) {
                return command.services.graph.getCurrentWorkspaceId(session.Context).then(function (wid) {
                    return command.services.graph.getWorkspaceSummary(wid, session.Context);
                });
            } else {
                return command.services.graph.getWorkspaceIdByName(instruction.FirstParameter.value, session.Context).then(function (wid) {
                    return command.services.graph.getWorkspaceSummary(wid, session.Context);
                });
            }
        }
    }

    static async deleteSpace(instruction, session, command) {
        const that = this;

        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to delete a space, try with e.g. \'delete>space> space_name\'.');
        } else {
            const deletionWorkflow = {
                'Name': 'Confirm deletion of space.',
                'SaveReminder': false,
                'IsActive': false,
                'Variables': {
                    'spaceName': instruction.FirstParameter.value,
                    'spaceId': null
                },
                'States': [
                    {
                        name: 'Exists',
                        type: 'decision',
                        transition: '%{spaceNameExists(variables.spaceName)}',
                        initial: true
                    },
                    {
                        'type': 'YesNo',
                        'name': 'Confirmation',
                        'enter': 'Are you sure? All entities in the space will be deleted as well.',
                        'reject': constants.DefaultYesNoRejectResponse
                    },

                    {
                        'type': 'Dummy',
                        'name': 'Deletion',
                        'final': true,
                        'enter': {'%eval': 'deleteSpace(variables.spaceName)'}
                    },
                    {
                        name: 'NotThere',
                        type: 'dummy',
                        enter: 'Nothing to delete, the space does not exist or need for a more precise name.',
                        final: true
                    },
                    {
                        'type': 'QA',
                        'name': 'NoDeletion',
                        'final': true,
                        'enter': Language.getVariation(constants.NODELETION)
                    }
                ],
                'Transitions': ['Confirmation->Deletion',
                    'Confirmation->NoDeletion, false',
                    'Exists->Confirmation', 'Exists->NotThere, false']
            };

            let spy = await (command.services.workflows.runWorkflow(deletionWorkflow, session));
            return spy.toAnswer();
        }
    }

    static getActiveSpace(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to get the active space, try with e.g. \'get>activespace>\'.');
        } else {
            {
                return command.services.graph.getCurrentWorkspace(session.Context).then(function (ws) {
                    // return command.services.graph.getWorkspaceSummary(wid, session.Context);
                    return Executors.messagePods(`The current workspace is '${ws.Name}'.`)
                });
            }
        }
    }

    static getSpaces(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to get the notebooks, try with e.g. \'spaces>\' or \'notebooks>\'.');
        } else {
            return command.services.graph.getWorkspaceSummaries(session.Context).then(function (spaces) {
                return Executors.listPod(spaces, 'Workspace', 'Your workspaces:')
            });
        }
    }

    static getPersonalization(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to get your personalization, try with e.g. \'personalization>\' or \'get>personalization>\'.');
        } else {
            return command.services.personalization.getUserPersonalizations(session.Context).then(function (found) {
                // some mongo metadata seems to pass
                if (found) {
                    found = found.map(function (x) {
                        return {
                            key: x.key,
                            value: x.value
                        }
                    });
                }
                return found;
            });
        }
    }

    static getAgenda(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to get your agenda, try with e.g. \'agenda>\' or \'get>agenda>\'.');
        } else {
            return command.services.graph.getAgenda(session.Context).then(function (found) {
                // some mongo metadata seems to pass
                if (found) {
                    found = found.map(function (x) {
                        return {
                            From: x.From ? new Date(x.From).toLocaleString() : null,
                            To: x.To ? new Date(x.To).toLocaleString() : null,
                            Title: x.Title,
                            Description: x.Description,
                            AllDay: (x.AllDay === true) ? '✔︎' : '✘',
                            Id: x.Id
                        }
                    });
                }
                return found;
            });
        }
    }

    static async setSpace(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to set the activeworkspace, try with e.g. \'set>space> <the name of the space>\'.');
        } else {
            let changed = await (command.services.graph.setActiveWorkspace(instruction.FirstParameter.value, session.Context));
            if (changed) {
                return Executors.messagePods(`The workspace entitled '${instruction.FirstParameter.value}' is now your active space.`);
            } else {
                return command.services.graph.getUserWorkspaces(session.Context).then(function (sps) {
                    let spaces = _.map(_.take(sps, 10), function (o) {
                        return o.Name;
                    }).join('\n\t- ');
                    if (sps.length > 10) {
                        spaces += '..';
                    }
                    return Executors.messagePods(`The workspace could not be activated. You have the following spaces> \n\t- ${spaces}.`);
                });

            }
        }
    }

    static setTag(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to set a tag, try with e.g. \'set>tag> name:..., id:...\'.');
        }
        if (!instruction.HasNamedArguments || instruction.Parameters.length < 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to set a tag, try with e.g. \'set>tag> name:..., id:...\'.');
        }
        const id = instruction.get('id');
        const name = instruction.get('name') || instruction.get('title');
        return command.services.graph.attachTag(name, id, session.Context).then(function () {
            return Executors.messagePods(`The entity has been tagged with '${name}'.`);
        });
    }

    static removeTag(instruction, session, command) {
        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to remove a tag, try with e.g. \'delete>tag> name:..., id:...\'.');
        }
        if (!instruction.HasNamedArguments || instruction.Parameters.length < 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to remove a tag, try with e.g. \'delete>tag> name:..., id:...\'.');
        }
        const id = instruction.get('id');
        const name = instruction.get('name') || instruction.get('title');
        return command.services.graph.detachTag(name, id, session.Context).then(function () {
            return Executors.messagePods(`The tag '${name}' on the entity has been removed.`);
        });
    }

    static setAnswer(instruction, session, command) {

        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + 'If you want to set the answer, try with e.g. \'set>answer>...\'.');
        }
        return command.services.history.getLast(session.Context).then(function (last) {
            if (utils.isDefined(last)) {
                if (_.isArray(last)) {
                    last = last[0];
                }
                let handledBy = null;
                if (last.Trace) {
                    last.Trace.forEach(function (x) {
                        if (x.HandledBy) {
                            handledBy = x.HandledBy;
                        }
                    });
                }
                if (handledBy === 'Commands') {
                    return Executors.messagePods('The last question was a command and cannot be learned differently.');
                } else {
                    let id = -1;
                    if (utils.isDefined(handledBy)) {
                        let template = null;
                        last.Trace.forEach(function (x) {
                            if (x.Edictor) {
                                template = _.last(x.Edictor);
                            }
                        });
                        if (utils.isDefined(template)) {
                            id = template.Id;
                        }
                    }
                    const qtl = {
                        'Id': id,
                        'Questions': last.Input.Raw,
                        'Template': {
                            'Answer': instruction.FirstParameter.value
                        }
                    };
                    return command.services.oracle.learn(qtl).then(function (id) {
                        return Executors.messagePods('The answer is learned.');
                    });
                }

            } else {
                return Executors.messagePods('Could not related it to the previous question. Slipped somewhere.');
            }
        });
    }

    static getEntity(instruction, session, command) {
        return command.services.graph.getAccessibleNode(instruction.FirstParameter.value, session.Context)
    }

    static toEntity(instruction) {
        let r = {};
        if (instruction.HasNamedArguments) {
            for (let i = 0; i < instruction.Parameters.length; i++) {
                const p = instruction.Parameters[i];
                // note that the DataType is defined by the Command[1] and not by the parameters
                r[_.capitalize(p.name)] = p.value;
            }
        } else {
            r.Title = instruction.FirstParameter.value;
        }
        return r;
    }

    /**
     * Adds an arbitrary entity to the graph.
     * @param instruction
     * @param session
     * @param command
     * @return {Promise.<Object>|*}
     */
    static addEntity(instruction, session, command) {
        if (instruction.Commands.length < 2) {
            throw new Error(Executors.NotOK + 'Adding an entity requires at least two commands.')
        }
        const entity = Executors.toEntity(instruction);
        entity.DataType = _.capitalize(instruction.Commands[1]);
        return command.services.graph.upsertEntity(entity, session.Context);
    }

    static async getHelp(instruction, session, command) {
        const question = session.Input.Raw;
        const that = this;

        if (instruction.Commands.length > 1) {
            return Executors.messagePods(Executors.NotOK + 'If you want to get help about a topic, try with e.g. \'help> qwiery\'.');
        } else {
            if (command.services.documents) {
                if (utils.isUndefined(instruction.FirstParameter)) {
                    return Executors.messagePods('You need to specify a keyword, e.g. \'help>qwiery\'.');
                } else {
                    const content = await (command.services.documents.getDocTopic(instruction.FirstParameter.value));
                    return Executors.messagePods(content || 'Sorry, no help available.');
                }

            } else {
                return Executors.messagePods('Sorry, no help available because the required documents service is not available.');
            }
        }
    }

    /**
     * search>graph>term:..., type:...
     * @param instruction
     * @param session
     * @param command
     * @return {Promise<TResult>}
     */
    static searchGraph(instruction, session, command) {
        const ctx = session.Context;

        if (instruction.Commands.length > 2) {
            return Executors.messagePods(Executors.NotOK + ' If you want to search your entities, try with e.g. \'search>graph> coffee\'.');
        } else {
            let term = null, type = null;
            if (instruction.HasNamedArguments) {
                term = instruction.get('term');
                type = instruction.get('type');
            } else {
                if (instruction.FirstParameter === null) {
                    return Executors.messagePods('Missing search term. Try again.');
                } else {
                    term = instruction.FirstParameter.value;
                }
            }

            return command.services.graph.search(term, type, ctx).then(function (r) {
                if (utils.isUndefined(r) || r.length === 0) {
                    return Executors.messagePods('Search gave no results.');
                } else {
                    // adding a descriptive header for convenience
                    let c = r.length === 1 ? '1 result' : r.length + ' results';
                    return Executors.listPod(r,
                        constants.listTypes.SearchItem,
                        type ?
                            `Search for '${term}' and type '${type}' gave ${c}.`
                            : `Search for '${term}' gave ${c}.`);
                }
            });
        }
    }

    static getDefinition(instruction, session, command) {

        return Language.lookup(instruction.FirstParameter.value).then(function (r) {
            let result = '';
            if (utils.isDefined(r) && r.length > 0) {
                result = `Found the following for '${instruction.FirstParameter.value}':`;
                for (let i = 0; i < r.length; i++) {
                    const lup = r[i];
                    result += '\n- ' + lup.def;
                }
            } else {
                result = `Sorry, could not find a definition for '${instruction.FirstParameter.value}'.`;
            }
            return Executors.messagePods(result);
        });
    }

    /**
     * Returns the sentiment of the given input into a standard score between -3 (negative statement) and +3 (positive statement).
     * @return {*}
     */
    static getSentiment(instruction, session, command) {
        return Language.detectSentiment(instruction.FirstParameter.value, true).then(function (r) {
            return Executors.messagePods(r);
        });
    }

    /**
     * Summarizes the given string or content of the site from the given url.
     */
    static getSummary(instruction, session, command) {
        return Language.summarize(instruction.FirstParameter.value).then(function (r) {
            return Executors.messagePods(r);
        });

    }

    static getSynonyms(instruction, session, command) {
        return Language.getSynonyms(instruction.FirstParameter.value).then(function (r) {
            return Executors.messagePods(r);
        });
    }

    static getPOS(instruction, session, command) {
        return Language.getPOS(instruction.FirstParameter.value).then(function (found) {
            if (utils.isUndefined(found) || found.length === 0) {
                return Executors.messagePos('Could not fetch part of speech. Sorry :scream:');
            } else {
                return [{
                    DataType: 'List',
                    ListType: 'POS',
                    List: found
                }];
            }
        });
    }

    static getKeywords(instruction, session, command) {
        if (utils.isUrl(instruction.FirstParameter.value)) {
            const url = instruction.FirstParameter.value;
            return utils.getSiteContent(url).then(function (content) {
                if (utils.isUndefined(content)) {
                    return 'Could not fetch the content of the website.'
                } else {
                    return Language.getKeywords(content, 1, true).then(function (r) {
                        if (r.length === 0) {
                            return Executors.messagePods('Could not detect keywords.');
                        } else {
                            return Executors.messagePods(r);
                        }
                    });
                }
            });
        } else {
            return Language.getKeywords(instruction.FirstParameter.value, 1, true).then(function (r) {
                if (r.length === 0) {
                    return Executors.messagePods('No keywords, the input is either too short or does not contain much information.');
                } else {
                    return Executors.messagePods(r);
                }
            });
        }
    }
}

module.exports = Executors;
