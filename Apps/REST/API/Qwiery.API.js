const utils = require("../../../lib/utils");

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
            res.status(500).send("No entity supplied.");
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
        const entities = req.body.entities;
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
        const id = req.params.id;
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
        const ids = req.body.ids;
        graph.getNodes(ids, req.ctx).then(function(found) {
            res.json(found || null);
        });
    });

    app.use("/graph/entity/getMany/:id", security.ensureApiKey, function(req, res) {
        const id = req.params.id;
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
        const id = req.params.id;
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
        const id = req.query.id;
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
        const fromId = req.query.fromId;
        const toId = req.query.toId;
        const title = req.query.title;
        graph.connect(fromId, toId, title, req.ctx).then(function(r) {
            res.json(r);
        });
    });

    app.use("/graph/unlink", security.ensureApiKey, function(req, res) {
        const fromId = req.query.fromId;
        const toId = req.query.toId;
        const title = req.query.title;
        graph.disconnect(fromId, toId, title || null, req.ctx);
        res.json(true);
    });

    app.use("/graph/entity/related", security.ensureApiKey, function(req, res) {
        const id = req.query.id;
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

    //<editor-fold desc="Search">
    app.use("/search/web", security.ensureApiKey, function(req, res) {
        if(utils.isUndefined(config.bingKey)) {
            res.json([]);
            console.warn("Bing has no config key. You need to set it in 'config.bingKey'.");
            return;
        }
        const source = req.query.source || "web";
        const term = req.query.term;
        const count = Math.max(req.query.count || 10, 1);
        if(source.toLowerCase() === "image") {
            config.bing.search("image", term, count).then(function(links) {
                res.json(links);
            });
        } else if(source.toLowerCase() === "news") {
            config.bing.search("news", term, count).then(function(links) {
                res.json(links);
            });
        }
        else {
            config.bing.search("web", term, count).then(function(links) {
                res.json(links);
            });
        }


    });

    app.use("/search/graph", security.ensureApiKey, function(req, res) {
        const term = req.query.term;
        const type = req.query.type;
        graph.search(term, type, req.ctx).then(function(r) {
            res.json(r);
        });
    });

    /***
     * Is the the same as search/graph and is an alias for convenience
     */
    app.use("/graph/search", security.ensureApiKey, function(req, res) {

        const term = req.query.term;
        const type = req.query.type;
        graph.search(term, type, req.ctx).then(function(r) {
            res.json(r);
        });


    });

    app.use("/search/alpha", security.ensureApiKey, function(req, res) {
        if(utils.isUndefined(config.alpha)) {
            res.json({"Entities": []});
            console.warn("Wolfram Alpha has no config key. You need to set it in 'config.alpha'.");
            return;
        }
        const term = req.query.term;
        Promise.resolve(config.alpha.search(term)).then(function(results) {
            res.json({"Entities": results});
        })

    });

    /**
     * @swagger
     * /search/news:
     *   get:
     *     tags:
     *          - graph
     *     description: Fetches news items from an external provider (Bing, Google...).
     *     parameters:
     *           - name: term
     *             in: query
     *             description: the term to search for.
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
    app.use("/search/news", security.ensureApiKey, function(req, res) {
        if(utils.isUndefined(config.bingKey)) {
            res.json([]);
            console.warn("Bing has no config key. You need to set it in 'config.bingKey'.");
            return;
        }
        const term = req.query.term;
        const count = Math.max(req.query.count || 10, 1);
        config.bing.search("news", term, count).then(function(links) {
            res.json(links);
        });

    });

    app.use("/wikipedia/get/:page", security.ensureApiKey, function(req, res) {
        const pageName = req.params.page;
        if(utils.isUndefined(pageName)) {
            res.json({});
        }
        wiki.page(pageName).then(function(page) {
            page.info().then(function(info) {
                res.json(info);
            });
        });
    });

    app.use("/wikipedia/image/:page", security.ensureApiKey, function(req, res) {
        const pageName = req.params.page;
        if(utils.isUndefined(pageName)) {
            res.json({});
        }

    });

    app.use("/search/wikipedia", security.ensureApiKey, function(req, res) {
        const term = req.query.term;
        config.wiki.search(term, req.ctx).then(function(data) {
            res.json(data);
        });
    });
    //</editor-fold>

    //<editor-fold desc="Tags">
    app.use("/tags/agenda", security.ensureApiKey, function(req, res) {
        graph.getAgenda(req.ctx).then(function(r) {
            res.json(r);
        });
    });

    app.use("/tags/tasks", security.ensureApiKey, function(req, res) {
        graph.getTasks(req.ctx).then(function(tasks) {
            const results = [];
            for(let i = 0; i < tasks.length; i++) {
                const task = tasks[i];
                results.push({
                    Type: "Task",
                    Title: task.Title,
                    Description: task.Description,
                    Id: task.Id
                });
            }
            const flows = workflow.getSuspendedWorkflows(req.ctx);
            for(let i = 0; i < flows.length; i++) {
                const flow = flows[i];
                results.push({
                    Type: "Workflow",
                    Title: flow.Name,
                    Description: workflow.getReminder(flow),
                    Id: flow.Id
                });
            }
            res.json(results);
        });
    });

    app.use("/tags/thoughts", security.ensureApiKey, function(req, res) {
        graph.getThoughts(req.ctx).then(function(thoughts) {
            const results = [];
            for(let i = 0; i < thoughts.length; i++) {
                const task = thoughts[i];
                results.push(task);
            }
            res.json(results);
        });
    });

    app.use("/tags/addresses", security.ensureApiKey, function(req, res) {
        graph.getAddresses(req.ctx).then(function(addresses) {
            const results = [];
            for(let i = 0; i < addresses.length; i++) {
                const address = addresses[i];
                results.push({
                    Title: address.Title,
                    Description: address.Description,
                    Id: address.Id
                });
            }
            res.json(results);
        });
    });

    app.use("/tags/people", security.ensureApiKey, function(req, res) {
        graph.getPeople(req.ctx).then(function(people) {
            const results = [];
            for(let i = 0; i < people.length; i++) {
                const person = people[i];
                results.push({
                    Title: person.Title,
                    Description: person.Description,
                    Id: person.Id
                });
            }
            res.json(results);
        });
    });

    app.use("/tag/entities/:tagName", security.ensureApiKey, function(req, res) {
        const tagName = req.params.tagName;
        graph.getTagEntities(tagName, req.ctx).then(function(entities) {
            res.json(entities);
        });

    });

    app.use("/tags/favorites/add/:id", security.ensureApiKey, function(req, res) {
        const id = req.params.id;
        graph.addToFavorites(id, req.ctx).then(function() {
            res.json(true);
        });
    });

    app.use("/tags/favorites/remove/:id", security.ensureApiKey, function(req, res) {

        const id = req.params.id;
        graph.removeFromFavorites(id, req.ctx).then(function() {
            res.json(true);
        });
    });

    app.use("/tags/favorites/contains/:id", security.ensureApiKey, function(req, res) {

        const id = req.params.id;
        graph.isFavorite(id, req.ctx).then(function(tf) {
            res.json(tf);
        });
    });

    app.use("/tags/favorites/all", security.ensureApiKey, function(req, res) {

        graph.getFavorites(req.ctx).then(function(results) {
            res.json(results);
        });
    });

    app.use("/untag/entity/:entityId/:tagName", security.ensureApiKey, function(req, res) {
        const entityId = req.params.entityId;
        const tagName = req.params.tagName;
        graph.removeTagFromEntity(tagName, entityId, req.ctx).then(function() {
            res.json(true);
        });
    });

    app.use("/tag/entity/:entityId/:tagName", security.ensureApiKey, function(req, res) {
        const entityId = req.params.entityId;
        const tagName = req.params.tagName;
        graph.attachTag(tagName, entityId, req.ctx).then(function() {
            res.json({});
        });
    });

    app.use("/tags/all", security.ensureApiKey, function(req, res) {
        graph.getTags(req.ctx).then(function(tags) {
            const results = [];
            for(let i = 0; i < tags.length; i++) {
                const tag = tags[i];
                results.push({
                    Title: tag,
                    IsEntity: true,
                    Id: tag
                });
            }
            res.json(results);
        });
    });
    //</editor-fold>

    //<editor-fold desc="Profile">
    app.use("/profile/topics", security.ensureApiKey, function(req, res) {

        topics.getUserTopics(req.ctx).then(function(topics) {
            res.json(topics);
        });
    });

    app.use("/profile/personalities", security.ensureApiKey, function(req, res) {
        res.json(_.map(config.personalities, function(obj) {
            return obj.Name;
        }).sort());
    });

    app.use("/profile/personalization/clear/:key", security.ensureApiKey, function(req, res) {
        const key = req.params.key;

        personalization.clearUserPersonalization(key, req.ctx);
        res.json(true);
    });

    app.use("/profile/personalization/clearAll", security.ensureApiKey, function(req, res) {

        personalization.clearAllUserPersonalizations(req.ctx);
        res.json(true);
    });

    app.use("/profile/personalization", security.ensureApiKey, function(req, res) {
        personalization.getUserPersonalizations(req.ctx).then(function(pers) {
            res.json(pers);
        });
    });

    app.use("/profile/psy", security.ensureApiKey, function(req, res) {
        // push the personality vector through the network
        personality.getUserPersonality(req.ctx).then(function(pvec) {
            if(utils.isUndefined(pvec)) {
                res.json([]);
            } else {
                const mbti = {};
                _.forEach(pvec, function(value, k) {
                    const pItem = _.find(config.personalities, {Name: k});
                    if(pItem) {
                        const mapper = pItem.MBTI;
                        if(mapper) {
                            _.forEach(mapper, function(weight, mbtiType) {
                                if(mbti[mbtiType]) {
                                    mbti[mbtiType] = mbti[mbtiType] + parseFloat(value) * weight;
                                } else {
                                    mbti[mbtiType] = parseFloat(value) * weight;
                                }
                            })
                        }
                    }

                })
            }
            const result = [];
            let total = 0;
            _.forEach(mbti, function(v, k) {
                total += v;
            });
            _.forEach(mbti, function(v, k) {
                result.push({
                    Type: k,
                    Weight: _.round(v / total, 2)
                });
            });
            res.json(result);
        });

    });

    app.use("/profile/personality", security.ensureApiKey, function(req, res) {
        personality.getUserPersonality(req.ctx).then(function(p) {
            const result = [];
            _.forEach(p, function(v, k) {
                result.push({
                    Type: k,
                    Weight: _.round(v, 2)
                });
            });
            res.json(result);
        });
    });

    app.use("/profile/trail", security.ensureApiKey, function(req, res) {
        history.getUserTrail(req.ctx).then(function(trail) {
            res.json(trail);
        });
    });

    app.use("/profile/history/get/:id", security.ensureApiKey, function(req, res) {
        const id = req.params.id;
        history.getUserHistoryItem(id, req.ctx).then(function(item) {
            res.json(item);
        });
    });

    app.use("/profile/history/:count", security.ensureApiKey, function(req, res) {
        const count = req.params.count || 10;
        history.getUserHistory(req.ctx, count).then(function(his) {
            res.json(his);
        });
    });

    app.use("/profile/user", security.ensureApiKey, function(req, res) {

        personalization.getPersonalization("Username", req.ctx).then(function(username) {
            let thumbnail = null, alternative;
            identity.getById(req.ctx.userId).then(function(user) {
                // from facebook
                if(utils.isDefined(user.facebook)) {
                    alternative = user.facebook.name;
                    thumbnail = user.facebook.thumbnail;
                } else if(utils.isUndefined(username) && utils.isDefined(user.google)) {
                    alternative = user.google.name;
                    thumbnail = user.google.thumbnail;
                } else if(utils.isUndefined(username) && utils.isDefined(user.twitter)) {
                    alternative = user.twitter.name;
                    thumbnail = user.twitter.thumbnail;
                }
                res.json({
                    Username: utils.isUndefined(username) ? alternative : username,
                    Thumbnail: thumbnail
                });
            });
        });
    });


    app.use("/profile/spaces", security.ensureApiKey, function(req, res) {
        const spaces = graph.getUserWorkspaces(req.ctx);
        res.json(spaces);
    });
    //</editor-fold>

    //<editor-fold desc="Lexic">
    app.post("/lexic/question", security.ensureApiKey, function(req, res) {
        const question = req.body.question;
        if(utils.isUndefined(question) || question.length === 0) {
            res.status(500).send("No question supplied.");
            return;
        }
        qwiery.ask(question, req.ctx, req).then(function(session) {
            res.json(session);
        });
    });

    app.use("/ask/:question", security.ensureApiKey, function(req, res) {
        const question = req.params.question;
        qwiery.ask(question, req.ctx, req).then(function(session) {
            res.json(session);
        });
    });

    app.post("/lexic/upsert", security.ensureAdmin, function(req, res) {
        const rec = req.body;
        res.json(oracle.learn(rec));
    });

    app.use("/lexic/delete/:id", security.ensureAdmin, function(req, res) {
        const id = req.params.id;
        res.json(io.removeId(id));
    });

    app.use("/lexic/randomRecord", security.ensureApiKey, function(req, res) {
        res.json(oracle.random());
    });

    app.use("/lexic/randomQuestion", security.ensureApiKey, function(req, res) {
        const r = oracle.random();
        oracle.randomNouns(3).then(function(n) {
            const nouns = n.split(',');
            let selected = r.Grab;
            if(_.isArray(r.Grab)) {
                selected = _.sample(selected);
            }
            const q = selected.replace("$1", nouns[0]).replace("$2", nouns[1]).replace("$3", nouns[2]);
            res.json(q);
        });
    });

    app.use("/lexic/exists", security.ensureApiKey, function(req, res) {
        const question = req.query.question;
        res.json(oracle.exists(question));
    });

    app.use("/lexic/defaults", security.ensureApiKey, function(req, res) {
        res.json(config.newDefault);
    });

    app.use("/lexic/get/:id", security.ensureAdmin, function(req, res) {

        const id = req.params.id;
        res.json(oracle.findId(id));

    });

    app.post("/lexic/validate", security.ensureApiKey, function(req, res) {
        const rec = req.body;
        oracle.validate(rec);
        // try{
        //
        //     res.json("The QTL is valid.");
        // }catch(e){
        //     res.json(e.message);
        // }
        res.json(null);
    });

    //</editor-fold>

    //<editor-fold desc="Identity">
    /***
     * Login with local credentials.
     * This does not register the user.
     */
    app.use("/authentication/connectLocal", function(req, res) {
        let email = req.query.email;
        const password = req.query.password;
        if(password === undefined || password === null || password.trim().length === 0) {
            res.json({
                error: "Missing password"
            });
            return;
        }
        if(email === undefined || email === null || email.trim().length === 0) {
            res.json({
                error: "Missing email"
            });
            return;
        }
        email = email.toLocaleLowerCase();

        identity.getByEmail(email).then(function(user) {
            if(user) {

                if(user.local.password === password) {
                    res.json({
                        apiKey: user.apiKey,
                        local: {email: user.local.email},
                        facebook: user.facebook,
                        google: user.google,
                        id: user.id,
                        error: null
                    });
                } else {
                    res.json({
                        apiKey: null,
                        error: "Incorrect password"
                    });
                }

            } else {
                res.json({
                    apiKey: null,
                    error: "Email is not registered"
                });
            }
        });

    });


    /***
     * Registers local credentials.
     * If there are already social credentials they will be merged.
     */
    app.post("/authentication/registerLocal", function(req, res) {
        let email = req.body.email;
        const password = req.body.password;
        if(password === undefined || password === null || password.trim().length === 0) {
            res.json({
                error: "Missing password"
            });
            return;
        }
        if(email === undefined || email === null || email.trim().length === 0) {
            res.json({
                error: "Missing email"
            });
            return;
        }
        email = email.toLocaleLowerCase();
        const currentUser = req.body.user;
        identity.getByEmail(email).then(function(user) {
            if(user == null) {
                identity.registerLocal(email, password, currentUser).then(function(newUser) {
                    res.json(utils.stripPassword(newUser));
                });
            } else {
                res.json({
                    error: "Email already in use"
                });
            }
        });


    });

    /***
     * Connects with Facebook credentials.
     * This will merge the accounts or will create a new one.
     *
     *
     */
    app.post("/authentication/connectFacebook", function(req, res) {
            const facebookObject = req.body.facebookObject;
            const clientTicket = req.body.currentUser;
            identity.getByFacebookId(facebookObject.id).then(function(serverTicket) {
                if(serverTicket !== undefined && serverTicket !== null) {
                    if(clientTicket !== undefined && clientTicket !== null) { // if there is a client ticket there be no facebook ticket
                        if(identity.areSame(clientTicket, serverTicket)) {
                            console.log("User connects while he was already connected!?");
                            res.json(utils.stripPassword(serverTicket));
                        } else {
                            console.log("Tickets are not in sync. Or multiple tickets for the same user");
                            res.json({error: "There is already a registration for this Facebook user. Probably you have previously connected with Facebook without being logged in with the account you are using now. Log out and connect with Facebook again."})
                        }
                    } else { // no client ticket
                        res.json(utils.stripPassword(serverTicket)); //reconnect
                    }
                } else {
                    if(clientTicket !== undefined && clientTicket !== null) { // merge accounts
                        if(clientTicket.facebook) { // hack or sync
                            console.log("How comes he already has Facebook section?");
                            if(facebookObject.id !== clientTicket.facebook.id) {
                                res.json({error: "You already have a Facebook account connected and now connecting with another Facebook account!?"});
                            }
                            else {
                                console.log("Sync issues or hack");
                                res.json({error: "How comes you have these credentials while it does not exist on the server?"});
                            }
                        } else { // merge
                            identity.getByAny(clientTicket).then(function(user) {
                                user.facebook = facebookObject;
                                // if Username not set yet we'll use the Facebook info to do so
                                personalization.getPersonalization("Username", {userId: user.Id}).then(function(username) {
                                    if(utils.isUndefined(username)) {
                                        // is OK to be async
                                        personalization.addPersonalization("Username", facebookObject.first_name, {userId: user.Id});
                                    }
                                    identity.upsertUser(user).then(function() {
                                        res.json(utils.stripPassword(user));
                                    });
                                });

                            });
                        }
                    } else { // might mean the user creates multiple account, we can't know
                        const n = {
                            apiKey: utils.randomId(),
                            local: null,
                            facebook: facebookObject,
                            google: null,
                            error: null,
                            creationDate: new Date()
                        };

                        identity.upsertUser(n).then(function(newUser) {
                            // if Username not set yet we'll use the Facebook info to do so
                            personalization.getPersonalization("Username", {userId: newUser.id}).then(function(username) {
                                if(utils.isUndefined(username)) {
                                    // is OK to be async
                                    personalization.addPersonalization("Username", facebookObject.first_name, {userId: newUser.id});
                                }
                                res.json(utils.stripPassword(newUser));
                            });
                        });
                    }
                }
            });
        }
    );

    /***
     * Connects with Google credentials.
     * This will merge the accounts or will create a new one.
     *
     *
     */
    app.post("/authentication/connectGoogle", function(req, res) {
            const googleObject = req.body.googleObject;
            const clientTicket = req.body.currentUser;
            identity.getByGoogleId(googleObject.id).then(function(serverTicket) {
                if(serverTicket !== undefined && serverTicket !== null) {
                    if(clientTicket !== undefined && clientTicket !== null) { // if there is a client ticket there be no google ticket
                        if(identity.areSame(clientTicket, serverTicket)) {
                            console.log("User connects while he was already connected!?");
                            res.json(utils.stripPassword(serverTicket));
                        } else {
                            console.log("Tickets are not in sync. Or multiple tickets for the same user");
                            res.json({error: "There is already a registration for this Google user. Probably you have previously connected with Google without being logged in with the account you are using now. Log out and connect with Google again."})
                        }
                    } else { // no client ticket
                        res.json(utils.stripPassword(serverTicket)); //reconnect
                    }
                } else {
                    if(clientTicket !== undefined && clientTicket !== null) { // merge accounts
                        if(clientTicket.google) { // hack or sync
                            console.log("How comes he already has Google section?");
                            if(googleObject.id !== clientTicket.google.id) {
                                res.json({error: "You already have a Google account connected and now connecting with another Google account!?"});
                            }
                            else {
                                console.log("Sync issues or hack");
                                res.json({error: "How comes you have these credentials while it does not exist on the server?"});
                            }
                        } else { // merge
                            identity.getByAny(clientTicket).then(function(user) {
                                user.google = googleObject;
                                // if Username not set yet we'll use the Google info to do so
                                personalization.getPersonalization("Username", {userId: user.Id}).then(function(username) {
                                    if(utils.isUndefined(username)) {
                                        // is OK to be async
                                        personalization.addPersonalization("Username", googleObject.displayName, {userId: user.Id});
                                    }
                                    identity.upsertUser(user).then(function() {
                                        res.json(utils.stripPassword(user));
                                    });
                                });
                            });
                        }
                    } else { // might mean the user creates multiple account, we can't know
                        const n = {
                            apiKey: utils.randomId(),
                            local: null,
                            google: googleObject,
                            facebook: null,
                            error: null,
                            creationDate: new Date()
                        };

                        identity.upsertUser(n).then(function(newUser) {
                            // if Username not set yet we'll use the Google info to do so
                            personalization.getPersonalization("Username", {userId: newUser.id}).then(function(username) {
                                if(utils.isUndefined(username)) {
                                    // is OK to be async
                                    personalization.addPersonalization("Username", googleObject.displayName, {userId: newUser.id});
                                }
                                res.json(utils.stripPassword(newUser));
                            });
                        });
                    }
                }
            });

        }
    );
    /***
     * Connects with Twitter credentials.
     * This will merge the accounts or will create a new one.
     *
     *
     */
    app.post("/authentication/connectTwitter", function(req, res) {
            const twitterObject = req.body.twitterObject;
            const clientTicket = req.body.currentUser;
            identity.getByTwitterId(twitterObject.id).then(function(serverTicket) {
                if(serverTicket !== undefined && serverTicket !== null) {
                    if(clientTicket !== undefined && clientTicket !== null) { // if there is a client ticket there be no twitter ticket
                        if(identity.areSame(clientTicket, serverTicket)) {
                            console.log("User connects while he was already connected!?");
                            res.json(utils.stripPassword(serverTicket));
                        } else {
                            console.log("Tickets are not in sync. Or multiple tickets for the same user");
                            res.json({error: "There is already a registration for this Twitter user. Probably you have previously connected with Twitter without being logged in with the account you are using now. Log out and connect with Twitter again."})
                        }
                    } else { // no client ticket
                        res.json(utils.stripPassword(serverTicket)); //reconnect
                    }
                } else {
                    if(clientTicket !== undefined && clientTicket !== null) { // merge accounts
                        if(clientTicket.twitter) { // hack or sync
                            console.log("How comes he already has Twitter section?");
                            if(twitterObject.id !== clientTicket.twitter.id) {
                                res.json({error: "You already have a Twitter account connected and now connecting with another Twitter account!?"});
                            }
                            else {
                                console.log("Sync issues or hack");
                                res.json({error: "How comes you have these credentials while it does not exist on the server?"});
                            }
                        } else { // merge
                            identity.getByAny(clientTicket).then(function(user) {
                                user.twitter = twitterObject;
                                // if Username not set yet we'll use the Google info to do so
                                personalization.getPersonalization("Username", {userId: user.id}).then(function(username) {
                                    if(utils.isUndefined(username)) {
                                        // is OK to be async
                                        qwiery.addPersonalization("Username", twitterObject.displayName, {userId: user.id});
                                    }
                                    identity.upsertUser(user).then(function() {
                                        res.json(utils.stripPassword(user));
                                    });
                                });

                            });
                        }
                    } else { // might mean the user creates multiple account, we can't know
                        const n = {
                            apiKey: utils.randomId(),
                            local: null,
                            twitter: twitterObject,
                            facebook: null,
                            error: null,
                            creationDate: new Date()
                        };

                        identity.upsertUser(n).then(function(newUser) {
                            // if Username not set yet we'll use the Google info to do so
                            personalization.getPersonalization("Username", {userId: newUser.Id}).then(function(username) {
                                if(utils.isUndefined(username)) {
                                    // is OK to be async
                                    personalization.addPersonalization("Username", twitterObject.displayName, {userId: newUser.Id});
                                }
                                res.json(utils.stripPassword(newUser));
                            });

                        });
                    }
                }
            });

        }
    );

    app.use("/authentication/changeUsername/:newName", security.ensureApiKey, function(req, res) {
        const newName = req.params.newName;
        identity.changeUsername(newName, req.ctx).then(function(newTicket) {
            res.json(newTicket);
        });
    });

    app.use("/authentication/userid", security.ensureApiKey, function(req, res) {
        const userId = identity.getUserId(req);
        res.json(userId);
    });
    //</editor-fold>

    //<editor-fold desc="Files">
    app.use("/files/images/entity/random/:id", security.ensureApiKey, function(req, res) {
        const id = req.params.id;
        res.json(graph.getEntityRandomImage(id, req.ctx));
    });

    app.use("/files/images/entity/all/:id", security.ensureApiKey, function(req, res) {
        const id = req.params.id;
        res.json(graph.getEntityAllImages(id, req.ctx));
    });

    app.use("/files/all", security.ensureApiKey, function(req, res) {
        res.json(graph.getUserFiles(req.ctx))
    });

    app.use("/files/images", security.ensureApiKey, function(req, res) {
        res.json(graph.getUserImages(req.ctx));
    });

    app.use("/files/documents", security.ensureApiKey, function(req, res) {
        res.json(graph.getUserDocuments(req.ctx));
    });
    //</editor-fold>

    // <editor-fold desc="Admin">

    app.use("/admin/users/all", security.ensureAdmin, function(req, res) {
        identity.getAllUsers(req.ctx).then(function(all) {
            res.json(all);
        });

    });

    app.use("/admin/users/delete/:id", security.ensureAdmin, function(req, res) {
        const id = req.params.id;

        res.json(identity.deleteUser(id, req.ctx));

    });

    app.use("/admin/topics/standard/all", security.ensureApiKey, function(req, res) {
        res.json(config.topics.getStandardTopics());
    });

    app.use("/admin/globalUsage", security.ensureAdmin, function(req, res) {

        config.statistics.getGlobalUsageStats().then(function(r) {
            res.json(r);
        });

    });

    app.use("/admin/categories", security.ensureAdmin, function(req, res) {

        const dirPath = path.join(__dirname, './Data/Oracle/');
        const filenames = fs.readdirSync(dirPath);
        const result = [];
        for(let i = 0; i < filenames.length; i++) {
            const filename = filenames[i];
            if(path.extname(filename) === ".json") {
                result.push(filename.replace(".json", ""));
            }
        }
        res.json(result);

    });

    // </editor-fold>

    // <editor-fold desc="Feedback">
    app.post("/feedback", security.ensureApiKey, function(req, res) {
        const feedbackItem = req.body;
        config.feedback.save(feedbackItem);
        config.sendgrid.sendMail(feedbackItem);
    });
    // </editor-fold>

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
        const p = require("../../../package.json");
        res.send("Hello, this is Qwiery v" + p.version + ", released on " + p._versionDate + ".");
    });
    // </editor-fold>

};
