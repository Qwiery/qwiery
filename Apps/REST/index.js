const path = require('path'),
    https = require('https'),
    cors = require('cors'),
    fs = require('fs-extra'),
    _ = require("lodash"),
    Qwiery = require("../../lib")
    ;
let template = null;

process.on('uncaughtException', function(err) {
    console.log(err);
});

const express = require('express'),
    bodyParser = require('body-parser');


const app = express();

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(cors());
let PORT;
let HOST;
//app.use(cors({"credentials": true, "origin": ['*', 'http://localhost:4787', 'http://localhost:4785', 'http://localhost:63342']}));

if(false) {
    // In case you want SSL, this is the kinda code you'll need.
    // See here (among other) for more info https://github.com/andrewconnell/generator-nodehttps/blob/master/docs/setup-https.md
    var https_options = {
        key: fs.readFileSync(__dirname + '/Data/Certificates/ssl-key.pem'),
        cert: fs.readFileSync(__dirname + '/Data/Certificates/ssl-cert.pem')
    };

    PORT = 8443;
    HOST = 'localhost';
    var server = https.createServer(https_options, app).listen(PORT, HOST);
    console.log('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+');
    console.log('HTTPS Server listening @ https://%s:%s', HOST, PORT);
    console.log('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+');
} else {
    PORT = 4785;
    HOST = 'localhost';
    app.listen(process.env.PORT | PORT);
    console.log('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+');
    console.log('HTTP Server listening @ http://%s:%s', HOST, PORT);
    console.log('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+');
}


const swaggerJSDoc = require('swagger-jsdoc');
const p = require("../../package.json");
const options = {

    swaggerDefinition: {
        info: {
            title: 'Qwiery REST API',
            version: p.version,
            description: 'Intelligence as a service',
        },

        basePath: '/', // Base path (optional)
    },

    apis: ['./API/*.js'],
};

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerSpec = swaggerJSDoc(options);
app.get('/api-docs.json', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.get('/swagger.json', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(fs.readJsonSync(path.join(__dirname, "swagger.json")));
});
//
// app.get('/Dashboard/doc/:name', function(req, res) {
//     var name = req.params.name;
//
//     var filePath = path.join(__dirname, "../docs", name + ".md");
//     if(fs.existsSync(filePath)) {
//         res.send(fs.readFileSync(filePath, 'utf8'));
//     }
//     else {
//         res.status(404).send("Document does not exist.");
//     }
// });

const qwiery = new Qwiery();
require('./API/Qwiery.API.js')(app, qwiery);
// require('./API/Data.API.js')(app, qwiery);
// require('./API/Apps.API.js')(app, qwiery);
// require('./API/Language.API.js')(app, qwiery);
// require('./API/Profile.API.js')(app, qwiery);

// development error handler
// will print stacktrace
if(app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500).send(err.message);
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500).send(err.message);
});

function getTemlate() {
    if(_.isNil(template)) {
        template = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");
    }
    return template;
}
app.use("*", function(req, res) {


    var file;
    if(req.params[0] === "/") {
        const MarkdownIt = require('markdown-it');
        const md = new MarkdownIt();
        let content = fs.readFileSync(path.join(__dirname, "README.md"), "utf8");
        const html = getTemlate().replace("$title$", "Qwiery REST Services").replace("$content$", md.render(content));
        res.status(200).send(html);
        res.end();
        return;
    }

    else if(req.params[0].toLowerCase().indexOf("/dashboard/apidocs") === 0) {
        var pageName = req.params[0].substring(19).trim().toLowerCase();
        if(pageName.length === 0 || pageName === "index") {
            res.render('APIDocs/index');
            return;
        } else {
            file = req.params[0];
            var filePath = path.join(__dirname, "../Dashboard/Views/APIDocs/", pageName);
            fs.exists(filePath, function(exists) {
                if(exists) {
                    res.sendFile(filePath);
                } else {
                    res.status(404).send("The file or service '" + file + "'does not exist.");
                }
            })
            return;
        }
    }

    else {
        file = req.params[0];
    }
    var filePath = path.join(__dirname, "../", file);
    fs.exists(filePath, function(exists) {
        if(exists) {
            res.sendFile(filePath);
        } else {
            res.status(404).send("The file or service '" + file + "'does not exist.");
        }
    })
});
/*------------------------------------------------------------------------------------ */
/*
 * Enable this bit for Azure hosting
 *

 var http = require('http');
 app.set('port', process.env.PORT || 3000);
 http.createServer(app).listen(app.get('port'), function(){
 console.log("Express server listening on port " + app.get('port'));
 });

 */
/*------------------------------------------------------------------------------------ */
/*
 * NPM on win, use
 *
 * npm config set python "C:\Users\swa\Anaconda3\envs\Py27\python.exe"
 * */

if(process.env.Platform === "Azure") {
    var http = require('http');
    app.set('port', process.env.PORT || 3000);
    http.createServer(app).listen(app.get('port'), function() {
        console.log("Express server listening on port " + app.get('port'));
    });
}