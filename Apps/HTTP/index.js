/**
 * Use 'node ./Apps/HTTP' or 'npm run http' to launch this basic HTTP client.
 *
 * This is just the basic web interface and a lot more can be done of course,
 * but this is a stepping stone if you wish to experiment with Qwiery over HTTP.
 */

function runSingle() {

    const http = require("http"),
        Qwiery = require("../../lib"),
        path = require("path");


    const express = require("express");
    const bodyParser = require("body-parser");
    const app = express();
    const qwiery = new Qwiery();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.get("/", function(req, res) {
        res.sendFile(path.join(__dirname, './index.html'));
    });


    app.post("/ask", function(req, res) {
        if(!req.body) return res.sendStatus(400);
        const q = req.body.question;
        console.log(req.body);
        qwiery.ask(q, {return: 'simple', format: "html", req: req}).then(function(answer) {
            res.json({answer: answer, worker: cluster.worker.id});
        });
    });

    const server = app.listen(3000, function() {
        console.log("Qwiery is listening on port %s...", server.address().port);
    });

}

const cluster = require('cluster');

if(cluster.isMaster) {
    // go full-scale if you wish
    const cpuCount = 1;//require('os').cpus().length;
    for(let i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }
} else {
    runSingle();
}