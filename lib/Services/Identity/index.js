const
    IdentityStorage = require("./IdentityStorage"),
    utils = require('../../utils'),
    ServiceBase = require('../../Framework/ServiceBase'),
    _ = require('lodash');
/**
 * Login and authentication management.
 *
 * @class Identity
 * @extends {ServiceBase}
 */
class Identity extends ServiceBase {
    constructor() {
        super("identity");
        this.users = [];
    }

    /**
     * Initializes this service.
     */
    init(instantiator) {
        super.init(instantiator);
        this.graph = this.services.graph;
        this.identity = new IdentityStorage(this.storage);
        return this.identity.init(instantiator);
    }

    /**
     *
     * @param email
     * @returns {*|Promise.<T>}
     */
    getByEmail(email) {
        return this.identity.getByEmail(email);
    }

    /**
     * Registers a local user with Email and password.
     * Note: by default Qwiery does not have local registration enabled since the info one gets from social
     * login is very valuable (real name, thumbnail etc.).
     *
     * @param email Email of the local account to register.
     * @param password The password for this local authentication.
     * @param existingUser An existing user based on e.g. Facebook which needs to be merged with this local registration.
     * @returns {Promise}
     */
    registerLocal(email, password, existingUser) {
        const that = this;
        const promise = new Promise(function(resolve, reject) {
            that.getByEmail(email).then(function(user) {
                if(utils.isDefined(user)) {
                    resolve({
                        error: "Email is already registered."
                    });
                } else {
                    if(utils.isDefined(existingUser)) {//merge
                        that.getByAny(existingUser).then(function(u) {
                            u.local = {
                                email: email,
                                password: password
                            };
                            that.upsertUser(u).then(
                                function(uu) {
                                    resolve(uu);
                                }
                            );
                        });
                    } else { // brand new user
                        const obj = {
                            local: {
                                email: email,
                                password: password
                            },
                            username: "not known",
                            apiKey: utils.randomId(),
                            id: utils.randomId(),
                            role: "Standard",
                            facebook: null,
                            google: null,
                            creationDate: new Date()
                        };
                        //var personalization = require('../Personalization/Personalization');
                        that.upsertUser(obj).then(
                            function(u) {
                                resolve(u);
                            }
                        );
                    }

                }
            });
        });
        return promise;
    }

    /**
     * Adds a user to the system.
     * @param user
     */
    upsertUser(user) {
        let that = this;
        if(utils.isUndefined(user.local) && utils.isUndefined(user.facebook) && utils.isUndefined(user.google) && utils.isUndefined(user.twitter)) {
            throw new Error("A user needs to have either a 'local', 'facebook', 'google' or 'twitter' property.");
        }
        return new Promise(function(resolve, reject) {

            if(user.id === undefined || user.id === null) {
                user.id = utils.randomId();
            }
            // remove and insert instead of updating changes
            const found = _.find(that.users, {id: user.id});
            if(utils.isDefined(found)) {
                _.remove(that.users, function(r) {
                    return r.id === user.id;
                })
            }

            // add the user to Graph if not present
            that.graph.userExists(user.id).then(function(exists) {
                if(!exists) {
                    that.graph.addUser(user.id, {});
                }
                user.creationDate = new Date();

                that.identity.upsertUser(user).then(function(u) {
                    resolve(user);
                });
            });
        });
    }

    /**
     * Tries to find the saved user from either the username, the Facebook id, the Twitter id
     * or the Google id.
     * This method is useful if you have an existing cookie and you need to find the correspond
     * server-saved blob.
     * @param user
     * @returns {Promise}
     */
    getByAny(user) {
        const that = this;
        return new Promise((resolve, reject) => {
            if(user.local !== null) {
                that.getByEmail(user.local.email).then(function(user) {
                    resolve(user);
                });
            } else if(_.isObject(user.facebook)) {
                that.getByFacebookId(user.facebook.id).then(function(user) {
                    resolve(user);
                });
            } else if(_.isObject(user.google)) {
                that.getByGoogleId(user.google.id).then(function(user) {
                    resolve(user);
                });
            } else if(_.isObject(user.twitter)) {
                that.getByTwitterId(user.twitter.id).then(function(user) {
                    resolve(user);
                });
            } else {
                resolve(null);
            }
        });
    }

    /**
     * Returns the user with the given Google id.
     *
     * @param id The Google id.
     * @returns {Promise}
     */
    getByGoogleId(id) {
        return this.identity.getByGoogleId(id);
    }

    /**
     * Returns the user with the given Twitter id.
     *
     * @param id The Twitter id.
     * @returns {Promise}
     */
    getByTwitterId(id) {
        return this.identity.getByTwitterId(id);
    }

