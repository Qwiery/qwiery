const
    utils = require('../../utils'),
    constants = require('../../constants'),
    path = require('path'),
    _ = require('lodash');
const ServiceBase = require("../../Framework/ServiceBase");
const StorageDomainBase = require("../../Framework/StorageDomainBase");
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');

/**
 * Manages the graphs.
 * @class GraphStorage
 */
class GraphStorage extends StorageDomainBase {


    init(instantiator) {
        super.init(instantiator);
        return this.createCollections({
                collectionName: "Graph",
                schema: {
                    "userId": String,
                    "Links": {type: Array, "default": []},
                    "Entities": {type: Array, "default": []},
                    "Metadata": {
                        "UserId": String,
                        "Workspaces": [
                            String
                        ],
                        "AccessTo": [{
                            UserId: String,
                            WorkspaceId: String
                        }],
                        "Tags": [String],
                        "Trail": [String],
                        "CurrentWorkspace": String
                    },
                    "Workspaces": [{
                        "WorkspaceId": String,
                        "Name": String,
                        "IsPublic": Boolean,
                        "IsDefault": Boolean,
                        "UserId": String,
                        "Users": [
                            String
                        ]
                    }],

                }
            }
        );
    }

    getUser(userId) {
        return this.Graph.findOne({"userId": userId});
    }

    getUsers(userIds) {
        const runner = [];
        for(let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            runner.push(this.getUser(userId));
        }
        return new Promise(function(resolve, reject) {
            Promise.all(runner).then(function(results) {
                resolve(results);
            });
        });
    }

