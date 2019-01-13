const Qwiery = require('../lib'),
    utils = require('../lib/utils'),
    path = require('path'),
    _ = require('lodash');
let server;
exports.api = async function (test) {
    server = require('child_process').fork(path.join(__dirname, '../Faker'), {detached: true});
    server.send('start');
    setTimeout(function () {
        utils.getWebData('http://localhost:9001')
            .catch(e => console.log(e))
            .then(function (d) {
                test.equal(d.headers['x-info'], 'Faker API');
                console.log('Body: ' + d.body);
                test.done();
            });
    }, 500);
};

exports.tearDown = function (callback) {
    server.send('stop');
    setTimeout(function () {
        server.kill();
        callback();
    }, 500);
};
//
// exports.aha = function(test) {
//     const qwiery = new Qwiery(
//         {
//             defaultApp: "MyApp",
//             apps: [
//                 {
//                     name: "MyApp",
//                     id:"MyApp",
//                     pipeline: [
//                         {
//                             processMessage: function(session, context) {
//                                 context.services.unknowns.inspect(session.Input.Raw);
//                                 return session;
//                             }
//                         }
//                     ]
//                 }
//             ],
//             plugins: [
//                 "Unknowns"
//             ]
//         }
//     );
//     qwiery.ask("The legendary king of Scotland was an abricedarity.", {return: "plain"}).then(function() {
//         test.done();
//     });
// };

// exports.dummy = function(test) {
//
//     test.done();
// };
//
// exports.keywords = function(test) {
//     const q = new Qwiery();
//     q.ask("prefs").then(function(session) {
//
//         test.done();
//     });
// };
// exports.test = function(test) {
//     const qwiery = new Qwiery({
//         defaultApp: "Geri",
//         apps: [
//             {
//                 id: "Geri",
//                 name: "Geri",
//                 oracle: [{
//                     "Id": "tomorrow something",
//                     "Questions": [
//                         "Tomorrow %1"
//                     ],
//                     "Template": {
//                         "Answer": "ThinkResult",
//                         "Think": {
//                             "CreateReturn": {
//                                 "Workflow": {
//                                     "Name": "Agenda flow",
//                                     "States": [
//                                         {
//                                             "name": "ToAgenda",
//                                             "type": "YesNo",
//                                             "enter": "Shall I add this to your agenda?",
//                                             "initial": true
//                                         },
//                                         {
//                                             "name": "AddIt",
//                                             "type": "Dummy",
//                                             "enter": "It's been added to your agenda.",
//                                             "deactivate": {
//                                                 "%eval": "addToAgenda(%1)"
//                                             },
//                                             "final":true
//                                         },
//                                         {
//                                             "name": "NoNeed",
//                                             "type": "Dummy",
//                                             "enter": "OK, just asking.",
//                                             "final": true
//                                         }
//                                     ],
//                                     "Transitions": [
//                                         "ToAgenda->AddIt",
//                                         "ToAgenda->NoNeed, false"
//                                     ]
//                                 }
//                             }
//                         }
//                     },
//                     "UserId": "Everyone",
//                     "Category": "Basic"
//                 }]
//             }
//         ]
//     });
//     qwiery.run(["Tomorrow to Gent", "Yes"], {userId: "Sharon"}, true).then(function(ss) {
//         console.log(ss);
//         test.done();
//     });
// };


