const Qwiery = require('../lib');

const qwiery = new Qwiery({
    defaultApp: 'Sam',
    apps: [
        {
            'id': 'Sam',
            'name': 'Sam',
            'pipeline': [
                'Parsers',
                'Deductions',
                'Commands',
                'Edictor'
            ],
        },
        {
            'id': 'Timy',
            'noAnswer': 'I need to think about this.',
            'name': 'Timy',
            'pipeline': [
                'Edictor',
                {
                    processMessage: function (session) {
                        if (session.Handled) return session;
                        session.Output.Answer = [{
                            DataType: constants.podType.Text,
                            Content: 'The time is now ' + new Date()
                        }];
                        session.Handled = true;
                        session.Trace.push({'HandledBy': 'Inline'});
                        return Promise.resolve(session);
                    }
                }
            ]
        }
    ],
    system: {
        coreServices: [
            {
                name: 'MongoStorage',
                'connection': 'mongodb://localhost:27017/QwieryDB',
                'options': {}
            },
            'Graph',
            'System',
            'Apps',
            'Oracle',
            'Pipeline',
            'Personalization',
            'Topics'],
        coreInterpreters: [
            'Commands',
            'Parsers',
            'Deductions',
            'Edictor'
        ]
    }
});
const services = qwiery.services,
    constants = require('../lib/constants'),
    _ = require('lodash'),
    helper = require('./TestUtils');

const ctx = {
    userId: 'Sharon'
};

exports.enjoy = async function (test) {
    const answer = await helper.qa('I enjoy a good movie', ctx, qwiery);
    const value = await services.personalization.getPersonalization('Like', ctx);
    test.equal(value, 'a good movie');
    test.done();
};

exports.is = async function (test) {
    await helper.qa('A quantum particle is a wave', ctx, qwiery);
    const triples = await services.graph.getTriplesByTitle('quantum particle', 'wave', ctx);
    test.equal(triples.length, 1);
    const answer = await helper.qa('what is a quantum particle', ctx, qwiery);
    console.log('|Question> ' + 'What is a quantum particle?');
    console.log('|Answer> ' + answer);
    test.done();
};
