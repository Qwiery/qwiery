const
    Qwiery = require("../lib"),
    utils = require("../lib/utils"),
    constants = require("../lib/constants"),
    Datetime = require("../lib/Understanding/Datetime"),
    _ = require('lodash');

exports.twoDates = function(test) {
    let d = Datetime.parse("My birthdate is September 27, 1977 and not 18/8/1988.");
    test.equal(d.length, 2);
    let d1 = d[0];
    let d2 = d[1];
    // note that the month starts with zero (WTF...); http://stackoverflow.com/questions/12254333/javascript-is-creating-date-wrong-month
    test.equal(d1.date.toDateString(), new Date(1977, 8, 27).toDateString());
    test.equal(d2.date.toDateString(), new Date(1988, 7, 18).toDateString());
    test.done();
};

exports.between = function(test) {
    let d = Datetime.parse("I will be in Paris between January 21st and March 2nd");
    test.equal(d.length, 2);
    let d1 = d[0];
    let d2 = d[1];
    test.equal(d1.text, "January 21st");
    test.equal(d2.text, "March 2nd");
    test.equal(d1.date.toDateString(), new Date(2017, 0, 21).toDateString());
    test.equal(d2.date.toDateString(), new Date(2017, 2, 2).toDateString());
    test.done();
};


exports.dates = function(test) {
    let d = Datetime.parse("Today is  the 21st of March 1988 and life is beautiful!");

    test.equal(d.length, 2);
    test.equal(d[0].date.toDateString(), new Date().toDateString());
    test.equal(d[1].date.toDateString(), new Date(1988, 2, 21).toDateString());
    test.done();
};


exports.pm = function(test) {
    let d = Datetime.parse("I will be there at 5PM");
    test.equal(d.length, 1);
    test.equal(d[0].date.toDateString(), new Date().toDateString());
    test.done();
};

exports.hour = function(test) {
    let d = Datetime.parse("It's now 15:45");
    test.equal(d.length, 1);
    test.equal(d[0].date.toDateString(), new Date().toDateString());
    console.log(d[0].date.toLocaleString());
    test.done();
};
