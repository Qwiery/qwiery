const
    Qwiery = require('../lib'),
    utils = require('../lib/utils'),
    _ = require('lodash'),
    path = require('path'),
    fs = require('fs-extra');

const qwiery = new Qwiery({
    system: {
        coreServices: [
            {
                name: 'MongoStorage',
                'connection': 'mongodb://localhost:27017/QwieryDB',
            },
            'Graph',
            'Oracle'
        ]
    }

});
const services = qwiery.services;
const graph = services.graph;
const ctx = {userId: 'Sharon'};


function resetSharon() {
    return new Promise(function (resolve, reject) {


        const resetAnonymous = new Promise((r) => {
            const anonymousGraphdbPath = path.join(__dirname, '../SampleData/Anonymous.json');
            const data = fs.readJsonSync(anonymousGraphdbPath);
            graph.graphdb.save(data.graph).then(function () {
                r();
            });
        });
        const resetSharon = new Promise((r) => {
            const sharonGraphdbPath = path.join(__dirname, '../SampleData/Sharon.json');
            const data = fs.readJsonSync(sharonGraphdbPath);
            graph.graphdb.save(data.graph).then(function () {
                r();
            });
        });

        Promise.all([resetAnonymous, resetSharon]).then(function () {
            resolve();
        });

    });
}

exports.getCurrentWorkspace = async function (test) {
    test.expect(4);
    await (resetSharon());
    // when running multiple tests the space can be altered, so set it explicitly here
    // No need to specify the full name, just the start of 'default workspace' is enough.
    await (graph.setCurrentWorkspace('def', ctx));
    try {
        // should throw an error; missing id
        await (graph.getCurrentWorkspace());
        test.ok(false);
    } catch (e) {
        test.ok(true); // just to be explicit
    }
    const space = await (graph.getCurrentWorkspace(ctx));
    test.ok(utils.isDefined(space), 'The space was found.');
    test.ok(space.Name === 'Default workspace', 'The space name is OK.');
    const spaceId = await (graph.getCurrentWorkspaceId(ctx));
    test.equal(space.WorkspaceId, spaceId);
    test.done();

};


exports.getWorkspaceSummaries = async function (test) {
    test.expect(2);

    await (resetSharon());

    const summs = await (graph.getWorkspaceSummaries(ctx));
    test.equal(summs.length, 2);
    test.equal(summs[0].DataType, 'WorkspaceSummary');
    test.done();

};

exports.favorites = async function (test) {
    test.expect(3);
    const node = {
        Title: utils.randomId(),
        DateType: 'Whatever'
    };

    await (resetSharon());
    const n = await (graph.upsertEntity(node, ctx));
    const id = n.Id;
    await (graph.addToFavorites(id, ctx));
    const shouldBeTrue = await (graph.isFavorite(id, ctx));
    test.ok(shouldBeTrue);
    const favs = await (graph.getFavorites(ctx));
    test.equal(favs.length, 1);
    await (graph.removeFromFavorites(id, ctx));
    const shouldBeFalse = await (graph.isFavorite(id, ctx));
    test.ok(!shouldBeFalse);
    test.done();
};

exports.workspaceExists = async function (test) {
    test.expect(2);

    await (resetSharon());

    const e1 = await (graph.workspaceExists('Sharon:default', ctx));
    test.equal(e1, true);
    const e2 = await (graph.workspaceExists('DocumentationSpace', ctx));
    test.equal(e2, false);
    test.done();

};

exports.getLinkWithId = async function (test) {
    test.expect(2);
    await (resetSharon());
    const link = await (graph.getLinkWithId('UY571bE9qA', ctx));
    test.ok(!_.isNil(link));
    test.equal(link.Title, 'has image');
    test.done();

};

exports.getUserWorkspaces = async function (test) {
    test.expect(3);

    await (resetSharon());
    const spaces = await (graph.getUserWorkspaces(ctx));
    test.ok(utils.isDefined(spaces));
    test.ok(spaces.length > 0);
    const found = _.find(spaces, function (x) {
        return x.WorkspaceId.toLowerCase() === 'documentationspace';
    });
    test.ok(utils.isDefined(found));
    console.log(found);
    test.done();

};

