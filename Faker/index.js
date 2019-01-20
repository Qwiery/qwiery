const http = require('http');
const port = 9002;
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const faker = require('faker');
const path = require('path');
const fs = require('fs-extra');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


//region Swagger
const swaggerJSDoc = require('swagger-jsdoc');
const options = {

    swaggerDefinition: {
        info: {
            title: 'Faker REST API',
            version: 1.0,
            description: 'Intelligence as a service',
        },

        basePath: '/', // Base path (optional)
    },

    apis: [path.join(__dirname, './index.js')],
};

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerSpec = swaggerJSDoc(options);
app.get('/api-docs.json', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.get('/swagger.json', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(fs.readJsonSync(path.join(__dirname, 'swagger.json')));
});
//endregion

/**
 * @swagger
 * /weather/{location}:
 *   get:
 *     tags:
 *          - graph
 *     description: Fetches the entity with the given id from the user's graph.
 *     parameters:
 *           - name: location
 *             in: path
 *             description: the location to query
 *             required: true
 *             type: string
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful response
 */
app.get('/weather/:location', function (req, res) {
    const location = req.params.location;
    if (_.isNil(location)) {
        throw new Error('No location specified.');
    }
    const forecast = {
        location: location,
        temperature: _.sample(_.range(1, 30)),
        humidity: _.sample(_.range(1, 100)),
        cover: _.sample(['clouded', 'clear', 'partially clouded']),
        pressure: _.sample(_.range(1, 300)),
        wind: _.sample(_.range(1, 300))
    };
    res.json(forecast);
});

/**
 * @swagger
 * /people/address:
 *   get:
 *     tags:
 *          - graph
 *     description: Fetches a random address.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful response
 */
app.get('/people/address', function (req, res) {
    const address = {
        addressLine: faker.address.streetAddress(),
        zip: faker.address.zipCode(),
        city: faker.address.city(),
        country: faker.address.country()
    };
    res.json(address);
});

app.get('*', function (req, res) {
    res.set('X-info', 'Faker API');
    res.status(200).send('Qwiery Faker API');
});

const server = http.createServer(app);

/**
 * Use this via a fork, like
 *       const child = require('child_process').fork(path.join(__dirname, '../PackageServer'), {detached: true});
 *       child.send("start");
 * and somewhere when you are done use
 *      child.send("stop");
 */
process.on('message', function (m, r) {
    try {
        switch (m.toLowerCase()) {
            case 'start':
                server.listen(port);
                console.log(`Faker API listening on port ${port}.`);
                break;
            case 'stop':
                server.close();
                console.log(`Faker API was closed on port ${port}.`);
                break;
            default:
                console.error(`Faker API did not understand the command '${m.toLowerCase()}'.`);
        }
    } catch (e) {
        console.error(e);
    }

});

/**
 * Use this through a normal module import, like
 *      const server = require("./PackageServer");
 *      server.listen();
 */
module.exports = {
    listen() {
        server.listen(port);
        console.log(`Faker API listening on port ${port}.`);
    },
    close() {
        server.close();
        console.log(`Faker API was closed on port ${port}.`);
    }
};
