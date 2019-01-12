const
    _ = require('lodash'),
    moment = require('moment'),
    chrono = require('chrono-node');

const UnderstandingBase = require('../../Framework/UnderstandingBase');

/**
 * Date parser.
 */
class Datetime extends UnderstandingBase {

    static parse(input) {
        const r = chrono.parse(input);
        return r.map(function (x) {
            return {
                text: x.text,
                date: x.start.date(),
                end: _.isNil(x.end) ? null : x.end.date()
            }
        });
    }

    unparse(obj) {
        if (_.isPlainObject(obj)) {
            return Datetime.say(obj.date);
        }
        return Datetime.say(obj);
    }

    isValid(intput) {
        if (input instanceof Date) {
            return true;
        } else {
            try {
                moment(input);
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    static get now() {
        return new Date();
    }

    static get today() {
        return new Date();
    }

    static get yesterday() {
        return Datetime.getDaysAgo(-1);
    }

    static get tomorrow() {
        return Datetime.getDaysAgo(1);
    }

    static getDaysAgo(amount) {
        let t = new Date();
        t.setDate(new Date().getDate() + amount);
        return t;
    }

    static say(when = new Date(), what = 'full') {
        const m = moment(when);
        switch (what.toLowerCase()) {
            case 'now':
                return _.sample([
                    `It's now ${m.format('h:mm A')}.`,
                    `It's around ${m.format('hA')} now.`,
                    `To be precise, it's now ${m.format('HH:mm:ss')}.`,
                    `We are today ${m.format('dddd')} the ${m.format('do')} of ${m.format('MMMM YYYY')} and the time is ${m.format('HH:mm:ss')}.`
                ]);
            case 'full':
                return _.sample([
                    `It's ${m.format('dddd')} the ${m.format('do')} of ${m.format('MMMM YYYY')} and the time is ${m.format('HH:mm:ss')}.`
                ]);
        }
    }
}

module.exports = Datetime;
