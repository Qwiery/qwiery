const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const _ = require("lodash");
const port = 9000;
const ABOUTTHISREPO = "about.md";
const NOTPACKAGEVERSION = "notPackageVersion.md";
const ABOUTPACKAGE = "README.md";
const NOTAPACKAGE = "notPackage.md";
const BADURL = "badUrl.md";
const rootDir = __dirname;
const contentDir = path.join(__dirname, "Content");
const packagesDir = path.join(__dirname, "Packages");
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();
let template = null;
/**
 * Gets synchronously the directories in the given path.
 *
 * @param {any} srcpath
 * @returns
 */
function getDirectories(srcpath) {
    return fs.readdirSync(srcpath)
        .filter(file => fs.statSync(path.join(srcpath, file)).isDirectory())
}

/**
 * Fetches the latest version inside the given dir.
 *
 * @param {any} dir
 * @returns {string} The latest version as string.
 */
function getLatestVersion(dir) {
    let max = 0;
    let best = "";
    let dirs = getDirectories(dir);
    for(let i = 0; i < dirs.length; i++) {
        let dir = dirs[i];
        let num = parseInt(dir.replace(".", ""));
        if(num > max) {
            max = num;
            best = dir;
        }
    }
    return best;
}

function getTemlate() {
    if(_.isNil(template)) {
        template = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");
    }
    return template;
}

/**
 * Gets the actual path from the requested one.
 *
 * @param {any} pathname
 * @returns
 */
