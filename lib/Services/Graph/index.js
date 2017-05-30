const
    path = require("path"),
    fs = require('fs-extra'),
    utils = require('../../utils'),
    constants = require('../../constants'),
    moment = require('moment'),
    ServiceBase = require('../../Framework/ServiceBase'),
    GraphStorage = require("./GraphStorage"),
    _ = require('lodash');

/**
 * Graph and semantic network API.
 * @class Graph
 * @extends ServiceBase
 */
class Graph extends ServiceBase {
    constructor() {
        super("graph");
    }

    init(instantiator) {
        super.init(instantiator);
        this.graphdb = new GraphStorage(this.services.storage);
        this.graphdb.init(instantiator);
        return Promise.resolve();
    }

    // <editor-fold desc="Private">
    /**
     * Returns the workspace contained in the ctx.workspaceId or the default workspace for the user.
     * The info returned is only the workspace and does not contain the entities within the space.
     * @param ctx {Object} The (security) context.
     * @private
     * @returns {Promise}
     */
    getCurrentWorkspace(ctx) {
        return this.graphdb.getCurrentWorkspace(ctx.userId);
    }

    /**
     * Gets the id of the current, active workspace.
     * @param ctx {Object} The (security) context.
     * @private
     * @returns {*}
     */
    getCurrentWorkspaceId(ctx) {
        if(utils.isDefined(ctx.workspaceId)) {
            return Promise.resolve(ctx.workspaceId);
        } else {
            return this.graphdb.getCurrentWorkspaceId(ctx.userId);
        }
    }

    /**
     * Gets a workspace by its id.
     * @param workspaceId {String} The workspace id.
     * @param ctx {Object} The (security) context.
     */
    getWorkspace(workspaceId, ctx) {
        return this.graphdb.getWorkspace(workspaceId, ctx.userId);
    }

    getWorkspaceSummary(workspaceId, ctx) {
        return this.graphdb.getWorkspaceSummary(workspaceId, ctx.userId);
    }

    getWorkspaceSummaries(ctx) {
        return this.graphdb.getWorkspaceSummaries(ctx.userId);
    }

    /**
     * Returns the spaces that the user owns.
     * To get all spaces the user can access see [getAccessibleWorkspaces](#.getAccessibleWorkspaces).
     * @param ctx {Object} The (security) context.
     * @see [getAccessibleWorkspaces](#.getAccessibleWorkspaces)
     * @returns {*}
     */
    getUserWorkspaces(ctx) {
        // the userId is the owner of the space
        return this.graphdb.getUserWorkspaces(ctx.userId);

    }

    /**
     * Returns the spaces of a particular user.
     * @param userId {String} The user id.
     * @param ctx {Object} The (security) context.
     * @returns {*}
     */
    getWorkspacesOfUser(userId, ctx) {
        return this.graphdb.getWorkspacesOfUser(userId, ctx.userId);
    }

    /**
     * Returns the union of the user workspaces, the shared and the public ones.
     * The info returned is only the workspace and does not contain the entities within the space.
     * @param ctx {Object} The (security) context.
     * @see [getUserWorkspaces](#.getUserWorkspaces)
     * @returns {*}
     */
    getAccessibleWorkspaces(ctx) {
        return this.graphdb.getAccessibleWorkspaces(ctx.userId);
    }

    /**
     * Returns whether the ctx.workspaceId exists for the given user.
     * @param ctx {Object|String} The (security) context.
     * @returns {Promise|Promise<T>}
     */
    workspaceExists(ctx) {
        const that = this;
        return new Promise(function(resolve, reject) {
            if(_.isString(ctx)) {
                that.getWorkspaceById(ctx).then(function(found) {
                    resolve(utils.isDefined(found));
                });
            } else {
                if(utils.isUndefined(ctx.workspaceId)) resolve(false);
                that.getWorkspaceById(ctx.workspaceId).then(function(found) {
                    resolve(utils.isDefined(found));
                });
            }
        });
    }

    /**
     * Returns the workspace with the given id.
     * @param wid
     * @returns {Promise|Promise<T>}
     */
    getWorkspaceById(wid) {
        return this.graphdb.getWorkspaceById(wid);
    }

    /**
     * Gets the workspace of the node with given id.
     * This works for any space, including the user space.
     * This works hence to fetch a tag node from its id.
     * @param id
     * @param ctx The (security) context.
     * @returns {*}
     */
    getWorkspaceFromNodeId(id, ctx) {
        return this.graphdb.getWorkspaceFromNodeId(id, ctx.userId);
    }


