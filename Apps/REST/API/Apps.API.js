
module.exports = function(app, qwiery) {
    const graph = qwiery.services.graph;
    const identity = qwiery.services.identity;
    const security = require("../security")(identity);
    /**
     * @swagger
     * /apps/isValidAppName/{appname}:
     *   get:
     *     operationId: is valid app name
     *     tags:
     *          - apps
     *     description: Returns whether the given name is valid as a name for an application (bot, language understanding etc.). This does not check whether the name is already taken, only whether the name is acceptable (no special characters etc.).
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: appname
     *         description: The name to check.
     *         in: path
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: Successful response
     *       401:
     *         description: The apiKey is empty. Login and use the supplied API key to make requests.
     */
    app.use("/apps/isValidAppName/:appname", security.ensureApiKey, function(req, res) {
        var appname = req.params.appname;
        if(utils.isUndefined(appname)) {
            res.json(false);
        }
        if(!/^[a-zA-Z\d]{5,100}$/gi.test(appname)) {
            res.json(false);
        }
        var ctx = {
            userId: "Anonymous"
        };
        res.json(!apps.isAppName(appname));
    });

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
     *                  description: The id of the new service.
     *                  type: string
     *              serviceName:
     *                  description: The name of the app (which you can use via chat input).
     *                  type: string
     *              errors:
     *                  description: The errors found in the supplied configuration.
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
     *      AppConfiguration:
     *          type: object
     *          required:
     *              - config
     *              - oracle
     *          properties:
     *              config:
     *                  $ref: "#/definitions/AppConfigurationConfig"
     *              oracle:
     *                  type: array
     *                  items:
     *                      $ref: "#/definitions/OracleItem"
     *          example:
     *              {
     *                "appConfig":
     *                {
     *                      "config": {
     *                          "name": "SampleBot",
     *                          "pipeline": ["oracle"],
     *                          "notfound": "Ouch, not sure what you mean..."
     *                      },
     *                      "oracle": [
     *                          {
     *                              "Id": "Tt6d7d76",
     *                              "Grab": [
     *                                  "who are you?"
     *                              ],
     *                              "Template": {
     *                                  "Answer": "I'm a Qwiery app!"
     *                              },
     *                              "UserId": "Everyone"
     *                          }]
     *                  }
     *               }
     */
    /**
     * @swagger
     * /apps/addApp:
     *   post:
     *     tags:
     *          - apps
     *     operationId: add application
     *     description: Adds a new app (bot, language understanding etc.) to Qwiery.
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: appConfig
     *         description: The app's configuration.
     *         in: body
     *         required: true
     *         schema:
     *            $ref: "#/definitions/AppConfiguration"
     *     responses:
     *       200:
     *         description: Successful response.
     *         schema:
     *            $ref: '#/definitions/ServiceResult'
     *       401:
     *         description: The apiKey is empty. Login and use the supplied API key to make requests.
     */
    app.post("/apps/addApp", security.ensureApiKey, function(req, res) {
        var appConfig = req.body.appConfig;
        apps.addApp(appConfig, req.ctx).then(function(newServiceId) {
            res.json({
                serviceId: newServiceId,
                serviceName: appConfig.config.name,
                errors: []
            });
        }).catch(function(e) {
            res.json({
                serviceId: null,
                serviceName: null,
                errors: [e]
            });
        })

    });

    /**
     * @swagger
     * /apps/ask/{appId}/{question}:
     *   post:
     *     tags:
     *          - apps
     *     operationId: ask an application
     *     description: Asks the specified app a question.
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: appId
     *         description: The app to ask.
     *         in: path
     *         required: true
     *         type: string
     *       - name: question
     *         description: The question to ask.
     *         in: path
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: Successful response
     *       401:
     *         description: The apiKey is empty. Login and use the supplied API key to make requests.
     */
    app.use("/apps/ask/:appId/:question", security.ensureApiKey, function(req, res) {
        var appId = req.params.appId;
        if(utils.isUndefined(appId)) {
            res.status(500).send("Missing application identifier.");
        }
        var question = req.params.question;
        var ctx = {
            userId: "Anonymous",
            botId: appId
        };
        qwiery.ask(question, ctx, req).then(function(session) {
            res.json(session);
        });
    });
};