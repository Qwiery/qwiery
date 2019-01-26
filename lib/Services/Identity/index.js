const
    IdentityStorage = require('./IdentityStorage'),
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
        super('identity');
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
        const promise = new Promise(function (resolve, reject) {
            that.getByEmail(email).then(function (user) {
                if (utils.isDefined(user)) {
                    resolve({
                        error: 'Email is already registered.'
                    });
                } else {
                    if (utils.isDefined(existingUser)) {//merge
                        that.getByAny(existingUser).then(function (u) {
                            u.local = {
                                email: email,
                                password: password
                            };
                            that.upsertUser(u).then(
                                function (uu) {
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
                            username: 'not known',
                            apiKey: utils.randomId(),
                            id: utils.randomId(),
                            role: 'Standard',
                            facebook: null,
                            google: null,
                            creationDate: new Date()
                        };
                        //var personalization = require('../Personalization/Personalization');
                        that.upsertUser(obj).then(
                            function (u) {
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
    async upsertUser(user) {
        let that = this;
        if (utils.isUndefined(user.local) && utils.isUndefined(user.facebook) && utils.isUndefined(user.google) && utils.isUndefined(user.twitter)) {
            throw new Error('A user needs to have either a \'local\', \'facebook\', \'google\' or \'twitter\' property.');
        }
        if (user.id === undefined || user.id === null) {
            user.id = utils.randomId();
        }
        // remove and insert instead of updating changes
        const found = _.find(that.users, {id: user.id});
        if (utils.isDefined(found)) {
            _.remove(that.users, function (r) {
                return r.id === user.id;
            })
        }

        // add the user to Graph if not present
        const exists = await that.graph.userExists(user.id);
        if (!exists) {
            await that.graph.addUser(user.id, {});
        }
        user.creationDate = new Date();

        await that.identity.upsertUser(user);
        return user;
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
        if (user.local !== null) {
            return that.getByEmail(user.local.email);
        } else if (_.isObject(user.facebook)) {
            return that.getByFacebookId(user.facebook.id);
        } else if (_.isObject(user.google)) {
            return that.getByGoogleId(user.google.id);
        } else if (_.isObject(user.twitter)) {
            return that.getByTwitterId(user.twitter.id);
        } else {
            return null;
        }
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

    async getUserContextFromApiKey(apiKey, shouldHaveRole) {
        const that = this;
        if (utils.isDefined(apiKey) && apiKey !== 'null') {

            const foundKey = await that.identity.getByApiKey(apiKey);
            if (utils.isDefined(foundKey)) {
                if (utils.isDefined(shouldHaveRole)) {
                    if (foundKey.role === shouldHaveRole) {
                        return ({
                            userId: foundKey.id,
                            role: foundKey.role
                        });
                    } else {
                        throw new Error('User is authenticated but has not the required \'' + shouldHaveRole + '\' role.');
                    }
                } else {
                    return ({
                        userId: foundKey.id,
                        role: foundKey.role
                    });
                }
            } else {
                throw new Error('A user with the specified API key could not be found.');
            }


        } else {
            throw new Error('The ApiKey is empty. Login and use the supplied API key to make requests.');
        }
    }

    areSame(clientTicket, serverTicket) {
        if (clientTicket.id === 'Anonymous') {
            return true;
        }
        let same = true;
        if (serverTicket.local || clientTicket.local) {
            same &= _.isEqual(serverTicket, clientTicket);
        }
        if (serverTicket.facebook || clientTicket.facebook) {
            same &= _.isEqual(serverTicket, clientTicket);
        }
        return same;
    }

    /**
     * Returns whether the user has admin role.
     * @param ctx
     * @returns {Promise<T>}
     */
    async isAdmin(ctx) {
        const that = this;
        const user = await that.identity.getById(ctx.userId);
        return (utils.isDefined(user) && (user.role === 'Admin'));

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
            if (u.facebook) return u.facebook.name;
            if (u.google) return u.google.displayName;
            if (u.twitter) return u.twitter.name;
            if (u.local) return (u.local.email || u.local.id);
            return null;
        }

        const that = this;
        return new Promise(function (resolve, reject) {
            that.identity.getAllUsers().then(function (all) {
                let mapped = _.map(all, function (u) {
                    let name = getName(u);
                    if (utils.isUndefined(name)) {
                        name = 'Fake or test user';
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
        if (utils.isUndefined(user)) {
            throw 'The user does not exist';
        }
        if (user.role === 'Admin' || user.id === 'Anonymous') {
            throw 'This user cannot be deleted and is part of the system.'
        }
        _.remove(this.users, function (u) {
            return u.id === id;
        });
        return true;
    }

    exists(id) {
        return this.identity.exists(id);
    }

    /**
     * Adds a user via a given FB blob.
     * @param clientTicket The auth blob, if any. If none, this is a new user. If present it means additional auth via FB.
     * @param facebookObject The stuff returned from the FB authentication.
     * @returns {Promise<*|{twitter, role, apiKey, facebook, google, id, error, local, username}>}
     */
    async connectFacebook(clientTicket, facebookObject) {
        const serverTicket = await this.getByFacebookId(facebookObject.id);
        const personalization = this.services.personalization;
        if (!_.isNil(serverTicket)) {
            if (!_.isNil(clientTicket)) { // if there is a client ticket but there is no facebook ticket
                if (_.isEqual(clientTicket.facebook.id, serverTicket.facebook.id)) {
                    console.log('User connects while he was already connected!?');
                    return (utils.stripPassword(serverTicket));
                } else {
                    console.log('Tickets are not in sync. Or multiple tickets for the same user');
                    throw new Error('There is already a registration for this Facebook user. Probably you have previously connected with Facebook without being logged in with the account you are using now. Log out and connect with Facebook again.');
                }
            } else { // no client ticket
                return (utils.stripPassword(serverTicket)); //reconnect
            }
        } else {
            if (!_.isNil(clientTicket)) { // merge accounts
                if (clientTicket.facebook) { // hack or sync
                    console.log('How comes he already has Facebook section?');
                    if (facebookObject.id !== clientTicket.facebook.id) {
                        throw new Error('You already have a Facebook account connected and now connecting with another Facebook account!?');
                    } else {
                        console.log('Sync issues or hack');
                        throw new Error('How comes you have these credentials while it does not exist on the server?');
                    }
                } else { // merge
                    const user = await this.getByAny(clientTicket);
                    if (_.isNil(user)) {
                        throw new Error('Delete server-side user or malicious impersonation.')
                    }
                    user.facebook = facebookObject;
                    // if Username not set yet we'll use the Facebook info to do so
                    if (!_.isNil(personalization)) {
                        const username = await personalization.getPersonalization('Username', {userId: user.Id});
                        if (_.isNil(username) && !_.isNil(personalization)) {
                            await personalization.addPersonalization('Username', facebookObject.first_name, {userId: user.Id});
                        }
                    }
                    await this.upsertUser(user);
                    return (utils.stripPassword(user));
                }
            } else { // might mean the user creates multiple account, we can't know
                const n = {
                    apiKey: utils.randomId(),
                    local: null,
                    facebook: facebookObject,
                    google: null,
                    error: null,
                    creationDate: new Date()
                };

                const newUser = await this.upsertUser(n);
                // if Username not set yet we'll use the Facebook info to do so
                if (!_.isNil(personalization)) {
                    const username = await personalization.getPersonalization('Username', {userId: newUser.id});
                    if (utils.isUndefined(username)) {
                        await personalization.addPersonalization('Username', facebookObject.first_name, {userId: newUser.id});
                    }
                }
                return (utils.stripPassword(newUser));
            }
        }
    }
}

module.exports = Identity;
