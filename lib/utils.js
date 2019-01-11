const
    _ = require('lodash'),
    request = require("request"),
    constants = require("./constants"),
    texturize = require("./texturize"),
    fs = require("fs-extra"),
    path = require("path"),
    chrono = require('chrono-node');
/**
 * Shared static utilities.
 * @module Utils
 */
module.exports = {

    /**
     * Cleans the given string;
     * - remove irrelevant or forbidden characters
     * - replace multiple spaces with one
     * @param input {string} Any string.
     * @return {XML|string}
     */
    normalizeInput(input) {
        if(this.isUndefined(input)) {
            throw new Error("Cannot cleanup nil input.");
        }
        return input
            .trim()
            .replace(/\s+/g, " ") // double spaces have little meaning
            .replace(constants.BLINDREX, "") // remove punctuation and whatnot
            .replace(/what\s?'s\s?/gi, "what is ") // the oracle uses full forms
            .replace(/^tell me\s/gi, "what is ") // what is is used in the oracle
            .replace(/I\s?'m\s?/gi, "I am ") // the oracle uses full forms
            ;
    },

    /**
     * Generates a random identifier with default length 10;
     * @param length {Number} The length of the identifier to be generated.
     * @returns {string} The id in string format.
     */
    randomId: function(length) {
        if(length === undefined) {
            length = 10;
        }
        if(length < 1) {
            throw new Error("Cannot generate a randomId with length less than one.");
        }
        // old version return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
        let result = "";
        const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for(let i = length; i > 0; --i) {
            result += chars.charAt(Math.round(Math.random() * (chars.length - 1)));
        }
        return result;
    },

    /***
     * This will perform a DFT to replace the Choice keys with
     * concrete choices.
     * @param obj {*} Can be an array, literal...
     * @returns {*}
     */
    makeChoices: function(obj) {
        const that = this;
        _.forOwn(obj, function(value, key) {
            if(key === "Choice") {
                const choicer = value;
                if(choicer) {
                    if(!_.isArray(choicer)) {
                        throw "The QTL is not valid. The Choice should be an Array."
                    }
                    // depth-first traversal
                    for(let k = 0; k < choicer.length; k++) {
                        const item = choicer[k];
                        if(_.isArray(item)) {
                            throw "The QTL is not valid. Unexpected array inside a Choice array.";
                        }
                        if(_.isObject(item)) {
                            choicer[k] = utils.makeChoices(item);
                        }
                    }
                    // this replace the obj with something concrete
                    obj = _.sample(choicer);

                } else {
                    throw "The QTL is not valid. The value of the Choice is not defined.";
                }
            }
            else if(_.isObject(value)) {
                obj[key] = that.makeChoices(value);
            }
            else if(_.isArray(value)) {
                for(let k = 0; k < value.length; k++) {
                    const item = value[k];
                    value[k] = utils.makeChoices(item);
                }
            }
        });

        return obj;
    },

    /**
     * Removes the password of a user-ticket.
     * @param user A user ticket to strip.
     * @returns {Object}
     */
    stripPassword: function(user) {
        return {
            apiKey: user.apiKey,
            local: user.local ? {email: user.local.email} : null, // don't send the password
            facebook: user.facebook,
            google: user.google,
            twitter: user.twitter,
            id: user.id,
            username: user.username,
            error: user.error,
            role: user.role
        }

    },
    /***
     * Returns the property in the json from specified path.
     * @param d {object} A JSON object.
     * @param path {string} Path in the form "a.b.c".
     * @example
     * // using this object
     * {a:[1,2], b:{c:5}}
     * // you can access things via: a.1 or b.c
     *
     */
    getJsonPath: function(d, path) {
        if(path === "." || path === "/") {
            return d;
        }
        let res;
        if(this.isDefined(d)) {
            if(this.isDefined(path)) {
                if(path.indexOf('.') > 0) {
                    const split = path.split('.');
                    while(split.length > 0) {
                        d = d[split.shift()];
                    }
                    res = d;
                } else {
                    res = d[path]
                }
            } else {
                res = d;
            }
        } else {
            res = "[?]";
        }
        return res;
    },

    /***
     * Replaces in object d the property path with obj.
     * If the path does not exist the value will not be created.
     * @param rootObject {Object} The object in which to replace at the given path.
     * @param path {String} Something like 'a.b.c'.
     * @param substitute {Object} The object which replaces the value.
     */
    deepReplace: function(rootObject, substitute, path) {
        if(path === undefined) {
            path = "/";
        }
        if(path === "." || path === "/") {
            rootObject = substitute;
            return substitute;
        }
        if(this.isDefined(rootObject)) {
            if(this.isDefined(path)) {
                let walker = rootObject;
                if(path.indexOf('.') > 0) {
                    const split = path.split('.');
                    while(split.length > 1) {
                        walker = walker[split.shift()];
                    }
                    const lastProperty = split.shift();
                    if(walker.hasOwnProperty(lastProperty)) { // if path exists
                        walker[lastProperty] = substitute;
                    }

                } else {
                    if(rootObject.hasOwnProperty(path)) {
                        rootObject[path] = substitute;
                    }
                }
            } else {
                rootObject = substitute;
            }
        } else {
            throw new Error("No object given to replace parts of.");
        }
        return rootObject;
    },

    /**
     * Returns `true` if the given string is undefined, null or zero length.
     * @param s {String} Any string.
     */
    isNullOrEmpty: function(s) {
        return s === undefined || s === null || s.trim().length === 0;
    },

    /**
     * Returns true if the given object is not undefined and not null.
     * @param obj Any object.
     */
    isDefined: function(obj) {
        return obj !== undefined && obj !== null;
    },

    /**
     * Returns true if the given object is undefined or null.
     * @param obj Any object.
     */
    isUndefined: function(obj) {
        return !this.isDefined(obj);
    },

    /**
     * Returns a pod array, one pod for each given string.
     * @param messages {String} One or more messages.
     * @return {Array<String>} A pod array.
     */
    messagePods(...messages) {
        const r = [];
        for(let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if(!_.isString(msg)) {
                throw new Error("Cannot make a message pod out of an object.");
            }
            r.push({
                "Content": msg,
                "DataType": constants.podType.Text
            })
        }
        return r;
    },

    /**
     * Returns a pod array with a single list-pod.
     * @param array {Array} The items to be packaged as a list pod.
     * @param listType {String} The type of the items.
     * @param [head] {String} The header to be displayed when rendering the pod.
     * @return {Array<Pod>} A pod array.
     */
    listPod(array, listType = null, head = null) {
        let r = {
            "DataType": constants.podType.List,
            "ListType": listType,
            "List": array
        };
        if(head) {
            r.Head = head;
        }
        return [r];
    },

    /**
     * Returns details about the given command/parameter structure. If any.
     * Note that parameter names are lowercased.
     * @param question {String} An input string.
     * @returns {*}
     */
    getCommand: function(question) {
        const result = {
            Commands: null,
            Parameters: null,
            FirstParameter: null,
            FirstCommand: null
        };
        if(this.isUndefined(question)) {
            return result;
        }
        function replaceProtocols(q) {
            // replace temporarily the '://' things from URLs
            return q.trim().replace("http://", "__http__")
                .replace("https://", "__https__")
                .replace("file://", "__file__");
        }

        function rereplaceProtocols(q) {
            return q.trim().replace("__http__", "http://")
                .replace("__https__", "https://")
                .replace("__file__", "file://")
        }


        if(question.indexOf(">") <= 0) {
            return result;
        }
        question = replaceProtocols(question);

        let parts = _.map(question.split(/>/), function(p) {
            return p.trim();
        });
        let parms = parts.splice(-1);
        parts = _.map(parts, function(p) {
            return p.toLowerCase();
        });

        let firstParm;
        let hasNamedArguments = false;
        if(parms.length === 0) {
            parms = [];
            firstParm = null;
        } else {
            let coms = parms[0].split(',');
            parms = [];
            for(let i = 0; i < coms.length; i++) {
                const com = coms[i];
                const nv = com.split(":");
                if(nv.length === 1) {
                    if(i === 0) {
                        parms.push({
                            name: null,
                            value: rereplaceProtocols(nv[0])
                        });

                    } else {
                        parms[i - 1].value += ", " + rereplaceProtocols(nv[0])
                    }
                } else {
                    hasNamedArguments = true;
                    if(nv[1].trim().length === 0) {
                        continue;
                    }
                    parms.push({
                        name: nv[0].trim().toLowerCase(),
                        value: rereplaceProtocols(nv[1])
                    })
                }
            }

            firstParm = parms[0];
            if(this.isUndefined(firstParm) || firstParm.value.length === 0) {
                firstParm = null;
                parms = [];
            }
        }

        return {
            /**
             * Returns the array of commands.
             */
            Commands: parts,
            /**
             * Returns the parameters.
             */
            Parameters: parms,
            /**
             * Returns the first parameter or null if none.
             */
            FirstParameter: firstParm,
            /**
             * Returns whether the parameters are specified with a name.
             */
            HasNamedArguments: hasNamedArguments,
            /**
             * The first command after the initial instruction.
             * That is, the second item in the commands array.
             */
            FirstCommand: parts[1],

            hasParameter(name){
                return utils.isDefined(_.find(parms, {name: name}));
            },
            get(name){
                if(!_.isNil(_.find(parms, {name: name}))) {
                    return _.find(parms, {name: name}).value;
                } else {
                    return undefined;
                }
            },
            getParameterObject(){
                let obj = {};
                _.forEach(parms, function(x) {
                    obj[x.name] = x.value
                });
                return obj;
            }

        }
    },

    /***
     * Simplistic check whether the given input is a URL.
     * @param input
     * @returns {boolean}
     */
    isUrl: function(input) {
        return _.isString(input) && (input.trim().indexOf("http://") === 0 || input.trim().indexOf("https://") === 0);
    },

    /**
     * Fetches the data at the given HTTP-address.
     * @param definition {Object} The specs.
     * @param definition.url {String} The address.
     * @param [definition.method=GET] {String} The HTTP method.
     * @return {Promise} Returns an object with the status, headers and body.
     */
    getWebData(definition){
        if(_.isString(definition)) {
            definition = {
                url: definition
            }
        }
        const request = require('request');
        const options = {
            method: definition.Method || 'GET',
            url: definition.URL || definition.url,
            timeout: 5000
        };
        return new Promise(function(resolve, reject) {
            function callback(error, response, body) {
                if(error) {
                    reject(error);
                } else {
                    let a = {
                        status: response.statusCode,
                        headers: response.headers,
                        body: body
                    };
                    resolve(a);
                }
            }

            request(options, callback);
        })
    },

    /**
     * Fetches data from a REST service.
     * @param definition {Object} The definition of the REST service request.
     * @param definition.url {String} - the url of the service
     * @param [definition.data] {Object} - the data to send along with the request
     * @param [definition.path] {String} - the data to extract via the given path
     * @return {Promise} The data returned or the data in the path.
     */
    getServiceData(definition) {
        const request = require('request');
        const options = {
            method: definition.Method || 'GET',
            url: definition.URL || definition.url,
            dataType: "jsonp",
            headers: {
                "Content-type": "application/json",
                "Accept": "application/json"
            },
            timeout: 5000
        };
        let sdata = definition.Data || definition.data;
        if(sdata) {
            options.data = JSON.stringify(sdata);
        }
        return new Promise(function(resolve, reject) {
            function callback(error, response, body) {
                if(!error && response.statusCode === 200) {
                    let json = JSON.parse(body);
                    let mapped = json;
                    let spath = definition.Path || definition.path;
                    if(spath) {
                        try {
                            mapped = utils.getJsonPath(json, spath);
                        } catch(e) {
                            mapped = "[not found in path]";
                            console.warn(e.message);
                            console.log(json);
                        }
                    }
                    resolve(mapped);
                } else {
                    reject(error);
                }
            }

            request(options, callback);
        })
    },

    /***
     * Returns the Title found in a URL.
     * If a the given string is not a URL, the string itself is returned.
     * @param obj {string} A standard string or URL.
     */
    getSiteTitle: function(obj) {
        if(this.isUndefined(obj)) {
            return Promise.resolve(null);
        }

        else if(this.isUrl(obj)) {
            return new Promise(function(resolve, reject) {
                const opts = {
                    url: obj,
                    timeout: 10000
                };
                request(opts, function(err, res, body) {
                    if(err) {
                        reject(err);
                    }
                    else {
                        const extractor = require('unfluff');
                        data = extractor(body);

                        const props = ["title", "description", "softTitle"];
                        // picking whatever contains the most content
                        let best = "";
                        _.forEach(props, function(n) {
                            if(data[n] && (data[n].length > best.length)) {
                                best = data[n];
                            }
                        });
                        if(best.length === 0) {
                            resolve(null);

                        } else {
                            resolve(best);
                        }
                    }
                });
            });


        }

        else {
            return Promise.resolve(obj);
        }
    },

    /***
     * Returns the content found in a URL.
     * @param obj {string} A standard string or URL.
     */
    getSiteContent: function(obj) {
        if(this.isUndefined(obj)) {
            return Promise.resolve(null);
        }

        else if(this.isUrl(obj)) {
            return new Promise(function(resolve, reject) {
                const opts = {
                    url: obj,
                    timeout: 10000
                };
                request(opts, function(err, res, body) {
                    if(err) {
                        reject(err);
                    }
                    else {
                        const extractor = require('unfluff');
                        data = extractor(body);

                        const props = ["title", "description", "softTitle", "text", "body"];
                        // picking whatever contains the most content
                        let best = "";
                        _.forEach(props, function(n) {
                            if(data[n] && (data[n].length > best.length)) {
                                best = data[n];
                            }
                        });
                        if(best.length === 0) {
                            resolve(null);

                        } else {
                            resolve(best);
                        }
                    }
                });
            });


        }

        else {
            return Promise.resolve(obj);
        }
    },

    /**
     * Extracts a string from the given session
     * suitable for a console output.
     * @param session
     * @returns {string}
     */
    extractQuestionAnswer(session) {
        const answer = texturize.extractSimple(session);
        const question = session.Input.Raw;
        return `\n-------------------------------------\nQuestion> ${question}\nAnswer> ${answer}`
    },

    /**
     * Classic test of whether the given input contains
     * only letters and numbers.
     * @param name {String} An arbitrary string.
     * @return {boolean} Retruns `true` if alphanumeric, otherwise `false`.
     */
    isAlphaNumeric: function(name) {
        const letters = /^[0-9a-zA-Z]+$/;
        return !!letters.test(name);
    },

    /**
     * Returns the number in the given string (or number).
     * @param input {String|Number} A number in a string or just an actual number.
     * @return {Number} The number or null if no number could be reolved.
     */
    parseNumber: function(input) {
        if(!_.isNil(input)) {
            let found = parseInt(input);
            if(!_.isNaN(found)) {
                return found;
            }
        }
        return null;
    },

    /**
     * Interface implementation check.
     *
     * @param {any} interfaceType A class with the methods to be implemented by the other type.
     * @param {any} otherType A class to be checked.
     */
    checkImplementation(interfaceType, otherType) {
        const names = Object.getOwnPropertyNames(interfaceType.prototype);
        const excludes = ["constructor", "init", "reset"];
        for(let i = 0; i < names.length; i++) {
            let name = names[i];
            if(_.includes(excludes, name)) {
                continue;
            }
            if(this.isDefined(otherType.prototype)) {
                if(!this.isDefined(otherType.prototype[name])) {
                    throw new Error(`The type '${otherType.constructor.name}' does not implement method '${name}'.`);
                }
            } else {
                if(!this.isDefined(otherType[name])) {
                    throw new Error(`The type '${otherType.constructor.name}' does not implement method '${name}'.`);
                }
            }
        }
    },

    /**
     * Executes the given method on the given object.
     * @param obj {Object} Any object.
     * @param methodName {String} The name of a method on the object.
     * @param context {Object} The binding context (aka closure).
     * @param parms {Array} One or more parameters the method takes.
     * @return {*}
     */
    call(obj, methodName, context, ...parms){
        if(obj && obj[methodName]) {
            return obj[methodName].call(context, ...parms);
        }
        return null;
    },

    /**
     * Converts various boolean-like string expression to actual boolean values.
     * This conversion is mostly needed when a workflow transition is specified in
     * short format , e.g. ["When->Where, false", "When->What, true"].
     * @param value {String|Number} A string or numeric representation of a Boolean.
     * @return {Boolean|String} The actual boolean or the original string if conversion failed.
     */
    tryConvertToBoolean(value){
        switch(value.toString().trim().toLowerCase()) {
            case "true":
            case "1":
            case "yes":
            case "ok":
                value = true;
                break;
            case "false":
            case "0":
            case "no":
            case "nok":
                value = false;
                break;
        }
        return value
    },

    /**
     * Returns the pod type or types from the Answer in the given session.
     * If there is only one pod a string is returned, if multiple the array of
     * pod types are returned.
     * @param session {Session} A Qwiery session.
     * @return {String|Array<String>} One or more pod types.
     */
    getPodType(session){
        if(this.isUndefined(session.Output.Answer)) {
            return null;
        } else if(_.isArray(session.Output.Answer)) {
            switch(session.Output.Answer.length) {
                case 0:
                    return null;
                case 1:
                    return session.Output.Answer[0].DataType || null;
                default:
                    return session.Output.Answer.map(function(x) {
                        return x.DataType;
                    })
            }
        } else {
            return null;
        }
    },

    /**
     * Picks up the trace item(s) with the given name.
     * Note that by default the trace is not switched on.
     * You need to set the trace flag to true
     *      qwiery.ask(..., {trace: true})
     * @param obj {Session|Array} Either a Session or the Trace of a session instance.
     * @param name {String} The name of the property to return.
     * @return {String} The name of the interpreter or null if not found.
     */
    getTraceItem(obj, name){
        let trace = null;
        if(obj.Trace) {
            trace = obj.Trace;
        } else if(_.isArray(obj)) {
            trace = obj;
        } else {
            throw new Error("Cannot find the item from the given object. Are you sure it's a Session or a Trace?");
        }
        const found = _.filter(trace, function(x) {
            return _.includes(_.keys(x), name);
        });
        if(this.isDefined(found)) {
            if(found.length === 1) {
                return found[0][name];
            } else {
                if(found.length === 0) {
                    return null;
                }
                return found.map(function(x) {
                    return x[name]
                });
            }
        }
        return null;
    },

    /**
     * Picks up the `HandledBy` trace item and returns
     * the name of the interpreter which handled the question.
     * Note that by default the trace is not switched on.
     * You need to set the trace flag to true
     *      qwiery.ask(..., {trace: true})
     * @param obj {Session|Array} Either a Session or the Trace of a session instance.
     * @return {String} The name of the interpreter or null if not found.
     */
    getHandler(obj){
        let trace = null;
        if(obj.Trace) {
            trace = obj.Trace;
        } else if(_.isArray(obj)) {
            trace = obj;
        } else {
            throw new Error("Cannot find the handler from the given object. Are you sure it's a Session or a Trace?");
        }
        let handledBy = null;
        trace.forEach(function(x) {
            if(x.HandledBy) {
                handledBy = x.HandledBy;
            }
        });
        return handledBy;
    },

    /**
     * Gets the array of directory names in the given path.
     * @param srcpath {string} The path to scan.
     */
    getDirectories(srcpath) {
        if(!fs.existsSync(srcpath)) {
            throw new Error("The specified path does not exist.");
        }
        return fs.readdirSync(srcpath)
            .filter(file => fs.statSync(path.join(srcpath, file)).isDirectory())
    },


    /**
     * Gets the array of file names in the given path.
     * @param srcpath {string} The path to scan.
     */
    getFiles(srcpath) {
        if(!fs.existsSync(srcpath)) {
            throw new Error("The specified path does not exist.");
        }
        if(!fs.statSync(srcpath).isDirectory()) {
            throw new Error("The specified path is not a directory.");
        }
        return fs.readdirSync(srcpath)
            .filter(file => fs.statSync(path.join(srcpath, file)).isFile())
    },

    /**
     * Generic validation for id's and names in Qwiery.
     * @param nameid {String} Something to be used as a name or id in the context of Qwiery.
     * @return {boolean} `true` if acceptable as a Qwiery name or id.
     */
    isValidName(nameid){
        if(_.isNil(nameid)) {
            return false;
        }
        return /^[a-zA-Z0-9_-]*$/gi.test(nameid.trim());
    }

};