exports.getCurrentWorkspaceFailure = async function (test) {
    test.expect(1);

    await (resetSharon());
    // this space does not exist
    const r = await (graph.setCurrentWorkspace('xyz', ctx));
    test.ok(!r, 'The space should not have been found.');
    test.done();

};

exports.getWorkspaceFromNodeId = async function (test) {
    test.expect(1);

    await (resetSharon());
    const space = await (graph.getWorkspaceFromNodeId('Elephants', ctx));
    test.ok(utils.isDefined(space) && space.WorkspaceId === 'Sharon:default', 'The space containing the Elephant been found.');
    test.done();

};

exports.getWorkspaceIdByName = async function (test) {
    test.expect(4);

    let defid = await (graph.getWorkspaceIdByName('def', ctx));
    test.ok(utils.isDefined(defid), 'The default space was found.');
    const space = await (graph.getWorkspace(defid, ctx));
    test.ok(utils.isDefined(space) && space.WorkspaceId === defid, 'getWorkspace is OK');
    defid = await (graph.getWorkspaceIdByName('doc', ctx));
    test.ok(utils.isDefined(defid), 'The documentation space was found.');
    defid = await (graph.getWorkspaceIdByName('space', ctx));
    test.ok(utils.isUndefined(defid), 'Nothing should be found since there are multiple.');
    test.done();
};

exports.getJohnField = async function (test) {
    test.expect(2);

    const node = await (graph.getEntity('JohnField', ctx));
    test.ok(utils.isDefined(node), 'The node was found.');
    test.ok(node.Title === 'John Field', 'The node title is OK.');
    test.done();
};

exports.workspaceExists = async function (test) {
    test.expect(2);

    const anon = await (graph.workspaceExists('Anonymous:default'));
    const nex = await (graph.workspaceExists(utils.randomId()));
    test.ok(utils.isDefined(anon) && anon === true, 'The space was found.');
    test.ok(utils.isDefined(nex) && nex === false, 'The space wasn\'t found.');
    test.done();
};

exports.getWorkspaceById = async function (test) {
    test.expect(2);

    const anon = await (graph.getWorkspaceById('Anonymous:default'));
    const nex = await (graph.getWorkspaceById(utils.randomId()));
    test.ok(utils.isDefined(anon) && anon.WorkspaceId === 'Anonymous:default', 'The space was found.');
    test.ok(!utils.isDefined(nex), 'The space wasn\'t found.');
    test.done();
};

exports.areConnected = async function (test) {
    test.expect(2);

    let tf = await (graph.areConnected('GreenTea', 'GreenTeaImage', ctx));
    test.ok(utils.isDefined(tf) && tf === true, 'The items are connected.');
    tf = await (graph.areConnected('x1', 'x2', ctx));
    test.ok(utils.isDefined(tf) && tf === false, 'The items are not connected.');
    test.done();
};

exports.getNodes = async function (test) {
    test.expect(3);

    const nodes = await (graph.getNodes(['JohnField', 'Ludwig'], ctx));
    test.ok(utils.isDefined(nodes), 'The nodes were found.');
    test.ok(nodes.length === 2, 'Count is OK.');
    test.ok(nodes[1].Title === 'Ludwig von Beethoven', 'Title is OK.');
    test.done();
};

exports.getNode = async function (test) {
    test.expect(2);

    const entity = await (graph.getEntity('Ludwig', ctx));
    test.ok(utils.isDefined(entity), 'The entity was found.');
    test.ok(entity.Description === 'The greatest.', 'The entity title is OK.');
    test.done();
};

exports.upsertEntity = async function (test) {
    const node = {
        Title: 'Something new',
        Description: 'None yet'
    };
    test.expect(3);

    const n = await (graph.upsertEntity(node, ctx));
    test.ok(utils.isDefined(n), 'The id was found.');
    const found = await (graph.getEntity(n.Id, ctx));
    test.ok(utils.isDefined(found), 'The entity was found.');
    test.ok(found.Description === 'None yet', 'The entity description is OK.');
    test.done();
};