function getActualPath(pathname) {
    if(pathname === undefined || pathname === null) {
        throw new Error("Trying to get something undefined.");
    }
    if(!_.isString(pathname)) {
        throw new Error("Expecting a string.")
    }
    pathname = pathname.trim().toLowerCase();
    if(pathname.indexOf("./") !== 0) {
        throw new Error("Expecting a './' a start of path.")
    }
    let parts = pathname.split(/\//gi);
    parts = _.filter(parts, function(x) {
        return x.length > 0;
    });

    const result = {
        type: null,
        name: null,
        path: null,
        version: ""
    };
    if(parts.length > 1) {
        if(parts[1] === "about") { // ../about
            result.type = "md";
            result.path = path.join(contentDir, ABOUTTHISREPO);
            result.version = "";
            result.name = "about";
        }
        else {
            let packageDir = path.join(packagesDir, parts[1]);
            if(!fs.existsSync(packageDir)) { // ../not-a-package-name
                result.type = "md";
                result.path = path.join(contentDir, NOTAPACKAGE);
                result.name = "not a package";
            } else {
                let getLatestVersionVersion = getLatestVersion(packageDir);
                result.version = getLatestVersionVersion;
                result.name = parts[1];
                switch(parts.length) {
                    case 2: // ../base
                        result.type = "zip";
                        result.path = path.join(packageDir, parts[1] + "-" + getLatestVersionVersion + ".zip");
                        break;
                    case 3: // ../base/1.1
                        let spec = parts[2].replace(".", "");
                        let specNum = parseInt(spec);
                        if(_.isNaN(specNum)) {
                            if(spec.toLowerCase() === "about") {
                                result.type = "md";
                                result.path = path.join(packageDir, getLatestVersionVersion, ABOUTPACKAGE);
                            } else {
                                result.type = "md";
                                result.path = path.join(contentDir, NOTPACKAGEVERSION);
                                result.name = "not an existing version";
                            }
                        } else {
                            let specific = path.join(packageDir, parts[2]);
                            result.name = parts[1];
                            result.version = parts[2];
                            if(!fs.existsSync(specific)) {
                                result.type = "md";
                                result.path = path.join(contentDir, NOTPACKAGEVERSION);
                                result.name = "not an existing version";
                            }
                            else {
                                result.type = "zip";
                                result.path = path.join(packageDir, parts[1] + "-" + parts[2] + ".zip");
                            }
                        }
                        break;
                    case 4: // ../base/1.0/about
                        if(parts[3] !== "about") {
                            result.type = "md";
                            result.path = path.join(contentDir, BADURL);
                        } else {
                            let specific = path.join(packageDir, parts[2]);
                            if(!fs.existsSync(specific)) {
                                result.type = "md";
                                result.path = path.join(contentDir, NOTPACKAGEVERSION);
                                result.name = "not an existing version";
                            }
                            else { // ../base/1.0/ means the about is sent
                                result.type = "md";
                                result.path = path.join(packageDir, parts[2], ABOUTPACKAGE);
                            }
                        }
                        break;
                    default:
                        result.type = "md";
                        result.path = path.join(contentDir, BADURL);
                        result.name = "bad url";
                }
            }
        }

    } else {
        result.type = "md";
        result.path = path.join(contentDir, ABOUTTHISREPO);
        result.version = "";
        result.name = "about";
    }
    return result;

}
/**
 * Sends the markdown from the given absolute path.
 * @param actual {Object} A combi of path, name and version.
 * @param res {http.IncomingMessage} A response instance.
 */
function sendMarkdown(actual, res) {

    const mdFilePath = actual.path;
    if(mdFilePath === undefined || mdFilePath === null) {
        throw new Error("Missing markdown path.");
    }
    // var readStream = fs.createReadStream(path);
    // readStream.pipe(res);
    //console.log(mdFilePath);
    let content = fs.readFileSync(mdFilePath, "utf8");
    // include a list
    if(mdFilePath.indexOf(ABOUTTHISREPO) >= 0) {
        let names = getDirectories(path.join(__dirname, "packages"));
        _.forEach(names, function(name) {
            content += `\n\n - [${name}](/${name}/about)`;
        })
    }
    // const info = path.basename(mdFilePath).replace(".md", "");
    // sendHtml(md.render(content), res, info);
    const info = path.basename(mdFilePath).replace(".md", "");
    res.set("X-info", info);
    const title = `${actual.name} ${actual.version}`;
    const html = getTemlate().replace("$title$", title).replace("$content$", md.render(content));
    res.status(200).send(html);
    res.end();
}

/**
 * Creates a zip of the package+version.
 *
 * @param {any} name
 * @param {any} version
 * @returns
 */
function createPackage(name, version) {
    return new Promise(function(resolve, reject) {
        const source = path.join(packagesDir, name, version);

        const target = path.join(packagesDir, name, name + "-" + version + ".zip");
        const archiver = require('archiver');
        const archive = archiver('zip');
        const fileOutput = fs.createWriteStream(target);
        fileOutput.on('close', function() {
            //console.log(archive.pointer() + ' total bytes');
            console.log(`Package '${name}-${version}.zip' was created.`);
            resolve();
        });

        archive.pipe(fileOutput);
        archive.directory(source, "/");
        archive.on('error', function(err) {
            reject(err);
        });
        archive.finalize();
    });
}

/**
 * Sends the given content.
 * @param content {String} Any string.
 * @param res {http.IncomingMessage} A response instance.
 * @param [title] {String} Some info, mostly here for unit testing purposes.
 */
// function sendHtml(content, res, title = "") {
//     res.writeHead(200,
//         {
//             "Content-Type": "text/html",
//             "X-info": title
//         });
//     res.write(content);
//     res.end();
// }

/**
 * Sends a zip file.
 * @param actual {Object} A combi of path, name and version.
 * @param res {http.IncomingMessage} A response instance.
 */
function sendZip(actual, res) {
    // res.setHeader("Content-Disposition", "attachment;filename="+ actual.name + "-" + actual.version + ".zip");
    // res.setHeader('Content-Type', 'application/zip');
    // //res.writeHead('Content-Length', file.length);
    // var readStream = fs.createReadStream(actual.path);
    // readStream.on('open', function () {
    //     readStream.pipe(res);
    // });
    // fs.readFile(actual.path, function(err, file) {
    //     if(err) {
    //         res.statusCode = 500;
    //         res.end(`Error getting the file: ${err}.`);
    //     } else {
    //         const fullName = actual.name + "-" + actual.version + ".zip";
    //         res.writeHead(200, {
    //             "Content-disposition": "attachment; filename=" + fullName,
    //             'Content-Type': 'application/zip',
    //             'X-info': fullName,
    //             'Content-Length': file.length
    //         });
    //         res.write(file);
    //         res.end();
    //     }
    // });
    if(fs.existsSync(actual.path)) {
        const fullName = actual.name + "-" + actual.version + ".zip";
        res.set('X-info', fullName);
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', 'attachment; filename=' + fullName);
        res.sendFile(actual.path);
        //res.end();
    } else {
        res.status(404).send("The zip was not present.");
        res.end();
    }
}

const express = require("express");
const bodyParser = require("body-parser");
const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.get("*", function(req, res) {
    //res.sendFile(path.join(contentDir, ABOUTTHISREPO));
    let pathname = `.${req.path}`;
    try {
        let actual = getActualPath(pathname);
        if(actual.type === "md") {
            sendMarkdown(actual, res);
        } else {
            if(fs.existsSync(actual.path)) {
                sendZip(actual, res);
            } else {
                createPackage(actual.name, actual.version).then(function(target) {
                    sendZip(actual, res);
                });
            }
        }
    } catch(e) {
        console.error(e);
        sendHtml(e.message, res, "Error");
    }
});

const server = http.createServer(app);

/**
 * Use this via a fork, like
 *       const child = require('child_process').fork(path.join(__dirname, '../PackageServer'), {detached: true});
 *       child.send("start");
 * and somewhere when you are done use
 *      child.send("stop");
 */
process.on('message', function(m, r) {
    switch(m.toLowerCase()) {
        case "start":
            server.listen(port);
            console.log(`Qwiery repo server listening on port ${port}.`);
            break;
        case "stop":
            server.close();
            console.log(`Qwiery repo server was closed on port ${port}.`);
            break;
        case "reset":
            const v1 = path.join(packagesDir, "tester", "1.0", "tester-1.0.zip");
            fs.removeSync(v1);
            const v2 = path.join(packagesDir, "tester", "1.0", "tester-1.0.zip");
            fs.removeSync(v2);
            console.log(`Test package zips have been deleted.`);
            break;
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
        console.log(`Qwiery repo server listening on port ${port}.`);
    },
    close(){
        server.close();
        console.log(`Qwiery repo server was closed on port ${port}.`);
    }
};
