const
    datetimeParser = require("../Datetime"),
    utils = require("../../utils"),
    _ = require("lodash")
;
/**
 * Base class for entities.
 * @class Entity
 */
class Entity {

    constructor(options) {
        this.Id = options.Id || utils.randomId();
        this.Title = options.Title || null;
        this.Description = options.Description || null;
        this.DataType = "Entity";
    }

    /**
     * Serializes this instance.
     *
     * @returns {any}
     *
     * @memberOf Entity
     */
    toJSON() {
        let {Id, Title, Description, DataType} = this;
        return {Id, Title, Description, DataType};
    }
}

/**
 * An agenda or appointment entity.
 * @class Appointment
 */
class Appointment extends Entity {

    constructor(settings) {
        super(settings);
        this.DataType = "Appointment";
        this.From = (_.isString(settings.From)) ? Appointment.tryGetTimestamp(settings.From) : settings.From;
        this.To = (_.isString(settings.To)) ? Appointment.tryGetTimestamp(settings.To) : settings.To;
        this.AllDay = settings.AllDay || false
    }

    /**
     *  Attempts to turn the given input into a single datetime event.
     * @param input
     * @return {*|number}
     */
    static tryGetTimestamp(input) {
        const DatetimeParser = require("../Datetime");
        const found = DatetimeParser.parse(input);
        if(found && found.length>0) {
            return found[0].date.getTime(); // POSIX format
        }
        return null;
    }

    /**
     * Attempts to turn the given input into an appointment.
     * @param input {string} Any string with presumably some time and info.
     */
    static tryMakingSense(input) {
        const e = datetimeParser.parse(input);
        if(utils.isUndefined(e.startDate) && utils.isUndefined(e.endDate)) {
            return null;
        }
        return new Appointment({
            From: e.startDate,
            To: e.endDate,
            Title: e.eventTitle,
            AllDay: false
        });
    }

    /**
     * Serializes this instance.
     *
     * @returns {any}
     *
     * @memberOf Appointment
     */
    toJSON() {
        let json = super.toJSON();
        json.From = this.From;
        json.To = this.To;
        json.AllDay = this.AllDay;
        json.DataType = "Appointment";
        return json;
    }
}

/**
 * A task entity.
 * @class Task
 */
class Task extends Entity {

    constructor(settings) {
        super(settings);
        this.DataType = "Task";
        this.Priority = settings.Priority;
    }

    toJSON() {
        let json = super.toJSON();
        json.Priority = this.Priority;
        return json;
    }
}

/**
 * A thought or idea entity.
 * @class Thought
 */
class Thought extends Entity {

    constructor(settings) {
        super(settings);
        this.DataType = "Thought";
    }
}

/**
 * An address entity.
 * @class Address
 */
class Address extends Entity {

    constructor(settings) {
        super(settings);
        this.DataType = "Address";
        this.AddressLine1 = settings.addressline1 || settings.AddressLine1 || settings.street || settings.addressline;
        this.AddressLine2 = settings.addressline2 || settings.AddressLine2;
        this.City = settings.city || settings.City;
        this.Zip = settings.zip || settings.Zip;
        this.Country = settings.country || settings.Country;
    }

    toJSON() {
        let json = super.toJSON();
        json.City = this.City;
        json.Country = this.Country;
        json.Zip = this.Zip;
        json.AddressLine1 = this.AddressLine1;
        json.AddressLine2 = this.AddressLine2;
        return json;
    }
}

/**
 * A person entity.
 * @class Person
 */
class Person extends Entity {

    constructor(settings) {
        super(settings);
        this.DataType = "Person";
        this.FirstName = settings.firstname || settings.FirstName;
        this.LastName = settings.lastname || settings.LastName;
    }

    toJSON() {
        let json = super.toJSON();
        json.FirstName = this.FirstName;
        json.LastName = this.LastName;
        return json;
    }
}


const knownEntityTypes = [
    {
        name: "Appointment",
        type: Appointment
    },
    {
        name: "Task",
        type: Task
    },
    {
        name: "Thought",
        type: Thought
    },
    {
        name: "Idea",
        type: Thought
    },
    {
        name: "Address",
        type: Address
    },
    {
        name: "Person",
        type: Person
    }
];

/**
 * Entities factory and utility class.
 * @class Entities
 */
class Entities {

    /**
     * Attempts to return a typed version of the given entity.
     * @param obj {any} A plain object.
     * @return {*|Entity} Either an Entity or the object itself if it could not be parsed to a known type.
     */
    static parse(obj) {
        if(utils.isUndefined(obj)) {
            return null;
        }
        if(!_.isPlainObject(obj)) {
            throw new Error("Can only parse plain objects to entities.");
        }
        if(utils.isDefined(obj.DataType)) {
            const found = _.find(knownEntityTypes, function(x) {
                return x.name.toLowerCase() === obj.DataType.toLowerCase();
            });
            if(found) {
                return new found.type(obj);
            }
        }
        return obj;
    }

    /**
     * Gets the Appointment class.
     * @return {Appointment}
     * @constructor
     */
    static get Appointment() {
        return Appointment;
    }

    /**
     * Gets the Person class.
     * @return {Person}
     * @constructor
     */
    static get Person() {
        return Person;
    }

    /**
     * Gets the Address class.
     * @return {Address}
     * @constructor
     */
    static get Address() {
        return Address;
    }

    /**
     * Gets the Thought class.
     * @return {Thought}
     * @constructor
     */
    static get Thought() {
        return Thought;
    }

    /**
     * Gets the Thought class.
     * @return {Thought}
     * @constructor
     */
    static get Idea() {
        return Thought;
    }
}

module.exports = Entities;