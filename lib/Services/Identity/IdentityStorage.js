const utils = require('../../utils'),
    _ = require('lodash');
const StorageDomainBase = require("../../Framework/StorageDomainBase");

/**
 * Manages the storage of identify data.
 *
 * @class IdentityStorage
 * @extends {StorageDomainBase}
 */
class IdentityStorage extends StorageDomainBase {

    init(instantiator) {
        super.init(instantiator);
        let actions = [];
        actions.push(this.createCollections(
            {
                collectionName: "Identity",
                schema: {
                    apiKey: String,
                    id: String,
                    creationDate: Date,
                    local: {
                        email: String,
                        password: String
                    },
                    role: String,
                    google: {
                        "kind": String,
                        "etag": String,
                        "objectType": String,
                        "id": String,
                        "displayName": String,
                        "name": String,
                        "url": String,
                        "image": {
                            "url": String,
                            "isDefault": Boolean
                        },
                        "isPlusUser": Boolean,
                        "language": String,
                        "circledByCount": Number,
                        "verified": false,
                        "cover": {
                            "layout": String,
                            "coverPhoto": {
                                "url": String,
                                "height": Number,
                                "width": Number
                            },
                            "coverInfo": {
                                "topImageOffset": Number,
                                "leftImageOffset": Number
                            }
                        },
                        "last_name": String,
                        "first_name": String,
                        "picture": String,
                        "thumbnail": String
                    },
                    facebook: {
                        "email": String,
                        "first_name": String,
                        "last_name": String,
                        "name": String,
                        "timezone": Number,
                        "verified": Boolean,
                        "id": String,
                        "picture": String,
                        "thumbnail": String
                    },
                    twitter: {
                        "id": Number,
                        "id_str": String,
                        "name": String,
                        "screen_name": String,
                        "location": String,
                        "description": String,
                        "url": String,
                        "protected": Boolean,
                        "followers_count": Number,
                        "friends_count": Number,
                        "listed_count": Number,
                        "created_at": String,
                        "favourites_count": Number,
                        "utc_offset": Number,
                        "time_zone": String,
                        "geo_enabled": Boolean,
                        "verified": Boolean,
                        "statuses_count": Number,
                        "lang": String,
                        "contributors_enabled": Boolean,
                        "is_translator": Boolean,
                        "is_translation_enabled": Boolean,
                        "profile_background_color": String,
                        "profile_background_image_url": String,
                        "profile_background_image_url_https": String,
                        "profile_background_tile": Boolean,
                        "profile_image_url": String,
                        "profile_image_url_https": String,
                        "profile_banner_url": String,
                        "profile_link_color": String,
                        "profile_sidebar_border_color": String,
                        "profile_sidebar_fill_color": String,
                        "profile_text_color": String,
                        "profile_use_background_image": Boolean,
                        "has_extended_profile": Boolean,
                        "default_profile": Boolean,
                        "default_profile_image": Boolean,
                        "following": Boolean,
                        "follow_request_sent": Boolean,
                        "notifications": Boolean,
                        "first_name": String,
                        "last_name": String,
                        "thumbnail": String,
                    }
                }
            }));

        actions.push(this._ensureSomeUsers());
        return Promise.all(actions);
    }

    _ensureSomeUsers() {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.upsertUser({
                id: "Anonymous",
                apiKey: "Anonymous",
                local: {
                    "email": "info@qwiery.com",
                    "password": "This will never be used"
                }
            });
            that.upsertUser({
                id: "Sharon",
                apiKey: "Sharon",
                local: {
                    "email": "sharon@qwiery.com",
                    "password": "This will never be used"
                },
                "facebook": {
                    "email": "sharon_eieskkg_ambjorn@tfbnw.net",
                    "first_name": "Sharon",
                    "last_name": "Ambjorn",
                    "name": "Sharon Ambjorn",
                    "timezone": 2,
                    "verified": false,
                    "id": "100007729021723",
                    "picture": "https://graph.facebook.com/100007729021723/picture",
                    "thumbnail": "https://graph.facebook.com/100007729021723/picture"
                }
            });
            resolve();
        });
    }

    _findUser(condition) {
        return this.Identity.findOne(condition);
    }

    /**
     * Returns whether the user with given id exists.
     * @param id {string} The id of a user.
     * @returns {Promise.<boolean>}
     */
    exists(id) {
        const that = this;
        return new Promise(function(resolve, reject) {
            that.getById(id).then(function(user) {
                resolve(utils.isDefined(user));
            });
        });
    }


    /**
     * Return the user from the email in the 'local' authentication.
     *
     * The algorithm returns as soon as the user is found, but things are a bit convoluted due to the async nature of the file loading process.
     * Doing this with Promise.race would mean all dis would be searched and not sure how to not resolve if not found.
     * @param email
     * @returns {Promise<T>}
     */
    getByEmail(email) {
        return this._findUser({"local.email": email});

    }

    getByGoogleId(googleId) {
        return this._findUser({"google.id": googleId});
    }

    getByFacebookId(facebookId) {
        return this._findUser({"facebook.id": facebookId});
    }

    getByTwitterId(twitterId) {
        return this._findUser({"twitter.id": twitterId});
    }

    getById(id) {
        return this._findUser({id: id});
    }

    getByApiKey(key) {
        return this._findUser({apiKey: key});
    }

    getAllUsers() {
        return this.Identity.find({});
    }

    upsertUser(user) {
        return this.Identity.upsert(user, {id: user.id});
    }
}

module.exports = IdentityStorage;
