const http = require('http');
const port = 9002;
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const faker = require('faker');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.get('/weather/:location', function (req, res) {
    const location = req.params.location;
    const forecast = {
        location: location,
        temperature: _.sample(_.range(1, 30)),
        humidity: _.sample(_.range(1, 100)),
        cover: _.sample(['clouded', 'clear', 'partially clouded']),
        pressure: _.sample(_.range(1, 300)),
        wind: _.sample(_.range(1, 300))
    };
    console.log('Fake weather for' + location + ': ' + JSON.stringify(forecast));
    res.json(forecast);
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