    /**
     * Sets the current, active workspace of the user.
     * @param name The name (or name portion) of the workspace to active.
     * @param ctx
     * @returns {boolean}
     */
    setActiveWorkspace(name, ctx) {
        return this.setCurrentWorkspace(name, ctx);
    }

    /**
     * Sets the current, active workspace of the user.
     * @param name The name (or name portion) of the workspace to active.
     * @param ctx
     * @returns {boolean}
     */
    setCurrentWorkspace(name, ctx) {
        return this.graphdb.setCurrentWorkspace(name, ctx.userId);
    }

    /**
     * Return the id of user's workspace by its name or the portion of a name.
     * @param name
     * @param ctx
     * @param exact
     * @returns {*}
     */
    getWorkspaceIdByName(name, ctx, exact = false) {
        return this.graphdb.getWorkspaceIdByName(name, ctx.userId, exact);
    }

    addWorkspace(specs, ctx) {
        const workspace = _.extend({
                "WorkspaceId": utils.randomId(),
                "Name": "New workspace",
                "IsPublic": false
            },
            specs);
        // override this; a user cannot add a default space
        workspace.IsDefault = false;
        // cannot pretend to be someone else
        workspace.UserId = ctx.userId;
        // cannot auto-share at this point
        workspace.Users = [ctx.userId];
        return this.graphdb.addWorkspace(workspace, ctx.userId);
    }

    deleteWorkspace(workspaceId, ctx) {
        return this.graphdb.deleteWorkspace(workspaceId, ctx.userId);
    }

    // </editor-fold>

    // <editor-fold desc="Graph">

    /**
     * Creates the given graph.
     */
    createGraph(graph, ctx) {
        return this.graphdb.createGraph(graph, ctx.userId);
    }

    /**
     * The graph is created on the basis of the Titles.
     * The solves the issues that the semantic network should contain uniques concepts.
     * Using the createGraph method on the other hand will simply add nodes even if the Title
     * already exists.
     */
    createSemanticGraph(graph, ctx) {
        return this.graphdb.createSemanticGraph(graph, ctx.userId);
    }

    /**
     * Returns whether the given entities are connected in one or the other direction.
     */
    areConnected(id1, id2, ctx) {
        return this.graphdb.areConnected(id1, id2, ctx.userId);
    }

    /**
     * Removes all links connected to the node with the specified id.
     * @param id
     * @param ctx The (security) context.
     */
    removeLinksWithId(id, ctx) {
        return this.graphdb.removeLinksWithId(id, ctx.userId);
    }

    /**
     * Returns related entities.
     */
    getRelated(id, ctx) {
        return this.graphdb.getRelated(id, ctx.userId);
    }

    /**
     * Returns the link with the given specs.
     * The order of the given endpoints does not matter in this case. See findDirectedLink for the exact order.
     * @param id1
     * @param id2
     * @param title If none given all links between the endpoints will be returned.
     * @param ctx The (security) context.
     * @returns {null}
     */
    findAnyLink(id1, id2, title, ctx) {
        return this.graphdb.findAnyLink(id1, id2, title, ctx.userId);
    }

    /**
     * Gets all the links between the given ids and restricted to the specified user.
     * @param id1
     * @param id2
     * @param ctx
     * @returns {Array}
     */
    getLinksBetween(id1, id2, ctx) {
        return this.graphdb.getLinksBetween(id1, id2, ctx.userId);
    }

    /**
     * Returns the link with the given endpoints and in the given order.
     * @param id1
     * @param id2
     * @param title If none given all links between the endpoints will be returned.
     * @param ctx The (security) context.
     * @returns {null}
     */
    findDirectedLink(id1, id2, title, ctx) {
        return this.graphdb.findDirectedLink(id1, id2, title, ctx.userId);
    }

    /**
     * Get the link with the given id.
     * This searches only in the accessible space, not in the user space.
     * @param id
     * @param ctx The (security) context.
     * @returns {*}
     */
    getLinkWithId(id, ctx) {
        return this.graphdb.getLinkWithId(id, ctx.userId);
    }

    /**
     * Connects the entities.
     * The link goes into the workspace of the initial node.
     * @param id1
     * @param id2
     * @param label
     * @param ctx The (security) context.
     * @returns {*} The id of the new links.
     */
    connect(id1, id2, label, ctx) {
        return this.graphdb.connect(id1, id2, label, ctx.userId);
    }