    addUser(otherUserId, userId) {
        const data = {
            userId: otherUserId,
            Metadata: {
                UserId: otherUserId,
                Workspaces: [
                    otherUserId + ":default"
                ],
                AccessTo: [],
                Tags: [],
                Trail: [],
                CurrentWorkspace: otherUserId + ":default"
            },
            Workspaces: [
                {
                    "WorkspaceId": otherUserId + ":default",
                    "Name": "Default workspace",
                    "IsPublic": false,
                    "IsDefault": true,
                    "UserId": otherUserId,
                    "Users": [
                        otherUserId
                    ]
                }
            ],
            Entities: [],
            Links: []
        };
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(otherUserId).then(function(g) {
                if(utils.isDefined(g)) {
                    reject("UserId exists already.")
                } else {
                    that.Graph.upsert(data, {userId: otherUserId}).then(function() {
                        resolve();
                    });

                }
            });
        });

    }

    deleteUser(otherUserId, userId) {
        return this.Graph.remove({userId: userId});
    }

    userExists(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.Graph.count({userId: userId}).then(function(count) {
                resolve(count > 0)
            });
        });
    }

    getEntityCount(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(g) {
                resolve(g.Entities.length);
            });
        });
    }

    getNodeCountInSpace(workspaceId, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(g) {
                const found = _.filter(g.Entities, {"WorkspaceId": workspaceId});
                resolve(found.length);
            });
        });
    }

    save(udata) {
        return this.Graph.upsert(udata, {userId: udata.userId});
    }

    getCurrentWorkspace(userId) {
        if(utils.isUndefined(userId)) {
            throw  new Error("No userId specified.");
        }
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(g) {
                if(utils.isUndefined(g)) {
                    resolve(null);
                    return;
                }
                let found = _.find(g.Workspaces, {WorkspaceId: g.Metadata.CurrentWorkspace});
                if(found) {
                    found.DataType = "Workspace";
                }
                resolve(found);
            });
        });
    }

    /**
     * Gets the spaces owned by the user.
     * The method {@link getAccessibleWorkspaces} gives all the spaces the user has access to.
     * @see getAccessibleWorkspaces
     * @param userId
     * @returns {Promise|Promise<T>}
     */
    getUserWorkspaces(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(g) {
                if(utils.isUndefined(g)) {
                    resolve(null);
                    return;
                }
                resolve(g.Workspaces);
            });
        });
    }

    getCurrentWorkspaceId(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(g) {
                if(utils.isUndefined(g)) {
                    resolve(null)
                } else {
                    resolve(g.Metadata.CurrentWorkspace);
                }
            });
        });
    }

    getWorkspaceSummaries(userId) {
        const that = this;
        return this.getUserWorkspaces(userId).then(function(wss) {
            let actions = [];
            for(let i = 0; i < wss.length; i++) {
                const space = wss[i];
                actions.push(that.getWorkspaceSummary(space.WorkspaceId, userId));
            }
            return Promise.all(actions);
        });

    }

    getWorkspaceSummary(workspaceId, userId) {
        const that = this;
        return this.getWorkspace(workspaceId, userId).then(function(ws) {
            return that.getNodeCountInSpace(workspaceId, userId).then(function(count) {
                let summ = {
                    name: ws.Name,
                    id: workspaceId,
                    isPublic: ws.IsPublic,
                    entities: count,
                    users: ws.Users,
                    owner: ws.UserId,
                    DataType: "WorkspaceSummary"
                };

                return Promise.resolve(summ);
            });
        });
    }

    getWorkspace(workspaceId, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(g) {
                let found = _.find(g.Workspaces, {WorkspaceId: workspaceId});
                if(utils.isDefined(found)) {
                    found.DataType = "Workspace";
                }
                resolve(found);
            });
        });
    }

    getWorkspacesOfUser(otherUserId, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(otherUserId).then(function(g) {
                resolve(g.Workspaces);
            });
        });
    }

    getAccessibleWorkspaces(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(g) {
                if(g.Metadata.AccessTo) {
                    // "AccessTo" : [
                    //     {
                    //         "WorkspaceId" : "A10F76y6wA:default",
                    //         "UserId" : "A10F76y6wA"
                    //     }
                    // ],
                    const userIds = _.map(g.Metadata.AccessTo, function(x) {
                        return x.UserId
                    });
                    const spaceIds = _.map(g.Metadata.AccessTo, function(x) {
                        return x.WorkspaceId
                    });
                    that.getUsers(userIds).then(function(u) {
                        const spaces = g.Workspaces;
                        for(let i = 0; i < u.length; i++) {
                            const user = u[i];
                            for(let j = 0; j < user.Workspaces.length; j++) {
                                const space = user.Workspaces[j];
                                if(_.includes(spaceIds, space.WorkspaceId)) {
                                    spaces.push(space)
                                }
                            }
                        }
                        resolve(spaces);
                    });

                } else {
                    resolve(g.Workspaces);
                }
            });
        });

    }

    workspaceExists(workspaceId, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(g) {
                const found = _.find(g.Workspaces, {WorkspaceId: workspaceId});
                resolve(utils.isDefined(found));
            });
        });
    }

    getWorkspaceFromNodeId(id, userId) {
        const that = this;

        function runner() {
            let udata = waitFor(that.getUser(userId));
            const nodes = waitFor(that.getAccessibleNodes(userId));

            const found = _.find(nodes, {"Id": id});
            let result;
            if(utils.isDefined(found)) {

                if(found.UserId !== userId) { // happens if the node sits in a shared space
                    udata = waitFor(that.getUser(found.UserId));
                }
                result = _.find(udata.Workspaces, {"WorkspaceId": found.WorkspaceId});
            } else {
                result = null;
            }
            return result;
        }

        return async(runner)();

    }

    /**
     *
     * @param name The name or first few letter of the workspace.
     * @param userId The user identifier.
     * @returns {Promise<TResult>} `true` if the workspace was set, otherwise `false`.
     */
    setCurrentWorkspace(name, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            name = name.trim();

            const found = waitFor(that.getWorkspaceIdByName(name, userId));
            if(utils.isDefined(found)) {
                udata.Metadata.CurrentWorkspace = found;
                waitFor(that.save(udata));
                return true;
            } else {
                return false;
            }
        }

        return async(runner)();
    }

    /**
     * Returns the id of the workspace for the given name or portion of the name.
     * @param name {string} The (partial) name of the workspace.
     * @param userId
     * @param [exact=false] {boolean} Whether the name is specified exactly or partial search should be used.
     * @returns {Promise}
     */
    getWorkspaceIdByName(name, userId, exact = false) {

        let result = null;
        if(utils.isUndefined(name)) {
            result = null;
        }
        const that = this;
        return new Promise(function(resolve, reject) {
                that.getUser(userId).then(function(udata) {
                    if(utils.isUndefined(udata)) {
                        resolve(null);
                        return;
                    }
                    let found;
                    if(exact) {
                        found = _.filter(udata.Workspaces, function(ws) {
                                return ws.Name.toLowerCase() === name.toLowerCase();
                            }
                        );
                    } else {
                        found = _.filter(udata.Workspaces, function(ws) {
                                return ws.Name.toLowerCase().indexOf(name.toLowerCase()) > -1;
                            }
                        );
                    }
                    if(utils.isDefined(found)) {
                        if(found.length > 1) {
                            result = null; // don't return anything if search give multiple spaces
                            //throw new Error("Multiple spaces with the same name, this should not have happened.");
                        } else if(found.length === 1) {
                            result = found[0].WorkspaceId;
                        }
                    }
                    resolve(result);
                });
            }
        )
            ;

    }

    getWorkspaceById(wid) {
        let result = null;
        if(utils.isUndefined(wid)) {
            result = null;
        }
        const that = this;
        return new Promise(function(resolve, reject) {
            that.Graph.findOne({"Workspaces.WorkspaceId": wid}).then(function(blob) {
                // the blob is the whole graph thing
                if(utils.isDefined(blob)) {
                    const space = _.find(blob.Workspaces, function(x) {
                        return x.WorkspaceId === wid;
                    });
                    resolve(space || null);
                }
                else {
                    resolve(null);
                }
            });
        });

    }

    addWorkspace(workspace, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(g) {
                if(utils.isUndefined(workspace.WorkspaceId)) {
                    workspace.WorkspaceId = utils.randomId();
                }
                if(utils.isUndefined(workspace.Users)) {
                    workspace.Users = [];
                }
                if(!_.includes(workspace.Users, userId)) {
                    workspace.Users.push(userId);
                }
                // does exist already?
                let found = _.find(g.Workspaces, function(w) {
                    return w.Name.toLowerCase() === workspace.Name.toLowerCase();
                });
                if(utils.isDefined(found)) {
                    resolve(found.WorkspaceId);
                } else {
                    g.Workspaces.push(workspace);
                    g.Metadata.Workspaces.push(workspace.WorkspaceId);
                    // set the new as the active one
                    g.Metadata.CurrentWorkspace = workspace.WorkspaceId;
                    that.save(g).then(function() {
                        resolve(workspace.WorkspaceId);
                    });
                }
            });
        });
    }

    deleteWorkspace(workspaceId, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            const space = _.find(udata.Workspaces, {WorkspaceId: workspaceId});
            if(utils.isUndefined(space)) {
                throw new Error("The workspace does not exist.");
            }
            if(space.IsDefault) {
                throw new Error("The default workspace cannot be deleted.");
            }
            // remove access other users have, that will delete links and more
            for(let i = 0; i < space.Users.length; i++) {
                const otherUserId = space.Users[i];
                if(otherUserId === userId) {
                    continue;
                }
                waitFor(that.revokeAccessToWorkspace(workspaceId, otherUserId, userId));
            }

            const entities = _.filter(udata.Entities, function(e) {
                return e.WorkspaceId === workspaceId;
            });
            // ensure consistency
            for(let k = 0; k < entities.length; k++) {
                const entity = entities[k];
                _.remove(udata.Links, function(l) {
                    return l.IdSource === entity.Id || l.IdTarget === entity.Id;
                });
                _.remove(udata.Entities, function(l) {
                    return l.Id === entity.Id;
                })
            }
            _.remove(udata.Workspaces, function(w) {
                return w.WorkspaceId === workspaceId;
            });
            // set to the default space if the current was deleted
            if(udata.Metadata.CurrentWorkspace === workspaceId) {
                udata.Metadata.CurrentWorkspace = userId + ":default";
            }
            waitFor(that.save(udata));
        }

        return async(runner)();

    }

    createGraph(graph, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            const entities = graph.Nodes;
            const links = graph.Links;
            const nodeMap = [];
            const resultingGraph = {"Nodes": [], "Links": []};
            for(let k = 0; k < entities.length; k++) {
                const node = entities[k];
                nodeMap[node.Id] = utils.randomId();
                node.Id = nodeMap[node.Id];
                node.UserId = userId; // owner
                waitFor(that.upsertEntity(node, userId));
                resultingGraph.Nodes.push(node);
            }
            for(let k = 0; k < links.length; k++) {
                const link = links[k];
                link.IdSource = nodeMap[link.IdSource];
                link.IdTarget = nodeMap[link.IdTarget];
                link.Id = utils.randomId();
                link.UserId = userId;
                if(!waitFor(that.areConnected(link.IdSource, link.IdTarget, userId))) {
                    waitFor(that.connect(link.IdSource, link.IdTarget, link.Title || null, userId))
                    resultingGraph.Links.push(link);
                }
            }
            return resultingGraph;
        }

        return async(runner)();

    }

    areConnected(id1, id2, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.findAnyLink(id1, id2, undefined, userId).then(function(found) {
                resolve(utils.isDefined(found));
            });
        });
    }

    removeLinksWithId(id, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                _.remove(udata.Links, function(l) {
                    return l.IdSource === id || l.IdTarget === id;
                });
                that.save(udata).then(function() {
                    resolve();
                });
            });
        });
    }

    getRelated(id1, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            const result = [];
            const ids = [];
            for(let i = 0; i < udata.Links.length; i++) {
                const l = udata.Links[i];
                if(l.IdSource === id1) {
                    ids.push({id: l.IdTarget, title: l.Title});
                } else if(l.IdTarget === id1) {
                    ids.push({id: l.IdSource, title: l.Title});
                }
            }
            // the nodes are not necessarily in the same space and the space is not
            // necessarily accessible to the user
            if(ids.length > 0) {
                for(let i = 0; i < ids.length; i++) {
                    const item = ids[i];
                    const node = waitFor(that.getAccessibleNode(item.id, userId));
                    const clone = _.clone(node);
                    clone.Relationship = item.title;
                    result.push(clone);
                }
            }
            return result;
        }

        return async(runner)();
    }

    findAnyLink(id1, id2, title, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                let found;
                if(utils.isDefined(title)) {
                    found = _.find(udata.Links, function(l) {
                        return (l.IdSource === id1 && l.IdTarget === id2 && l.Title === title || l.IdSource === id2 && l.IdTarget === id1 && l.Title === title) && l.UserId === userId;
                    });
                } else {
                    found = _.find(udata.Links, function(l) {
                        return (l.IdSource === id1 && l.IdTarget === id2 || l.IdSource === id2 && l.IdTarget === id1) && l.UserId === userId;
                    });
                }
                resolve(found || null);
            });
        });
    }

    getLinksBetween(id1, id2, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            const r = _.filter(udata.Links, function(l) {
                return (l.IdSource === id1 && l.IdTarget === id2 || l.IdSource === id2 && l.IdTarget === id1) && l.UserId === userId;
            });
            return r;
        }

        return async(runner)();
    }

    findDirectedLink(id1, id2, title, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                let found;
                if(utils.isDefined(title)) {
                    found = _.find(udata.Links, function(l) {
                        return l.IdSource === id1 && l.IdTarget === id2 && l.Title === title;
                    });
                } else {
                    found = _.find(udata.Links, function(l) {
                        return l.IdSource === id1 && l.IdTarget === id2;
                    });
                }
                resolve(found || null);
            });
        });
    }

    getLinkWithId(id, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                const found = _.find(udata.Links, {"Id": id});
                resolve(found || null);
            });
        });
    }

    async connect(id1, id2, label, userId) {
        const udata = await (this.getUser(userId));
        let id;
        if(id1 === id2) {
            throw "Creating reflexive links is not allowed.";
        }
        // check permission to do this
        const targetSpace = await (this.getWorkspaceFromNodeId(id2, userId));
        if(utils.isUndefined(targetSpace)) {
            throw new Error("Node was not found in the user's workspaces.");
        }
        if(!_.includes(targetSpace.Users, userId)) {
            throw new Error("Target space is not shared with the user.");
        }

        const found = await (this.findDirectedLink(id1, id2, label, userId));
        if(utils.isUndefined(found)) {
            const link = {
                IdSource: id1,
                IdTarget: id2,
                Id: utils.randomId(),
                Title: label,
                UserId: userId
            };
            udata.Links.push(link);
            id = link.Id;
        } else {
            id = found.Id;
        }
        await (this.save(udata));
        return id;
    }

    disconnect(id1, id2, title, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                if(utils.isUndefined(title)) {
                    _.remove(udata.Links, {
                        IdSource: id1,
                        IdTarget: id2
                    });
                } else {
                    _.remove(udata.Links, {
                        IdSource: id1,
                        IdTarget: id2,
                        Title: title
                    });
                }
                that.save(udata).then(function() {
                    resolve();
                });
            });
        });


    }

    getTriplesByTitle(startTitle, endTitle, userId) {
        const that = this;

        function runner() {
            let i;
            const udata = waitFor(that.getUser(userId));
            const wids = udata.Metadata.Workspaces;
            const coll = [];
            const from = _.find(udata.Entities, function(e) {
                return _.includes(wids, e.WorkspaceId) && e.Title.toLowerCase() === startTitle.toLowerCase();
            });
            if(utils.isUndefined(from)) {
                return coll;
            }
            if(utils.isDefined(endTitle)) {
                const to = _.find(udata.Entities, function(e) {
                    return _.includes(wids, e.WorkspaceId) && e.Title.toLowerCase() === endTitle.toLowerCase();
                });
                if(utils.isDefined(to)) {
                    const links = waitFor(that.getLinksBetween(from.Id, to.Id, userId));
                    const predicates = [];
                    for(i = 0; i < links.length; i++) {
                        const link = links[i];
                        if(utils.isDefined(link.Title) && !_.includes(predicates, link.Title)) {
                            predicates.push(link.Title);
                            coll.push({
                                Subject: startTitle,
                                Predicate: link.Title,
                                Object: endTitle
                            });
                        }
                    }
                }
            } else {

                const related = waitFor(that.getRelated(from.Id, userId));
                for(i = 0; i < related.length; i++) {
                    const item = related[i];
                    coll.push({
                        Subject: startTitle,
                        Predicate: item.Relationship,
                        Object: item.Title
                    });
                }
            }
            return coll;
        }

        return async(runner)();
    }

    getAllUserOwnedEntities(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                if(utils.isUndefined(udata)) {
                    resolve(null);
                    return;
                }
                // a workspace belongs to one user
                // an entity belongs to one workspace
                // even if multiple users can access a workspace, there is only one owner
                // const wids = udata.Metadata.Workspaces;
                // const userEntities = _.filter(udata.Entities, function(e) {
                //     return _.includes(wids, e.WorkspaceId);
                // });
                resolve(udata.Entities);
            });
        });
    }

    getWorkspaceCount(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                if(utils.isUndefined(udata)) {
                    resolve(0);
                    return;
                }
                resolve(udata.Workspaces.length);
            })
        });

    }

    getEntityRandomImage(id, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
                that.getUser(userId).then(function(udata) {
                    const found = [];
                    const that = this;
                    const children = _.filter(udata.Links, {"IdSource": id});
                    _.forEach(children, function(c) {
                        const entity = _.find(udata.Entities, {"Id": c.IdTarget});
                        if(entity.DataType === "Image") {
                            found.push(entity);
                        }
                    });
                    resolve(found.length === 0 ? null : _.sample(found));
                });
            }
        );
    }

    getEntityAllImages(id, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
                that.getUser(userId).then(function(udata) {
                    const found = [];
                    const that = this;
                    const children = _.filter(udata.Links, {"IdSource": id});
                    _.forEach(children, function(c) {
                        const entity = _.find(udata.Entities, {"Id": c.IdTarget});
                        if(entity.DataType === "Image") {
                            found.push(entity);
                        }
                    });
                    resolve(found);
                });
            }
        );
    }

    getNode(id, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getAccessibleNodes(userId).then(function(nodes) {
                const found = _.find(nodes, {"Id": id});
                resolve(found);
            });
        });
    }

    getRecent(userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            if(utils.isUndefined(udata)) {
                return null;
            }
            const recentIds = udata.Trail;
            const result = [];
            for(let i = 0; i < recentIds.length; i++) {
                const id = recentIds[i];
                const node = waitFor(that.getNode(id, userId));
                result.push(node);
            }
            return result;
        }

        return async(runner)();
    }

    getAccessibleNode(id, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                if(utils.isUndefined(udata)) {
                    resolve(null);
                    return;
                }
                const found = _.find(udata.Entities, function(x) {
                    return x.Id.toLowerCase() === id.toLowerCase();
                });
                if(utils.isDefined(found)) {
                    const canAccess = _.includes(found.Users, userId) || _.includes(found.Users, "Everyone");
                    resolve(canAccess ? found : null);
                } else {
                    resolve(null);
                }
            });
        });
    }

    getAccessibleNodes(userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            if(utils.isUndefined(udata)) {
                return [];
            }
            // need backkey to shares here
            const foundOwn = _.filter(udata.Entities, function(entity) {
                // if shared or owned, the user will be part of the collection
                return _.includes(entity.Users, userId) || _.includes(entity.Users, "Everyone");
            });
            let all = foundOwn;
            // if user was granted access to other spaces
            if(udata.Metadata.AccessTo) {
                for(let i = 0; i < udata.Metadata.AccessTo.length; i++) {
                    const access = udata.Metadata.AccessTo[i];
                    const odata = waitFor(that.getUser(access.UserId));
                    const foundOther = _.filter(odata.Entities, function(entity) {
                        // if shared or owned, the user will be part of the collection
                        return _.includes(entity.Users, access.UserId) || _.includes(entity.Users, "Everyone");
                    });
                    all = _.concat(all, foundOther);
                }
            }
            return all;
        }

        return async(runner)();
    }

    getNodes(ids, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                if(utils.isUndefined(udata)) {
                    resolve(null);
                    return;
                }
                const found = _.filter(udata.Entities, function(e) {
                    return _.includes(ids, e.Id);
                });
                resolve(found);
            });
        });
    }

    getNodeType(node) {
        let dataType;
        if(utils.isDefined(node.DataType)) {
            dataType = node.DataType;
        } else if(utils.isDefined(node.Type)) {
            dataType = node.Type;
        } else if(utils.isDefined(node.type)) {
            dataType = node.type;
        }
        return dataType;
    }

    /**
     * The graph is created on the basis of the Titles.
     * The solves the issues that the semantic network should contain uniques concepts.
     * Using the createGraph method on the other hand will simply add nodes even if the Title
     * already exists.
     */
    createSemanticGraph(graph, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            const entities = graph.Nodes;
            const links = graph.Links;
            const nodeMap = [];
            const resultingGraph = {"Nodes": [], "Links": []};
            for(let k = 0; k < entities.length; k++) {
                const node = entities[k];
                node.UserId = userId; // owner
                const newOrExistingId = waitFor(that.createThought(node.Title, userId));
                // most likely the nodes have an id so the links can be defined bu well
                if(utils.isUndefined(node.Id)) {
                    node.Id = utils.randomId();
                }
                nodeMap[node.Id] = newOrExistingId;
                resultingGraph.Nodes.push(node);
            }
            for(let k = 0; k < links.length; k++) {
                const link = links[k];
                link.IdSource = nodeMap[link.IdSource];
                link.IdTarget = nodeMap[link.IdTarget];
                link.Id = utils.randomId();
                link.UserId = userId;
                if(!waitFor(that.areConnected(link.IdSource, link.IdTarget, userId))) {
                    waitFor(that.connect(link.IdSource, link.IdTarget, link.Title || null, userId))
                    resultingGraph.Links.push(link);
                }
            }
            return resultingGraph;
        }

        return async(runner)();
    }

    /*
     * Creates a node with the given Title if needed or returns the id of the node with this Title.
     * */
    createThought(title, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getThoughtIdWithTitle(title, userId).then(function(id) {
                if(utils.isDefined(id)) {
                    resolve(id)
                } else {
                    const node = {
                        UserId: userId,
                        Title: title,
                        DataType: "Thought",
                        Description: ""
                    };
                    that.upsertEntity(node, userId).then(function(newNode) {
                        resolve(newNode.Id);
                    });
                }
            });
        });
    }

    getThoughtIdWithTitle(title, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getThoughts(userId).then(function(thoughts) {
                const found = _.find(thoughts, function(x) {
                    return x.Title.toLowerCase() === title.toLowerCase();
                });
                if(utils.isDefined(found)) {
                    resolve(found.Id)
                } else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Upserts the given entity or node.
     * @param node
     * @param userId
     * @return {Promise<object>} Returns the saved entity which also contains additional info like the id and the properties which are not explicitly set (say, the workspaceId is set to the current workspace).
     */
    upsertEntity(node, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            if(utils.isUndefined(udata)) {
                return null;
            }
            const workspaceId = waitFor(that.getCurrentWorkspaceId(userId));

            const existingNode = waitFor(that.getNode(node.Id, userId));
            const isNew = utils.isUndefined(existingNode);
            if(isNew) {
                if(utils.isUndefined(node.Id) || node.Id === -1) {
                    node.Id = utils.randomId();
                }
                node.Users = [userId];
                // if parent workspace is public the entity should be shared
                const space = waitFor(that.getWorkspace(workspaceId, userId));
                if(space.IsPublic) {
                    node.Users.push("Everyone");
                }
                node.Tags = node.Tags || [];
                node.WorkspaceId = workspaceId;
            } else {
                node.Users = existingNode.Users;
                node.Tags = _.union(existingNode.Tags, node.Tags || []);
                node.WorkspaceId = existingNode.WorkspaceId;
                _.remove(udata.Entities, function(r) {
                    return r.Id === node.Id;
                });
            }
            // removing empty tags
            const cleanTags = [];
            _.forEach(node.Tags, function(tagName) {
                tagName = tagName.trim();
                if(tagName.length > 0) {
                    cleanTags.push(tagName);
                }
            });
            node.Tags = cleanTags;
            node.UserId = userId;

            if(utils.isUndefined(node.Description)) {
                node.Description = "";
            }
            // deciding about the entity type
            let dataType = that.getNodeType(node);

            //Object.keys(obj).length<=3
            if(utils.isUndefined(dataType)) {

                // not using the metadata here
                const shad = _.clone(node);
                delete shad.WorkspaceId;
                delete shad.Tags;
                delete shad.Users;
                delete shad.Id;
                delete shad.UserId;
                //Object.keys(obj).length<=3
                if(Object.keys(shad).length === 2 && utils.isDefined(shad.Title) && utils.isDefined(shad.Description)) {
                    dataType = "Thought";
                } else if(Object.keys(shad).length === 2 && utils.isDefined(shad.Title) && utils.isDefined(shad.Id)) {
                    dataType = "Thought";
                } else if(Object.keys(shad).length === 3 && utils.isDefined(shad.Title) && utils.isDefined(shad.Id) && utils.isDefined(shad.Description)) {
                    dataType = "Thought";
                } else {
                    dataType = "Bag";
                }
            }
            node.DataType = dataType;

            if(that.services.system) {
                // some special cases related to appointments to mimic what happens in the big one
                if(node.DataType.toLowerCase() === "appointment") {
                    if(node.Start === "Tomorrow") {
                        node.Start = that.services.system.getSystemVariable("time");
                    }
                    if(node.Start === "Friday") {
                        node.Start = that.services.system.getSystemVariable("time");
                        node.End = that.services.system.getSystemVariable("time");
                    }
                    if(node.End === "Tomorrow") {
                        node.End = that.services.system.getSystemVariable("time");
                    }
                }
            }

            udata.Entities.push(node);
            // merge the used tags
            udata.Tags = _.union(udata.Tags, node.Tags);
            waitFor(that.save(udata));
            return node;
        }

        return async(runner)();
    }

    upsertEntities(entities, userId) {
        const that = this;

        function runner() {
            const r = [];
            for(let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                const node = waitFor(that.upsertEntity(entity, userId));
                r.push(node.Id);
            }
            return r;
        }

        return async(runner)();
    }

    deleteNode(id, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                if(utils.isUndefined(udata)) {
                    resolve(null);
                    return;
                }
                // remove links
                _.remove(udata.Links, function(l) {
                    return l.IdSource === id || l.IdTarget === id;
                });
                _.remove(udata.Entities, function(r) {
                    return r.Id === id;
                });

                that.save(udata).then(function() {
                    resolve();
                });
            });

        });

    }

    nodeExists(id, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getNode(id, userId).then(function(found) {
                resolve(utils.isDefined(found));
            });
        });
    }

    /**
     * Searches the graph.
     * @param term {string} The term to search for.
     * @param type {string} The data type to constraint the search to.
     * @param userId {string} The user id.
     * @param count {Number} The maximum result set length.
     * @return {Promise<Array>}
     */
    async search(term, type, userId, count = 1000) {
        const that = this;

        term = term.trim().replace(/\*/gi, "(.*?)");
        const found = [];
        const ents = await(that.getAccessibleNodes(userId));
        if(_.isNil(ents)) {
            return found;
        }
        for(let k = 0; k < ents.length && found.length < count; k++) {
            const entity = ents[k];
            const regex = new RegExp(term, "gi");
            if(regex.test(entity.Title)) {
                if(utils.isUndefined(type) || entity.DataType === type)
                    found.push(_.clone(entity));
            }
        }
        return found;

    }

    /**
     * Assigns the given tag to the entity with the given id.
     * @param tagName {string} The name of a tag. If the tag does not exist it will be created.
     * @param id {string} The id of the entity.
     * @param userId {string} The user id.
     * @return {Promise<TResult>}
     */
    attachTag(tagName, id, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            if(utils.isUndefined(udata)) {
                return null;
            }
            const entity = _.find(udata.Entities, {Id: id});
            if(_.isNil(entity)) {
                throw new Error(`The entity with id '${id}' does not exist.`);
            }
            let found = _.find(entity.Tags, function(tag) {
                return tag.toLowerCase() === tagName.toLowerCase();
            });
            if(utils.isUndefined(found)) {
                entity.Tags.push(tagName);

                found = _.find(udata.Metadata.Tags, function(tag) {
                    return tag.toLowerCase() === tagName.toLowerCase();
                });
                if(utils.isUndefined(found)) {
                    udata.Metadata.Tags.push(tagName);

                }
                waitFor(that.save(udata));
            }
        }

        return async(runner)();
    }

    /**
     * Adds the given tag name to the tags.
     * @param tagName {string} A tag name.
     * @param userId {string} A user id.
     * @return {Promise}
     */
    addTag(tagName, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                if(utils.isUndefined(udata)) {
                    resolve(null);
                    return;
                }
                const found = _.find(udata.Metadata.Tags, function(tag) {
                    return tag.toLowerCase() === tagName.toLowerCase();
                });
                if(utils.isUndefined(found)) {
                    udata.Metadata.Tags.push(tagName);
                    that.save(udata).then(function() {
                        resolve();
                    });
                } else {
                    resolve();
                }
            });

        });

    }

    /**
     * Removes the tag on the entity
     * and also remove the tag if there are no
     * other entities tagged with it.
     * @param tagName
     * @param id
     * @param userId
     * @return {Promise<TResult>}
     */
    detachTag(tagName, id, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            if(utils.isUndefined(udata)) {
                return null;
            }
            const entity = _.find(udata.Entities, {Id: id});
            if(utils.isUndefined(entity)) {
                return null;
            }
            _.remove(entity.Tags, function(r) {
                return r === tagName;
            });
            const ents = waitFor(that.getTagEntities(tagName, userId));
            // remove tag if there ain't an entity with it anymore
            if(ents.length === 0) {
                _.remove(udata.Tags, function(r) {
                    return r === tagName;
                });
            }
            waitFor(that.save(udata));
        }

        return async(runner)();
    }

    tagExists(tagName, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            tagName = tagName.toLowerCase();
            that.getUser(userId).then(function(udata) {
                if(utils.isUndefined(udata)) {
                    resolve(null);
                    return;
                }
                const found = _.find(udata.Metadata.Tags, function(n) {
                    return n.toLowerCase() === tagName.toLowerCase();
                });
                resolve(utils.isDefined(found));
            });
        });
    }

    getTagCount(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                if(utils.isUndefined(udata)) {
                    resolve(0);
                    return;
                }
                resolve(udata.Metadata.Tags.length);
            });
        });
    }

    getTags(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                if(utils.isUndefined(udata)) {
                    resolve(null);
                    return;
                }
                let r = udata.Metadata.Tags.map(function(x) {
                    return {
                        DataType: "Tag",
                        Title: x
                    }
                });
                resolve(r);
            });
        });
    }

    getAgenda(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getAllUserOwnedEntities(userId).then(function(entities) {
                const found = _.filter(entities, {"DataType": constants.podType.Appointment});
                resolve(found);
            });
        });

    }

    getAddresses(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getAllUserOwnedEntities(userId).then(function(entities) {
                const found = _.filter(entities, {"DataType": constants.podType.Address});
                resolve(found);
            });
        });

    }

    getPeople(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getAllUserOwnedEntities(userId).then(function(entities) {
                const found = _.filter(entities, {"DataType": constants.podType.Person});
                resolve(found);
            });
        });
    }

    getTasks(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getAllUserOwnedEntities(userId).then(function(entities) {
                const found = _.filter(entities, {"DataType": constants.podType.Task});
                resolve(found);
            });
        });
    }

    getThoughts(userId) {
        const that = this;

        function runner() {
            const result = [];
            const entities = waitFor(that.getAllUserOwnedEntities(userId));
            _.forEach(entities, function(entity) {
                if(entity.DataType === "Thought") {
                    const image = waitFor(that.getEntityRandomImage(entity.Id, userId));
                    const thoughtWithImage = _.extend(_.clone(entity), {Source: utils.isDefined(image) ? image.Source : null});
                    result.push(thoughtWithImage);
                }
            });
            return result;
        }

        return async(runner)();
    }

    getTagEntities(tagName, userId) {
        const that = this;

        function runner() {

            tagName = tagName.toLowerCase();
            const entities = waitFor(that.getAllUserOwnedEntities(userId));

            const result = _.filter(entities, function(entity) {
                const lowers = _.map(entity.Tags, function(t) {
                    return t.toLowerCase()
                });
                return _.includes(lowers, tagName);
            });
            return result;

        }

        return async(runner)();
    }

    getEntityTags(id, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getNode(id, userId).then(function(n) {
                if(utils.isDefined(n)) {
                    resolve(n.Tags);
                } else {
                    resolve([]);
                }
            });
        });
    }

    getUserFiles(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getAllUserOwnedEntities(userId).then(function(entities) {
                found = _.filter(entities, function(entity) {
                    return _.includes(["Image", "Document", "Movie", "Music"], entity.DataType);
                });
                resolve(found);
            });

        });
    }

    getUserImages(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getAllUserOwnedEntities(userId).then(function(entities) {
                found = _.filter(entities, function(entity) {
                    return entity.DataType === "Image";
                });
                resolve(found);
            });

        });
    }

    getUserDocuments(userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getAllUserOwnedEntities(userId).then(function(entities) {
                found = _.filter(entities, function(entity) {
                    return entity.DataType === "Document";
                });
                resolve(found);
            });

        });
    }

    isFavorite(id, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getNode(id, userId).then(function(entity) {
                if(utils.isUndefined(entity)) {
                    resolve(false);
                } else {
                    resolve(_.includes(entity.Tags, "Favorites"));
                }
            });
        });
    }

    /**
     * Deletes the given tag name.
     * This deletes the tag from the metadata and from the entities being tagged with this tag.
     * @param tagName {string} A tag name.
     * @param userId {string} A user id.
     * @return {Promise}
     */
    deleteTag(tagName, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            const udata = waitFor(that.getUser(userId));
            if(utils.isUndefined(udata)) {
                return null;
            }
            tagName = tagName.toLowerCase();
            let found = _.find(udata.Metadata.Tags, function(r) {
                return r.toLowerCase() === tagName;
            });
            if(utils.isUndefined(found)) {
                resolve(0); // zero tags found and deleted
            }
            _.remove(udata.Metadata.Tags, function(r) {
                return r.toLowerCase() === tagName;
            });
            that.getAllUserOwnedEntities(userId).then(function(entities) {
                _.forEach(entities, function(entity) {
                    _.remove(entity.Tags, function(r) {
                        return r === tagName.toLowerCase();
                    });
                });
                udata.Entities = entities;
                that.save(udata).then(function() {
                    resolve(1) // one tag was deleted
                });
            });

        });
    }

    userCanAccessWorkspace(workspaceId, userId) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getUser(userId).then(function(udata) {
                if(utils.isUndefined(udata)) {
                    resolve(null);
                    return;
                }
                const space = _.find(udata.Workspaces, {"WorkspaceId": workspaceId});
                if(utils.isUndefined(space)) {
                    reject("The wokspace does not exist.");
                } else {
                    resolve(_.includes(space.Users, userId));
                }
            });
        });
    }

    makeWorkspacePublic(workspaceId, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            if(utils.isUndefined(udata)) {
                resolve(null);
                return;
            }
            const space = _.find(udata.Workspaces, {WorkspaceId: workspaceId, UserId: userId});
            if(space.IsPublic) {
                return;
            }
            const entities = _.filter(udata.Entities, function(e) {
                return e.WorkspaceId === workspaceId;
            });
            _.forEach(entities, function(entity) {
                entity.Users.push("Everyone");
            });
            space.IsPublic = true;
            space.Users.push("Everyone");
            waitFor(that.save(udata));
        }

        return async(runner)();
    }

    makeWorkspacePrivate(workspaceId, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            if(utils.isUndefined(udata)) {
                return null;
            }
            const space = _.find(udata.Workspaces, {WorkspaceId: workspaceId, UserId: userId});
            if(!space.IsPublic) {
                return;
            }
            const entities = _.filter(udata.Entities, function(e) {
                return e.WorkspaceId === workspaceId;
            });
            _.forEach(entities, function(entity) {
                _.remove(entity.Users, function(r) {
                    return r === "Everyone";
                });
            });
            space.IsPublic = false;
            _.remove(space.Users, function(r) {
                return r === "Everyone";
            })
            waitFor(that.save(udata));
        }

        return async(runner)();

    }

    grantAccessToWorkspace(workspaceId, otherUserId, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            const odata = waitFor(that.getUser(otherUserId));
            if(utils.isUndefined(udata) || utils.isUndefined(odata)) {
                return null;
            }
            if(!waitFor(that.userExists(userId))) {
                throw "The user does not exist.";
            }
            const space = _.find(udata.Workspaces, {WorkspaceId: workspaceId, UserId: userId});
            if(_.includes(space.Users, otherUserId)) {
                return; // already shared
            }
            space.Users.push(otherUserId);
            // conversely, add the space to the otherUserId
            if(utils.isUndefined(odata.Metadata.AccessTo)) {
                odata.Metadata.AccessTo = [];
            }
            odata.Metadata.AccessTo.push({
                UserId: userId,
                WorkspaceId: workspaceId
            });
            // propagate to the entities of the space
            const entities = _.filter(udata.Entities, function(e) {
                return e.WorkspaceId === workspaceId;
            });
            _.forEach(entities, function(entity) {
                entity.Users.push(otherUserId);
            });
            waitFor(that.save(udata));
            waitFor(that.save(odata));
        }

        return async(runner)();

    }

    revokeAccessToWorkspace(workspaceId, otherUserId, userId) {
        const that = this;

        function runner() {
            const udata = waitFor(that.getUser(userId));
            const odata = waitFor(that.getUser(otherUserId));
            if(utils.isUndefined(udata) || utils.isUndefined(odata)) {
                return null;
            }
            if(!waitFor(that.userExists(userId))) {
                throw "The user does not exist.";
            }
            const space = _.find(udata.Workspaces, {WorkspaceId: workspaceId, "UserId": userId});
            if(!_.includes(space.Users, otherUserId)) {
                return; // not shared
            }
            _.remove(space.Users, function(u) {
                return u === otherUserId;
            });
            // conversely, remove the access of the otheruser
            if(utils.isUndefined(odata.Metadata.AccessTo)) {
                throw new Error("Inconsistent security data, user should have an AccessTo metadata section.");
            }
            _.remove(odata.Metadata.AccessTo, function(x) {
                return x.UserId === userId && x.WorkspaceId === workspaceId;
            });
            // propagate to the entities of the space
            const entities = _.filter(udata.Entities, function(e) {
                return e.WorkspaceId === workspaceId;
            });
            _.forEach(entities, function(entity) {
                _.remove(entity.Users, function(u) {
                    return u === otherUserId;
                });
                // if other user created links towards that entity we drop them to keep security coherent
                const obsoleteLinks = _.filter(odata.Links, {"IdTarget": entity.Id, "UserId": otherUserId});
                _.forEach(obsoleteLinks, function(link) {
                    _.remove(odata.Links, function(l) {
                        return l.Id === link.Id;
                    })
                })
            });
            waitFor(that.save(udata));
            waitFor(that.save(odata));
        }

        return async(runner)();
    }

    getUserDefaultWorkspace(otherUserId, userId) {
        const that = this;

        function runner() {
            const spaces = waitFor(that.getWorkspacesOfUser(otherUserId, userId));
            return _.find(spaces, {"IsDefault": true});
        }

        return async(runner)();
    }
}
module.exports = GraphStorage;
