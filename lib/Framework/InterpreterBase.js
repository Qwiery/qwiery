const utils = require("../utils");
const FrameworkBase = require("./FrameworkBase");

/**
 * Base class for pipeline operators.
 * @class InterpreterBase
 */
class InterpreterBase extends FrameworkBase {
    /**
     * Attempts to handle the given session.
     * @virtual
     * @param session {Session} A Qwiery Session instance.
     */
    processMessage(session) {
        return Promise.resolve(session);
    }

}

module.exports = InterpreterBase;