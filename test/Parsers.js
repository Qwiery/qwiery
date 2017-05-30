const
    Qwiery = require("../lib"),
    Parsers = require("../lib/Interpreters/Parsers"),
    _ = require("lodash"),
    utils = require("../lib/utils");
const session = {
    Input: {
        Raw: ""
    },
    Context: {
        userId: "Sharon",
        appId: "default"
    }
};
const async = require('asyncawait/async');
const waitFor = require('asyncawait/await');

const qwiery = new Qwiery();
const parsers = qwiery.interpreters.parsers;

exports.joins = function(test) {

    const stuff = [
        "Video", "YouTube", "ASD oiaTas", "I can", "while", ".com", "//www.", " ", "__", "?q=234123", "http://www.cnn.com", "$;", "361", "Light", "Watch"
    ];

    function someStuff() {
        const count = Math.random() * 20;
        const r = [];
        for(let i = 0; i < count; i++) {
            r.push(stuff[Math.floor(Math.random() * stuff.length)]);
        }
        return r.join(" ");
    }

    const urls = [
        '//www.youtube-nocookie.com/embed/up_lNV-yoK4?rel=0',
        'http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo',
        'http://www.youtube.com/watch?v=cKZDdG9FTKY&feature=channel',
        'http://www.youtube.com/watch?v=yZ-K7nCVnBI&playnext_from=TL&videos=osPknwzXEas&feature=sub',
        'http://www.youtube.com/ytscreeningroom?v=NRHVzbJVx8I',
        'http://www.youtube.com/user/SilkRoadTheatre#p/a/u/2/6dwqZw0j_jY',
        'http://youtu.be/6dwqZw0j_jY',
        'http://www.youtube.com/watch?v=6dwqZw0j_jY&feature=youtu.be',
        'http://youtu.be/afa-5HQHiAs',
        'http://www.youtube.com/user/Scobleizer#p/u/1/1p3vcRhsYGo?rel=0',
        'http://www.youtube.com/watch?v=cKZDdG9FTKY&feature=channel',
        'http://www.youtube.com/watch?v=yZ-K7nCVnBI&playnext_from=TL&videos=osPknwzXEas&feature=sub',
        'http://www.youtube.com/ytscreeningroom?v=NRHVzbJVx8I',
        'http://www.youtube.com/embed/nas1rJpm7wY?rel=0',
        'http://www.youtube.com/watch?v=peFZbP64dsU',
        'http://youtube.com/v/dQw4w9WgXcQ?feature=youtube_gdata_player',
        'http://youtube.com/vi/dQw4w9WgXcQ?feature=youtube_gdata_player',
        'http://youtube.com/?v=dQw4w9WgXcQ&feature=youtube_gdata_player',
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player',
        'http://youtube.com/?vi=dQw4w9WgXcQ&feature=youtube_gdata_player',
        'http://youtube.com/watch?v=dQw4w9WgXcQ&feature=youtube_gdata_player',
        'http://youtube.com/watch?vi=dQw4w9WgXcQ&feature=youtube_gdata_player',
        'http://youtu.be/dQw4w9WgXcQ?feature=youtube_gdata_player'
    ];
    test.expect(2 * urls.length);

    function runner() {
        for(let i = 0; i < urls.length; i++) {
            // surround it with some noise
            session.Input.Raw = someStuff() + urls[i] + someStuff();
            console.log(session.Input.Raw + "\n");
            const found = waitFor(parsers.youtube(session));
            test.ok(utils.isDefined(found));
            test.equal(found.length, 2);
        }
        test.done();
    }

    return async(runner)();
};
