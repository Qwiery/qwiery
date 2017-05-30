
const Qwiery = require("qwiery");
const InterpreterBase = Qwiery.InterpreterBase;

/**
 * Puts unknown nouns in custom collection.
 *
 * @class UnknownNouns
 * @extends {InterpreterBase}
 */
class UnknownNouns extends InterpreterBase {
    constructor() {
        super("unknowns");
    }

    processMessage(session, context) {
        context.services.unknowns.inspect(session.Input.Raw);
        return session;
    }
}

module.exports = UnknownNouns;