exports.attachTag = async function (test) {

    test.expect(2);

    const tagName = 'Tag' + utils.randomId();
    await (graph.attachTag(tagName, 'JohnField', ctx));
    test.ok(graph.tagExists(tagName, ctx), 'The tag exists.');
    const tags = await (graph.getEntityTags('JohnField', ctx));
    test.ok(_.includes(tags, tagName));
    test.done();
};

exports.attachTag = async function (test) {

    test.expect(2);

    const tagName = 'Tag' + utils.randomId();
    await (graph.attachTag(tagName, 'JohnField', ctx));
    test.ok(await (graph.tagExists(tagName, ctx)), 'The tag exists.');
    const tags = await (graph.getEntityTags('JohnField', ctx));
    test.ok(_.includes(tags, tagName));
    test.done();
};

exports.getTagEntities = function (test) {
    test.expect(2);
    graph.getTagEntities('Music', ctx).then(function (ents) {
        test.equal(ents.length, 1);
        // not case sensitive
        graph.getTagEntities('music', ctx).then(function (ents) {
            test.equal(ents.length, 1);
            test.done();
        });
    });

};

exports.addDeleteUser = async function (test) {
    test.expect(3);

    const userId = utils.randomId();
    await (graph.addUser(userId, {userId: 'Sharon'}));
    test.ok(await (graph.userExists(userId)));
    const ctx = {
        userId: userId
    };
    const entity = {
        Title: 'Something',
        Description: 'Diverse things'
    };
    const newNode = await (graph.upsertEntity(entity, ctx));
    entity.Id = newNode.Id;
    const spaces = await (graph.getUserWorkspaces(ctx));
    test.ok(spaces.length === 1);
    const wid = await (spaces[0].WorkspaceId);
    const newe = await (graph.getEntity(newNode.Id, ctx));
    test.ok(newe.WorkspaceId === wid);
    test.done();
};

exports.getTriplesByTitle = async function (test) {
    const ctx = {
        userId: 'Sharon'
    };
    const A = utils.randomId();
    const B = utils.randomId();
    const C = utils.randomId();
    const Ae = {
        Id: 'T1',
        Title: A,
        DataType: 'Thought'
    };
    const Be = {
        Id: 'T2',
        Title: B,
        DataType: 'Thought'
    };
    const Ce = {
        Id: 'T3',
        Title: C,
        DataType: 'Thought'
    };

    await (graph.upsertEntities([Ae, Be, Ce], ctx));
    await (graph.connect('T1', 'T3', 'is', ctx));
    await (graph.connect('T2', 'T3', 'is', ctx));
    const belongsId = await (graph.connect('T1', 'T3', 'belongs', ctx));

    let link = await (graph.findAnyLink('T1', 'T3', 'belongs', ctx));
    test.ok(utils.isDefined(link) && link.Id === belongsId);

    let links = await (graph.getLinksBetween('T1', 'T3', ctx));
    test.ok(utils.isDefined(links));
    test.equal(links.length, 2);


    const catTriples = await (graph.getTriplesByTitle(A, undefined, ctx));
    test.equal(catTriples.length, 2);

    const dogTriples = await (graph.getTriplesByTitle(B, undefined, ctx));
    test.equal(dogTriples.length, 1);

    const animalTriples = await (graph.getTriplesByTitle(C, B, ctx));
    test.equal(animalTriples.length, 1);

    const connected = await (graph.areConnected('T1', 'T3', ctx));
    test.ok(connected);
    await (graph.disconnect('T1', 'T3', 'belongs', ctx));
    links = await (graph.getLinksBetween('T1', 'T3', ctx));
    test.ok(utils.isDefined(links));
    test.equal(links.length, 1);
    //remove everything
    await (graph.removeLinksWithId('T3', ctx));

    const related = await (graph.getRelated('T3', ctx));
    test.ok(utils.isDefined(related) && related.length === 0);
    test.done();
};

