const
    Datetime = require('../lib/Understanding/Datetime'),
    _ = require('lodash');

exports.twoDates = function (test) {
    let d = Datetime.parse('My birthdate is September 27, 1977 and not 18/8/1988.');
    test.equal(d.length, 2);
    let d1 = d[0];
    let d2 = d[1];
    // note that the month starts with zero (WTF...); http://stackoverflow.com/questions/12254333/javascript-is-creating-date-wrong-month
    test.equal(d1.date.toDateString(), new Date(1977, 8, 27).toDateString());
    test.equal(d2.date.toDateString(), new Date(1988, 7, 18).toDateString());
    test.done();
};

exports.between = function (test) {
    let d = Datetime.parse('I will be in Paris between January 21st and March 2nd');
    test.equal(d.length, 2);
    let d1 = d[0];
    let d2 = d[1];
    test.equal(d1.text, 'January 21st');
    test.equal(d2.text, 'March 2nd');
    test.equal(d1.date.toDateString(), new Date(2019, 0, 21).toDateString());
    test.equal(d2.date.toDateString(), new Date(2019, 2, 2).toDateString());
    test.done();
};


exports.dates = function (test) {
    let d = Datetime.parse('Today is  the 21st of March 1988 and life is beautiful!');

    test.equal(d.length, 2);
    test.equal(d[0].date.toDateString(), new Date().toDateString());
    test.equal(d[1].date.toDateString(), new Date(1988, 2, 21).toDateString());
    test.done();
};


exports.pm = function (test) {
    let d = Datetime.parse('I will be there at 5PM');
    test.equal(d.length, 1);
    test.equal(d[0].date.toDateString(), new Date().toDateString());
    test.done();
};

exports.hour = function (test) {
    let d = Datetime.parse('It\'s now 15:45');
    test.equal(d.length, 2);
    test.equal(d[1].date.toDateString(), new Date().toDateString());
    console.log(d[1].date.toLocaleString());
    test.done();
};

exports.dash = function (test) {
    // identifying an interval
    let d = Datetime.parse('17 August 2013 - 19 August 2013');
    test.equal(d.length, 1);
    test.equal(d[0].date.toDateString(), new Date(2013, 7, 17).toDateString());
    test.equal(d[0].end.toDateString(), new Date(2013, 7, 19).toDateString());
    test.done();
};

exports.ago = function (test) {
    // identifying an interval
    let d = Datetime.parse('13 days ago');
    test.equal(d.length, 1);
    let t = new Date();
    t.setDate(new Date().getDate() -13);
    test.equal(d[0].date.toDateString(), t.toDateString());

    d = Datetime.parse('2 weeks from now');
    test.equal(d.length, 1);
    t = new Date();
    t.setDate(new Date().getDate() + 14);
    test.equal(d[0].date.toDateString(), t.toDateString());
    test.done();
};
