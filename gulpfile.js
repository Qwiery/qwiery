const gulp = require('gulp'),
    del = require('del'),
    through = require('through2'),
    rename = require("gulp-rename");
// where will the release go?
const npmDir = "../npm-release/node_modules/qwiery";

// var ignore = require('gulp-ignore');
// var util = require('gulp-util');
// var insert = require('gulp-insert');
// var fs = require('fs-extra');
// var order = require("gulp-order");
// var concat = require('gulp-concat');
// var version, pckg, copyright, bumpType;

/**
 * Creates an empty QwieryDB.json file
 * for a file-based backend.
 */
function createAnonymousDB() {
    const
        Qwiery = require("./lib"),
        _ = require('lodash'),
        path = require("path"),
        fs = require("fs-extra");
    const qwiery = new Qwiery({
        system: {
            coreServices: [
                {
                    name: "MemoryStorage",
                    "filePath": path.join(npmDir, "QwieryDB.json"),
                    "autosaveInterval": 5000,
                    "autoload": true
                },
                "Graph",
                "Oracle"
            ]
        }

    });
    const services = qwiery.services;
    const graph = services.graph;

    const anonymousGraphdbPath = path.join(__dirname, "./SampleData/Anonymous.json");
    const data = fs.readJsonSync(anonymousGraphdbPath);
    return graph.graphdb.save(data.graph);
}

gulp.task("npm create DB", function() {
    gulp.src(["./"])
        .pipe(through.obj((chunk, enc, cb) => {
            return createAnonymousDB().then(function() {
                return cb(null, chunk);
            });
        }))

})
gulp.task("npm copy", function() {
    gulp.src(['Apps/**/*']).pipe(gulp.dest(npmDir + '/Apps'));
    gulp.src(['Test/**/*']).pipe(gulp.dest(npmDir + '/Test'));
    gulp.src(['SampleData/**/*']).pipe(gulp.dest(npmDir + '/SampleData'));
    gulp.src(['README.md', 'LICENSE', 'package.json']).pipe(gulp.dest(npmDir));
    return gulp.src(['lib/**/*']).pipe(gulp.dest(npmDir + '/lib'));

});

gulp.task("npm release", ["npm copy", "npm create DB"], function() {
    del([npmDir + "/lib/config.npm.js", npmDir + "/lib/config.default.js"], {force: true});
    gulp.src("./lib/config.npm.js")
        .pipe(rename("./lib/config.default.js"))
        .pipe(gulp.dest(npmDir));
});

gulp.task('default', ["npm release"]);