exports.makePublic = async function (test) {
    test.expect(5);
    const userId = utils.randomId();
    await (graph.addUser(userId, {userId: 'Sharon'}));
    test.ok(graph.userExists(userId));
    const ctx = {
        userId: userId
    };
    const entity = {
        Title: 'Something',
        Description: 'Diverse things'
    };
    const node = await (graph.upsertEntity(entity, ctx));
    entity.Id = node.Id;
    let defaultSpace = await (graph.getUserDefaultWorkspace(userId, ctx));
    await (graph.makeWorkspacePublic(defaultSpace.WorkspaceId, ctx));
    let pentity = await (graph.getEntity(node.Id, ctx));
    test.ok(_.includes(pentity.Users, 'Everyone'));
    defaultSpace = await (graph.getUserDefaultWorkspace(userId, ctx));
    test.ok(defaultSpace.IsPublic);
    await (graph.makeWorkspacePrivate(defaultSpace.WorkspaceId, ctx));
    pentity = await (graph.getEntity(node.Id, ctx));
    test.ok(!_.includes(pentity.Users, 'Everyone'));
    defaultSpace = await (graph.getUserDefaultWorkspace(userId, ctx));
    test.ok(!defaultSpace.IsPublic);
    test.done();
};

exports.sharing = async function (test) {
    test.expect(12);

    await (resetSharon());
    const userId = utils.randomId();
    await (graph.addUser(userId, {userId: 'Sharon'}));
    test.ok(await (graph.userExists(userId)));
    const rctx = {
        userId: userId
    };
    const entity = {
        Title: 'Gravitation',
        Description: 'Diverse things'
    };
    const newNode = await (graph.upsertEntity(entity, rctx));
    entity.Id = newNode.Id;
    // not shared should throw when Sharon tries to connect
    try {
        await (graph.connect('Ludwig', newNode.Id, 'external', ctx));
        test.ok(false, 'Should not be allowed');
    } catch (e) {
        // console.log(e);
        test.ok(true);
    }

    // upon searching Sharon cannot see the entity at this point
    let found = await (graph.search('Gravitation', null, ctx));
    test.ok(found.length === 0);

    // share with Sharon
    let defaultSpace = await (graph.getUserDefaultWorkspace(userId, rctx));
    await (graph.grantAccessToWorkspace(defaultSpace.WorkspaceId, 'Sharon', rctx));
    defaultSpace = await (graph.getUserDefaultWorkspace(userId, rctx));
    test.ok(_.includes(defaultSpace.Users, 'Sharon'));
    let pentity = await (graph.getEntity(newNode.Id, rctx));
    test.ok(_.includes(pentity.Users, 'Sharon'));

    // now Sharon can see it
    found = await (graph.search('Gravitation', null, ctx));
    test.ok(found.length === 1);

    // this can also be seen from the getAccessibleWorkspaces method
    const accessibles = await (graph.getAccessibleWorkspaces(ctx));
    found = _.find(accessibles, function (x) {
        return x.WorkspaceId === defaultSpace.WorkspaceId;
    });
    test.ok(utils.isDefined(found));
    // the newly created user has just one default space
    const userSpaces = await (graph.getUserWorkspaces(ctx));
    test.ok(accessibles.length = userSpaces.length + 1);
    // testing that revoke will delete inter-space links
    // try {
    //     const linkid = await(graph.connect("Ludwig", newid, "external", ctx)); // note: Sharon is connecting, not the sharing user
    //     udata = graph.getUser("Sharon")
    //     test.ok(utils.isDefined(_.find(udata.Links, {"Id": linkid})));
    //     test.ok(false, "Should not be allowed to link to a revoked space.");
    // } catch(e) {
    //     console.log(e);
    // }

    const linkid = await (graph.connect('Ludwig', newNode.Id, 'external', ctx)); // note: Sharon is connecting, not the sharing user
    udata = await (graph.getUser({userId: 'Sharon'}));
    test.ok(utils.isDefined(_.find(udata.Links, {'Id': linkid})));
    await (graph.revokeAccessToWorkspace(defaultSpace.WorkspaceId, 'Sharon', rctx));
    defaultSpace = await (graph.getUserDefaultWorkspace(userId, rctx));
    test.ok(!_.includes(defaultSpace.Users, 'Sharon'));
    pentity = await (graph.getEntity(newNode.Id, rctx));
    test.ok(!_.includes(pentity.Users, 'Sharon'));
    udata = await (graph.getUser({userId: 'Sharon'}));
    test.ok(utils.isUndefined(_.find(udata.Links, {'Id': linkid})));
    test.done();
};

