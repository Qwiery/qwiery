

module.exports = function(app, qwiery) {

    const graph = qwiery.services.graph;
    const identity = qwiery.services.identity;
    const security = require("../security")(identity);


    //<editor-fold desc="Graph">
    /**
     * @swagger
     * definition:
     *      ServiceResult:
     *          type: object
     *          description: The info and/or errors when adding a new app.
     *          required:
     *              - serviceId
     *              - serviceName
     *              - errors
     *          properties:
     *              serviceId:
     *                  type: string
     *              serviceName:
     *                  type: string
     *              errors:
     *                  type: array
     *                  items:
     *                      type: string
     *      AppConfigurationConfig:
     *          type: object
     *          required:
     *              - name
     *          properties:
     *              name:
     *                  type: string
     *              pipeline:
     *                  type: array
     *                  items:
     *                      type: string
     *              notfound:
     *                  type: string
     *
     *      OracleItem:
     *          type: object
     *          required:
     *              - Id
     *              - Grab
     *          properties:
     *              Id:
     *                  type: string
     *              Grab:
     *                  type: array
     *                  items:
     *                      type: string
     *              Template:
     *                  type: object
     *              UserId:
     *                  type: string
     *              Category:
     *                  type: string
     *      Entity:
     *          type: object
     *          required:
     *              - Title
     *          properties:
     *              Title:
     *                  type: string
     *              Description:
     *                  type: string
     *              DataType:
     *                  type: string
     *          example:
     *              {
     *                "entity":
     *                  {
     *                   Title: "Something new",
     *                   Description: "A new entity in my graph."
     *                  }
     *               }
     */
    /**
     * @swagger
     * /graph/entity/upsert:
     *   post:
     *     operationId: upsert entity
     *     tags:
     *          - graph
     *     description: Upserts a semantic entity in the user's graph.
     *     parameters:
     *           - name: entity
     *             in: body
     *             description: the entity to be added
     *             required: true
     *             schema:
     *                $ref: '#/definitions/Entity'
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Successful response
     *       401:
     *         description: The ApiKey is empty. Login and use the supplied API key to make requests.
     */
    app.post("/graph/entity/upsert", security.ensureApiKey, function(req, res) {
        const entity = req.body.entity;
        if(entity === undefined || entity === null) {
            res.status(500).send("No entity supplied, use a JSON body with '{entity:...}'.");
        }
        graph.upsertEntity(entity, req.ctx).then(function(r) {
            res.json(r);
        });

    });
    /**
     * @swagger
     * /graph/entity/upsertMany:
     *   post:
     *     tags:
     *          - graph
     *     description: Upserts multiple entities to the user's graph.
     *     parameters:
     *           - name: entities
     *             in: body
     *             description: the entities to be added
     *             required: true
     *             schema:
     *                type: array
     *                items:
     *                  $ref: '#/definitions/Entity'
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Successful response
     *       401:
     *         description: The ApiKey is empty. Login and use the supplied API key to make requests.
     */
    app.post("/graph/entity/upsertMany", security.ensureApiKey, function(req, res) {
        var entities = req.body.entities;
        if(utils.isUndefined(entities)) {
            res.status(500).send("No entities supplied.");
        }
        if(entities.length === 0) {
            res.json([]);
        }
        else {
            graph.upsertEntities(entities, req.ctx).then(function(r) {
                res.json(r);
            });
        }
    });

    /**
     * @swagger
     * /graph/entity/get/{id}:
     *   post:
     *     tags:
     *          - graph
     *     description: Fetches the entity with the given id from the user's graph.
     *     parameters:
     *           - name: id
     *             in: path
     *             description: the id to fetch
     *             required: true
     *             type: string
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Successful response
     *       401:
     *         description: The ApiKey is empty. Login and use the supplied API key to make requests.
     */
    app.use("/graph/entity/get/:id", security.ensureApiKey, function(req, res) {
        var id = req.params.id;
        graph.getNode(id, req.ctx).then(function(found) {
            res.json(found || null);
        });
    });

    /**
     * @swagger
     * /graph/entity/getMany:
     *   post:
     *     tags:
     *          - graph
     *     description: Fetches multiple entities from the user's graph.
     *     parameters:
     *           - name: ids
     *             in: body
     *             description: the id to fetch
     *             required: true
     *             schema:
     *                type: array
     *                items:
     *                  type: string
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Successful response
     *       401:
     *         description: The ApiKey is empty. Login and use the supplied API key to make requests.
     */
    app.post("/graph/entity/getMany", security.ensureApiKey, function(req, res) {
        var ids = req.body.ids;
        graph.getNodes(ids, req.ctx).then(function(found) {
            res.json(found || null);
        });
    });

    app.use("/graph/entity/getMany/:id", security.ensureApiKey, function(req, res) {
        var id = req.params.id;
        graph.getNode(id, req.ctx).then(function(found) {
            res.json(found || null);
        });
    });

    /**
     * @swagger
     * /graph/entity/tags/{id}:
     *   get:
     *     tags:
     *          - graph
     *     description: Fetches the tags of the entity with the given id.
     *     parameters:
     *           - name: id
     *             in: path
     *             description: the id to fetch
     *             type: string
     *             required: true
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Successful response
     *       401:
     *         description: The ApiKey is empty. Login and use the supplied API key to make requests.
     */
    app.use("/graph/entity/tags/:id", security.ensureApiKey, function(req, res) {
        var id = req.params.id;
        graph.getEntityTags(id, req.ctx).then(function(found) {
            res.json(found || null);
        });
    });

    /**
     * @swagger
     * /graph/entity/delete:
     *   get:
     *     tags:
     *          - graph
     *     description: Deletes the entity with the given id.
     *     parameters:
     *           - name: id
     *             in: query
     *             description: the id to delete
     *             type: string
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Successful response
     *       401:
     *         description: The ApiKey is empty. Login and use the supplied API key to make requests.
     */
    app.use("/graph/entity/delete", security.ensureApiKey, function(req, res) {
        var id = req.query.id;
        graph.deleteNode(id, req.ctx);
        res.json(true);
    });

    /**
     * @swagger
     * /graph/link:
     *   get:
     *     tags:
     *          - graph
     *     description: Connects two entities.
     *     parameters:
     *           - name: fromId
     *             in: query
     *             description: the source id
     *             type: string
     *           - name: toId
     *             in: query
     *             description: the target id
     *             type: string
     *           - name: title
     *             in: query
     *             description: the optinal label for the link
     *             type: string
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Successful response
     *       401:
     *         description: The ApiKey is empty. Login and use the supplied API key to make requests.
     */
    app.use("/graph/link", security.ensureApiKey, function(req, res) {
        var fromId = req.query.fromId;
        var toId = req.query.toId;
        var title = req.query.title;
        graph.connect(fromId, toId, title, req.ctx).then(function(r) {
            res.json(r);
        });
    });

    app.use("/graph/unlink", security.ensureApiKey, function(req, res) {
        var fromId = req.query.fromId;
        var toId = req.query.toId;
        var title = req.query.title;
        graph.disconnect(fromId, toId, title || null, req.ctx);
        res.json(true);
    });

    app.use("/graph/entity/related", security.ensureApiKey, function(req, res) {
        var id = req.query.id;
        if(utils.isUndefined(id)) {
            throw "An id to fetch the related items was not supplied";
        }
        graph.getRelated(id, req.ctx).then(function(r) {
            res.json(r);
        });
    });

    app.use("/graph/entities/recent", security.ensureApiKey, function(req, res) {
        res.json(graph.getRecent(req.ctx));
    });
    //</editor-fold>
    // <editor-fold desc="Ping">
    /**
     * @swagger
     * /api/test:
     *   get:
     *     operationId: Test
     *     description: a method to test whether Qwiery is up and running.
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Successful response
     *       401:
     *         description: The ApiKey is empty. Login and use the supplied API key to make requests.
     */
    app.use("/api/test", function(req, res) {
        var p = require("../../../package.json");
        res.send("Hello, this is Qwiery v" + p.version + ", released on " + p._versionDate + ".");
    });
    // </editor-fold>

};
