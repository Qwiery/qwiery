/**
 * This contains the defaults used when no user-given settings are specified.
 */
const path = require("path");
module.exports = {
    /**
     * If no app is addressed then this defines the one which will answer.
     * The value is the 'name' not the 'id' of the app.
     */
    "defaultApp": "Qwiery",

    /**
     * The collection of apps listening.
     * Either an array or "all".
     * In case of "all" the app definitions are taken from the storage.
     */
    "apps": [
        {
            "id": "default",
            "name": "Qwiery"
        }
    ],

    /**
     * Defines the defaults used if not specified by the user-given configuration of an app.
     */
    "defaults": {
        /**
         * If the whole pipeline fails to find an answer and the app does not have a noAnswer defined
         * then this is the fallback answer.
         */
        "noAnswer": "I have no idea.",

        /**
         * The pipeline being used by apps if they don't define their own.
         */
        "pipeline": [
            "Spam",
            "Parsers",
            "Alias",
            "Deductions",
            "Flows",
            "Commands",
            "Edictor",
            [
                "RandomAnswers",
                "RandomAnswers"
            ],
            "Historization"
        ],
        /**
         * The parsers used if the app does not define its own.
         */
        "parsers": [
            "YouTube",
            "Language",
            "Sentiment",
            "Keywords",
            "Dates"
        ],

        /**
         * If an app does not define its own Oracle categories then this will be used.
         * An '*' means any category. Note that with '*' an app can potentially use answers from another app.
         */
        "categories": "*"
    },

    plugins: [],

    /**
     * Global setttings and core services settings.
     */
    system: {
        coreServices: [
            // {
            //     name: "MemoryStorage",
            //     /**
            //      * This defines how/where things are stored and accessed by the default file-based storage.
            //      */
            //     "filePath": path.join(__dirname, "QwieryDB.json"),
            //     "autosaveInterval": 5000,
            //     "autoload": true
            // },
            {
                "name": "MongoStorage",
                "connection": "mongodb://localhost:27017/QwieryDB"
            },
            {
                "name": "Documents",
                /**
                 * Where the markdown files are located for the Documents service
                 */
                "documentsDir": path.join(__dirname, "../doc/notes")
            },
            "System",
            "Graph",
            "Topics",
            "Personalization",
            "Personality",
            "Pipeline",
            "Oracle",
            "Identity",
            "PackageLoader",
            "Workflows",
            "Statistics",
            "History",
            "Apps"
        ],

        coreInterpreters: [
            "Alias",
            "Spam",
            "Parsers",
            "Commands",
            "Flows",
            "Edictor",
            "Historization",
            "RandomAnswers",
            "Deductions",
            "Parallel"
        ],

        /**
         * Defines the maximum amount of apps a user can have by default.
         */
        "userAppQuota": 5,

        /**
         * Whether the data should be reset with respect to the previous runtime sessions.
         * If set to 'false' the data will be kept and reused after restarting the service.
         */
        "resetData": true,

        /**
         * The maximum iteration depth to find an answer: between 2 and 20
         */
        "maximumRedirections": 10,

        /**
         * If `true` the userId defined in the the security context will be checked.
         */
        "checkIdentity": false,

        /**
         * The location where plugins and addons can be found
         */
        "repository": "http://127.0.0.1:9000/"
    }

};