exports.deleteSpace = async function (test) {
    test.expect(10);
    const userId = utils.randomId();
    const name = utils.randomId();
    await (graph.addUser(userId, {userId: 'Sharon'}));
    test.ok(graph.userExists(userId));
    const ctx = {
        userId: userId
    };
    const defaultSpace = await (graph.getUserDefaultWorkspace(ctx.userId, ctx));
    test.throws(function () {
        await(graph.deleteWorkspace(defaultSpace.WorkspaceId, ctx));
    }, Error, 'The default space cannot be deleted.');

    const wid = await (graph.addWorkspace({Name: name}, ctx));

    let spaces = await (graph.getWorkspacesOfUser(userId, ctx));
    test.ok(spaces.length === 2);
    test.ok(spaces[1].WorkspaceId === wid);

    const user = await (graph.getUser(ctx));
    test.ok(_.includes(user.Metadata.Workspaces, wid));

    const entity = {
        Title: 'Something',
        Description: 'Diverse things'
    };

    // add entity to the new space
    await (graph.setCurrentWorkspace(name, ctx));
    const currid = await (graph.getCurrentWorkspaceId(ctx));
    test.equal(currid, wid);
    const newNode = await (graph.upsertEntity(entity, ctx));
    entity.Id = newNode.Id;
    let pentity = await (graph.getEntity(newNode.Id, ctx));
    test.ok(pentity.WorkspaceId === wid);
    // add links which will be deleted on deleting the space
    const linkid = await (graph.connect('Ludwig', newNode.Id, '', ctx));
    await (graph.deleteWorkspace(wid, ctx));
    spaces = await (graph.getWorkspacesOfUser(userId, ctx));
    test.ok(spaces.length === 1);
    pentity = await (graph.getEntity(newNode.Id, ctx));
    test.ok(utils.isUndefined(pentity));
    const link = await (graph.getLinkWithId(linkid, ctx));
    test.ok(utils.isUndefined(link));
    test.done();
};

exports.getEntityCount = async function (test) {
    const userId = utils.randomId();
    await (graph.addUser(userId, {userId: 'Sharon'}));
    test.ok(graph.userExists(userId));
    const ctx = {
        userId: userId
    };
    let count = await (graph.getEntityCount(ctx));
    test.ok(count === 0);

    const entity = {
        Title: 'Something',
        Description: 'Diverse things'
    };
    const newNode = await (graph.upsertEntity(entity, ctx));
    entity.Id = newNode.Id;
    count = await (graph.getEntityCount(ctx));
    test.ok(count === 1);

    const tag = utils.randomId();
    await (graph.attachTag(tag, newNode.Id, ctx));
    let tags = await (graph.getEntityTags(newNode.Id, ctx));
    test.ok(utils.isDefined(tags) && tags.length === 1);
    await (graph.detachTag(tag, newNode.Id, ctx));
    tags = await (graph.getEntityTags(newNode.Id, ctx));
    test.ok(utils.isDefined(tags) && tags.length === 0);

    const wcount = await (graph.getWorkspaceCount(ctx));
    test.ok(wcount === 1);

    let nodes = await (graph.getAccessibleNodes(ctx));
    test.equal(nodes.length, 1);

    await (graph.deleteNode(newNode.Id, ctx));
    nodes = await (graph.getAccessibleNodes(ctx));
    test.equal(nodes.length, 0);

    const canAccess = await (graph.userCanAccessWorkspace(userId + ':default', ctx));
    test.ok(canAccess === true);

    test.done();
};
