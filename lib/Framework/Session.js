const utils = require("../utils"),
    _ = require("lodash");

class Tracer {
    constructor(enabled = false) {
        this.enabled = enabled;
        this.stack = [];
    }

    /**
     * Pushes one or more information objects onto the tracing stack.
     * @param objs
     */
    push(...objs) {
        if(this.enabled === true) {
            for(let i = 0; i < objs.length; i++) {
                const obj = objs[i];
                if(utils.isDefined(obj)) this.stack.push(obj);
            }
        }
    }

    get length() {
        return this.stack.length;
    }

    get(name) {
        return utils.getTraceItem(this, name);
    }

    getAll() {
        return this.stack;
    }

    toJSON() {
        return this.stack;
    }
}

/**
 * A Qwiery session.
 * Sure you can do without the dumb get/set list but
 * this fixes the format of the session and forces
 * things a bit. Otherwise the whole envelope easily
 * becomes a bucket full of stuff.
 * @class Session
 */
class Session {
    constructor(settings) {
        this._originalSettings = settings;
        this._exchangeId = settings.exchangeId || 0;
        this._appId = settings.appId || null;
        this._handled = settings.handled || false;
        this._historize = settings.historize || true;
        this._input = {
            Raw: utils.isUndefined(settings.question) ? null : settings.question,
            Timestamp: new Date()
        };
        this._key = {
            CorrelationId: utils.randomId(),
            UserId: settings.userId || null
        };
        this._ctx = {userId: this._key.UserId, appId: this._appId};
        if(utils.isDefined(settings.trace) && !_.isBoolean(settings.trace)) {
            throw new Error("The trace flag should be a boolean, not an actual trace.");
        }
        this._trace = new Tracer(settings.trace || false);
        this._output = {
            Answer: null,
            Timestamp: null
        };
        this._format = settings.format || "Text";
        this.Language = settings.language || "Qwiery";
        this.Sentiment = settings.sentiment || 0;
        this.Keywords = settings.keywords || [];
        this.Dates = settings.dates || [];
    }

    /**
     * Gets the ExchangeId property.
     */
    get ExchangeId() {
        return this._exchangeId;
    }

    /**
     * Sets the ExchangeId property.
     */
    set ExchangeId(value) {
        this._exchangeId = value;
    }

    /**
     * Gets the AppId property.
     */
    get AppId() {
        return this._appId;
    }

    /**
     * Sets the AppId property.
     */
    set AppId(value) {
        this._appId = value;
    }

    /**
     * Gets the Handled property.
     */
    get Handled() {
        return this._handled;
    }

    /**
     * Sets the Handled property.
     */
    set Handled(value) {
        this._handled = value;
    }

    /**
     * Gets the Historize property.
     */
    get Historize() {
        return this._historize;
    }

    /**
     * Sets the Historize property.
     */
    set Historize(value) {
        this._historize = value;
    }

    /**
     * Gets the Input property.
     */
    get Input() {
        return this._input;
    }

    /**
     * Sets the Input property.
     */
    set Input(value) {
        this._input = value;
    }

    /**
     * Gets the Key property.
     */
    get Key() {
        return this._key;
    }

    /**
     * Sets the Key property.
     */
    set Key(value) {
        this._key = value;
    }

    /**
     * Gets the Context property.
     */
    get Context() {
        return this._ctx;
    }

    /**
     * Sets the Context property.
     */
    set Context(value) {
        this._ctx = value;
    }

    /**
     * Gets the Output property.
     */
    get Output() {
        return this._output;
    }

    /**
     * Sets the Output property.
     */
    set Output(value) {
        this._output = value;
    }

    /**
     * Gets the Trace property.
     */
    get Trace() {
        return this._trace;
    }

    /**
     * Gets the format to be returned by Qwiery (if possible).
     * @return {string|*}
     * @constructor
     */
    get Format() {
        return this._format;
    }

    get OriginalSettings() {
        return this._originalSettings;
    }

    /**
     * Serializes this instance.
     *
     * @returns {any}
     *
     * @memberOf Session
     */
    toJSON() {
        return {
            Handled: this._handled,
            AppId: this._appId,
            Format: this._format,
            Context: {
                userId: this._ctx.UserId,
                appId: this._ctx.appId
            },
            Historize: this._historize,
            Input: {
                Raw: this._input.Raw,
                Timestamp: this._input.Timestamp
            },
            Output: {
                Answer: this._output.Answer,
                Timestamp: this._output.Timestamp
            },
            Key: {
                CorrelationId: this._key.CorrelationId,
                UserId: this._key.UserId
            },
            Trace: this._trace.stack,
            Language: this.Language || "english",
            Keywords: this.Keywords || [],
            Sentiment: this.Sentiment || 0,
            Dates: this.Dates || [],
            OriginalSettings: this._originalSettings || {}
        };
    }

    /**
     * Returns a clone of this session.
     * Note that identifiers are not altered, this clone is an identical clone.
     * @return {Session} An identical copy of this session.
     */
    clone() {
        let d = this.toJSON();
        d.question = this.Input.Raw;
        return new Session(d);
    }

    /**
     * Deserializes the given JSON to a Session.
     *
     * @static
     * @param {any} obj
     *
     * @memberOf Session
     */
    static fromJSON(obj) {
        const s = new Session("", {});
        s.Handled = obj.Handled;
        s.AppId = obj.AppId;
        s.Historize = obj.Historize;
        s.Input = obj.Input;
        s.Output = obj.Output;
        s.Key = obj.Key;
        s.Trace = obj.Trace;
    }
}

/**
 * @module Session
 */
module.exports = Session;