    /**
     * Disconnects the entities.
     */
    disconnect(id1, id2, title, ctx) {
        return this.graphdb.disconnect(id1, id2, title, ctx.userId);
    }

    /**
     * Gets all the semantic triples (title->predicate->title) from the given start.
     * If an endpoint is given the triples between the start and end are returned.
     * @param startTitle The title of a node.
     * @param endTitle (optional) The title of the end node.
     * @param ctx The (security) context.
     */
    getTriplesByTitle(startTitle, endTitle, ctx) {
        return this.graphdb.getTriplesByTitle(startTitle, endTitle, ctx.userId);
    }

    // </editor-fold>

    // <editor-fold desc="Nodes and entities">

    /**
     * Returns the entity count of the user.
     * @param ctx The (security) context.
     * @returns {Number}
     */
    getEntityCount(ctx) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getAllUserOwnedEntities(ctx).then(function(e) {
                if(utils.isUndefined(e)) {
                    resolve(0);
                    return;
                }
                resolve(e.length);
            });
        });
    }

    /**
     * Fetches all the entities of the user.
     * This does not include the public/shared entities the user does not own.
     * @param ctx The (security) context.
     * @returns {Array}
     */
    getAllUserOwnedEntities(ctx) {
        return this.graphdb.getAllUserOwnedEntities(ctx.userId);
    }

    /**
     * Returns the number of workspaces the user owns.
     * @param ctx The (security) context.
     * @returns {*}
     */
    getWorkspaceCount(ctx) {
        return this.graphdb.getWorkspaceCount(ctx.userId);
    }

    /**
     * Picks up a random image entity linked down to the given entity id.
     * @param id
     * @param ctx The (security) context.
     * @returns {null}
     */
    getEntityRandomImage(id, ctx) {
        return this.graphdb.getEntityRandomImage(id, ctx.userId);
    }

    /**
     * Picks up all image entities linked down to the given entity id.
     * @param id
     * @param ctx The (security) context.
     * @returns {Array}
     */
    getEntityAllImages(id, ctx) {
        return this.graphdb.getEntityAllImages(id, ctx.userId);
    }

    /**
     * Gets the node with the given id.
     * See also getAccessibleNode.
     */
    getNode(id, ctx) {
        return this.graphdb.getNode(id, ctx.userId);
    }

    getEntity(id, ctx) {
        return this.getNode(id, ctx);
    }

    /**
     * Gets the last ten nodes of the user across all workspaces.
     */
    getRecent(ctx) {
        return this.graphdb.getRecent(ctx);
    }

    /**
     * Gets the node with the given id if accessible for the ctx.userId.
     * @param id
     * @param ctx The (security) context.
     * @returns {null}
     */
    getAccessibleNode(id, ctx) {
        return this.graphdb.getAccessibleNode(id, ctx.userId);
    }

    /**
     * Fetches the nodes the user can access, either because he owns it or because it's shared or public.
     * @param ctx
     */
    getAccessibleNodes(ctx) {
        return this.graphdb.getAccessibleNodes(ctx.userId);
    }

    /**
     * Gets multiple nodes based on an array of id's.
     * This does not check the accessibility of the user.
     * @param ids
     * @returns {Array}
     */
    getNodes(ids, ctx) {
        return this.graphdb.getNodes(ids, ctx.userId);
    }

    getEntities(ids, ctx) {
        return this.getNodes(ids, ctx.userId);
    }

    /**
     * Upserts the given node.
     * @returns {Promise<Object>} Returns the new node (and the id set if none specified).
     */
    upsertEntity(node, ctx) {
        return this.graphdb.upsertEntity(node, ctx.userId);
    }

    /**
     * Upserts an array of entities.
     * @param entities
     * @returns {Array}
     */
    upsertEntities(entities, ctx) {
        return this.graphdb.upsertEntities(entities, ctx.userId);
    }

    /**
     * Deletes the node with the given id.
     */
    deleteNode(id, ctx) {
        return this.graphdb.deleteNode(id, ctx.userId);
    }

    /**
     * This does not check the user space.
     * @param id
     * @param ctx The (security) context.
     * @returns {*|boolean}
     */
    nodeExists(id, ctx) {
        return this.graphdb.nodeExists(id, ctx.userId);
    }

    // </editor-fold>

    // <editor-fold desc="Search">

    /**
     * Searches nodes for the given term.
     */
    search(term, type, ctx, count) {
        return this.graphdb.search(term, type, ctx.userId, count);
    }

