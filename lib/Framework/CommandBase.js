const FrameworkBase = require("./FrameworkBase");
/**
 * Base class for command operators.
 * @class
 * @extends FrameworkBase
 */
class CommandBase extends FrameworkBase {
    /**
     * Attempts to handle the given session.
     * This should be called after the `canHandle` was checked.
     * @virtual
     * @param session {Session} A Qwiery Session instance.
     */
    handle(session) {
        return Promise.resolve(session);
    }

    /**
     * Returns `true` if this command can handle the given input.
     * @virtual
     * @param input {String} The `Session.Input.Raw` content.
     */
    canHandle(input) {
        return false;
    }

}

module.exports = CommandBase;