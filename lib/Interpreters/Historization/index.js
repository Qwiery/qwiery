let utils = require("../../utils"),
    constants = require("../../constants");
const InterpreterBase = require("../../Framework/InterpreterBase");
const async = require('asyncawait/async');
const system = require("../../Services/System");
const waitFor = require('asyncawait/await');
/**
 * Puts the exchange in the history.
 * 
 * @class Historization
 * @extends {InterpreterBase}
 */
class Historization extends InterpreterBase {
    constructor() {
        super("historization");
    }

    processMessage(session) {
        if(utils.isUndefined(this.services.history)) {
            return session;
        }
        const that = this;
        session.Output.Timestamp = new Date();
        session.Timing = parseFloat((session.Output.Timestamp.getTime() - new Date().getTime()) / 1000).toFixed(3) + "s";
        const statistics = that.services.statistics;
        if(utils.isDefined(statistics)) {
            // async saving is OK here
            statistics.addAnswerTiming(session.Output.Timestamp - session.Input.Timestamp);
        }
        function historize() {
            // note that if historization is off the counter will not change
            const count = waitFor(that.services.history.getHistoryCount(session.Context));
            session.ExchangeId = count + 1;
            // historization does not depend on the Handled flag but
            // the Historize flag can be used to bypass historization if needed.
            if(session.Historize) {
                // simple historization of the exchange
                waitFor(that.services.history.addHistoryItem(session, session.Context))
            }
            return session;
        }
        return async(historize)();

    }
}

module.exports = Historization;