// </editor-fold>

    // <editor-fold desc="Tags">

    /**
     * Assigns the given tag to the node with the specified id.
     * @param tagName
     * @param id
     * @param ctx The (security) context.
     * @returns {*} The id of the link created.
     */
    attachTag(tagName, id, ctx) {
        return this.graphdb.attachTag(tagName, id, ctx.userId);
    }

    /**
     * Adds a tag without attaching it to an entity.
     * @param tagName
     * @param ctx
     */
    addTag(tagName, ctx) {
        return this.graphdb.addTag(tagName, ctx.userId);
    }

    /**
     * Remove the tag from the entity.
     * @param tagName
     * @param id
     * @param ctx The (security) context.
     */
    detachTag(tagName, id, ctx) {
        return this.graphdb.detachTag(tagName, id, ctx.userId);
    }

    /**
     * Returns whether the given tag name exists for the user.
     * @param tagName
     * @param ctx
     * @returns {*|boolean}
     */
    tagExists(tagName, ctx) {
        return this.graphdb.tagExists(tagName, ctx.userId);
    }

    /**
     * Gets the amount of tags the user has over all his entities.
     * @param ctx The (security) context.
     * @returns {Number}
     */
    getTagCount(ctx) {
        return this.graphdb.getTagCount(ctx.userId);
    }

    /**
     * Note that this returns names and not entities!
     * @returns {Array}
     */
    getTags(ctx) {
        return this.graphdb.getTags(ctx.userId);
    }

    /**
     * Returns the favorites.
     */
    getFavorites(ctx) {
        return this.getTagEntities("Favorites", ctx);
    }

    getAgenda(ctx) {
        return this.graphdb.getAgenda(ctx.userId);
    }

    getAddresses(ctx) {
        return this.graphdb.getAddresses(ctx.userId);
    }

    getPeople(ctx) {
        return this.graphdb.getPeople(ctx.userId);
    }

    getTasks(ctx) {
        return this.graphdb.getTasks(ctx.userId);
    }

    /**
     * Gets the thoughts with a random image included if available.
     * @param ctx The (security) context.
     * @returns {Array}
     */
    getThoughts(ctx) {
        return this.graphdb.getThoughts(ctx.userId);
    }

    /**
     * Returns the entities of the user tagged with the given name.
     * @param tagName
     * @param ctx The (security) context.
     * @returns {Array}
     */
    getTagEntities(tagName, ctx) {
        return this.graphdb.getTagEntities(tagName, ctx.userId);
    }

    /**
     * Gets the tags of the entity.
     * @param id
     * @param ctx The (security) context.
     * @returns {Tags|{}|string|*|Array}
     */
    getEntityTags(id, ctx) {
        return this.graphdb.getEntityTags(id, ctx.userId);
    }

    /**
     * Gets the entities type Image, Document, Movie, Music....
     * @param ctx The (security) context.
     * @returns {Array}
     */
    getUserFiles(ctx) {
        return this.graphdb.getUserFiles(ctx.userId);
    }

    /**
     *  Gets the entities type Image.
     * @param ctx The (security) context.
     * @returns {Array}
     */
    getUserImages(ctx) {
        return this.graphdb.getUserImages(ctx.userId);
    }

    /**
     *  Gets the entities type Document.
     * @param ctx The (security) context.
     * @returns {Array}
     */
    getUserDocuments(ctx) {
        return this.graphdb.getUserDocuments(ctx.userId);
    }

    /**
     * Adds the Favorites tag to the node.
     * @param id
     * @param ctx The (security) context.
     */
    addToFavorites(id, ctx) {
        return this.graphdb.attachTag("Favorites", id, ctx.userId);
    }

    removeFromFavorites(id, ctx) {
        return this.graphdb.detachTag("Favorites", id, ctx.userId);
    }

    isFavorite(id, ctx) {
        return this.graphdb.isFavorite(id, ctx.userId);
    }

    /**
     * Deletes the given tag.
     * See also detachTag.
     * @param tagName
     * @param ctx The (security) context.
     */
    deleteTag(tagName, ctx) {
        return this.graphdb.deleteTag(tagName, ctx.userId);

    }

    // </editor-fold>

    // <editor-fold desc="Sharing and security">
    userCanAccessWorkspace(workspaceId, ctx) {
        return this.graphdb.userCanAccessWorkspace(workspaceId, ctx.userId);
    }

    getUser(ctx) {
        return this.graphdb.getUser(ctx.userId);
    }

    /**
     * Adds a user with the given id to the graph.
     * @param userId The id to add.
     * @param ctx The security context
     */
    addUser(userId, ctx) {
        return this.graphdb.addUser(userId, ctx.userId);
    }

    /**
     * Removes the user and all his data, links, workspaces...
     * This does not check whether the user is and admin, this should happen via the Identity service.
     * @param userId
     * @param ctx The (security) context.
     */
    deleteUser(userId, ctx) {
        return this.graphdb.deleteUser(userId, ctx.userId);
    }

    /**
     * Returns whether the data for the given userId is present.
     * @param userId
     * @returns {*|boolean}
     */
    userExists(userId) {
        return this.graphdb.userExists(userId);
    }

    /**
     * Turns the workspace into a publicly accessible space of entities.
     * See also makeWorkspacePrivate
     * @param workspaceId
     * @param ctx The (security) context.
     */
    makeWorkspacePublic(workspaceId, ctx) {
        return this.graphdb.makeWorkspacePublic(workspaceId, ctx.userId);
    }

    /**
     * Turns the public space back to private.
     * See also makeWorkspacePublic
     * @param workspaceId
     * @param ctx The (security) context.
     */
    makeWorkspacePrivate(workspaceId, ctx) {
        return this.graphdb.makeWorkspacePrivate(workspaceId, ctx.userId);
    }

    /**
     * Grants access to another user.
     * @param workspaceId
     * @param otherUserId
     * @param ctx The (security) context.
     */
    grantAccessToWorkspace(workspaceId, otherUserId, ctx) {
        return this.graphdb.grantAccessToWorkspace(workspaceId, otherUserId, ctx.userId);
    }

    /**
     * Revokes the access to another user.
     * @param workspaceId
     * @param otherUserId
     * @param ctx The (security) context.
     */
    revokeAccessToWorkspace(workspaceId, otherUserId, ctx) {
        return this.graphdb.revokeAccessToWorkspace(workspaceId, otherUserId, ctx.userId);
    }

    getUserDefaultWorkspace(userId, ctx) {
        return this.graphdb.getUserDefaultWorkspace(userId, ctx.userId);
    }

    // </editor-fold>

    // <editor-fold desc="Probing service">
    /**
     * The required interface for the beyond-service pipeline.
     * @param question
     * @param ctx
     * @returns {*}
     */
    tryAnswering(question, ctx) {
        const that = this;
        return new Promise(function(resolve, reject) {
            // returning the entities containing the question in their title
            that.search("*" + question + "*", null, ctx).then(function(found) {
                const mapped = _.map(found, function(item) {
                    return {
                        "DataType": "GraphItem",
                        "Title": item.Title,
                        "Id": item.Id,
                        "Description": item.Description
                    }
                });
                resolve(mapped);
            });

        });
    }

    // </editor-fold>

    // <editor-fold desc="Deduction">

    static guessDeterminer(term, upper) {
        if(upper) {
            return _.includes(["a", "e", "i", "o", "u"], term[0]) ? "An" : "A";
        } else {
            return _.includes(["a", "e", "i", "o", "u"], term[0]) ? "an" : "a";
        }
    }

    /**
     * Tries to make a deduction for a the given term.
     * The answer is based on the term having a link with a title "is".
     * @param term
     * @param ctx
     * @returns {*}
     */
    whatis(term, ctx) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getAccessibleNodes(ctx).then(function(ents) {
                const found = _.find(ents, {"Title": term});
                if(utils.isDefined(found)) {
                    that.getRelated(found.Id, ctx).then(function(adj) {
                        const isEntity = _.find(adj, {"Relationship": "is"});
                        if(utils.isDefined(isEntity)) {
                            // simplistic choice of determiner based on first letter
                            // todo: perform a deeper text analysis

                            const found = Graph.guessDeterminer(term, true) + " " + term + " is " + Graph.guessDeterminer(isEntity.Title, false) + " " + isEntity.Title;
                            resolve(found);
                        }
                        else {
                            resolve(null);
                        }
                    });

                } else {
                    resolve(null);
                }
            });

        });

    }

    // </editor-fold>
}

module.exports = Graph;