    /**
     * Returns the user with the given Facebook id.
     *
     * @param id The Facebook id.
     * @returns {Promise}
     */
    getByFacebookId(id) {
        return this.identity.getByFacebookId(id);
    }

    getById(id) {
        return this.identity.getById(id);
    }

    /**
     * This changes the username for a local user.
     * Note that this is unrelated to the username set in the personalization
     * and used throughout Qwiery. This username is only the name of the login.
     *
     * Note also that the email has to be unique in local registration but not the username.
     * @param newName
     * @param ctx
     * @returns {*}
     */
    // changeUsername(newName, ctx) {
    //     var that = this;
    //     return new Promise(function(resolve, reject) {
    //         that.getById(ctx.userId).then(function(userTicket) {
    //             if(utils.isDefined(userTicket)) {
    //                 if(!userTicket.local) {
    //                     reject("The user has no local login.");
    //                 } else {
    //                     userTicket.local.username = newName;
    //                     that.upsertUser(userTicket).then(function(u) {
    //                         resolve(u);
    //                     });
    //                     ;
    //                 }
    //             }
    //         });
    //     });
    // }

    /**
     * Returns the security context for the given request.
     * @param req An http request.
     * @param shouldHaveRole
     * @returns {Promise<T>}
     */
    getUserContext(req, shouldHaveRole) {
        let apiKey = req.headers.apikey; // note: headers a lowercased even if you set them differently
        return this.getUserContextFromApiKey(apiKey, shouldHaveRole);
    }

    getUserContextFromApiKey(apiKey, shouldHaveRole) {
        const that = this;
        return new Promise(function(resolve, reject) {

            if(utils.isDefined(apiKey) && apiKey !== "null") {

                that.identity.getByApiKey(apiKey).then(function(foundKey) {

                    if(utils.isDefined(foundKey)) {
                        if(utils.isDefined(shouldHaveRole)) {
                            if(foundKey.role === shouldHaveRole) {
                                resolve({
                                    userId: foundKey.id,
                                    role: foundKey.role
                                });
                            } else {
                                reject("User is authenticated but has not the required '" + shouldHaveRole + "' role.");
                            }
                        } else {
                            resolve({
                                userId: foundKey.id,
                                role: foundKey.role
                            });
                        }
                    }
                    else {
                        reject({"Message": "A user with the specified API key could not be found."});
                    }

                });


            }
            else {
                reject({"Message": "The ApiKey is empty. Login and use the supplied API key to make requests."});
            }


        });
    }

    areSame(clientTicket, serverTicket) {
        if(clientTicket.id === "Anonymous") {
            return true;
        }
        let same = true;
        if(serverTicket.local || clientTicket.local) {
            same &= (serverTicket.local === clientTicket.local);
        }
        if(serverTicket.facebook || clientTicket.facebook) {
            same &= (serverTicket.facebook === clientTicket.facebook);
        }
        return same;
    }

    /**
     * Returns whether the user has admin role.
     * @param ctx
     * @returns {Promise<T>}
     */
    isAdmin(ctx) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.identity.getById(ctx.userId).then(function(user) {
                resolve(utils.isDefined(user) && (user.role === "Admin"));
            });
        });

    }

    /**
     * Fetches all users.
     * @param ctx
     * @returns {Promise<T>}
     */
    // todo: paging and such
    getAllUsers(ctx) {
        function getName(monObj) {
            const u = monObj.toObject();
            if(u.facebook) return u.facebook.name;
            if(u.google) return u.google.displayName;
            if(u.twitter) return u.twitter.name;
            if(u.local) return (u.local.email || u.local.id);
            return null;
        }

        const that = this;
        return new Promise(function(resolve, reject) {
            that.identity.getAllUsers().then(function(all) {
                let mapped = _.map(all, function(u) {
                    let name = getName(u);
                    if(utils.isUndefined(name)) {
                        name = "Fake or test user";
                    }
                    return {
                        UserId: u.id,
                        CreationDate: u.creationDate,
                        Name: name,
                        Id: u.id
                    };
                });
                resolve(mapped);
            });
        });

    }

    deleteUser(id, ctx) {
        let user = this.getById(ctx.userId);
        if(utils.isUndefined(user)) {
            throw "The user does not exist";
        }
        if(user.role === "Admin" || user.id === "Anonymous") {
            throw "This user cannot be deleted and is part of the system."
        }
        _.remove(this.users, function(u) {
            return u.id === id;
        });
        return true;
    }

    exists(id) {
        return this.identity.exists(id);
    }
}

module.exports = Identity;
