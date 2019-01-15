let utils = require("../../utils");
const InterpreterBase = require("../../Framework/InterpreterBase");

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

    async processMessage(session) {
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
        // note that if historization is off the counter will not change
        const count = await (that.services.history.getHistoryCount(session.Context));
        session.ExchangeId = count + 1;
        // historization does not depend on the Handled flag but
        // the Historize flag can be used to bypass historization if needed.
        if(session.Historize) {
            // simple historization of the exchange
            await (that.services.history.addHistoryItem(session, session.Context))
        }
        return session;

    }
}

module.exports = Historization;
