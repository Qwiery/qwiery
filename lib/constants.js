/**
 * This static module contains reusable constants.
 * @module constants
 */
module.exports = {
    /**
     * Defines common pod types.
     */
    podType: {
        Text: "Text",
        List: "List",
        SingleEntity: "SingleEntity",
        Appointment: "Appointment",
        Address: "Address",
        Task: "Task",
        Person: "Person",
        Favorites: "Favorites",
        People: "People",
        Video: "Video",
        Files: "Files",
        Images: "Images",
        GraphSearch: "GraphSearch",
        Thought: "Thought",
        Thoughts: "Thoughts",
        CurrentAgenda: "CurrentAgenda",
        OracleStackItem: "OracleStackItem",
        Workspaces: "Workspaces",
    },
    listTypes: {
        SearchItem: "SearchItem"
    },

    AGENDA: "Agenda",
    TASKS: "Tasks",
    LIST: "List of unknown list type",
    FAVORITES: "Favorites",
    THOUGHTS: "Thoughts",
    PEOPLE: "People",
    GRAPHSEARCH: "Graph search results",
    PLAIN: "A plain object",
    NOTPLAIN: "Some object; not an answer, not a plain object either.",
    NORESULTS: "Could not determine the result",
    MULTIPOD: "A multipod answer",
    SINGLEENTITY: "Single entity",
    BADSESSIONFORMAT: "Bad answer, not a string, not a number, not an array.",
    NOSESSION: "No session returned",
    EMPTYARRAY: "Bad answer, empty array",
    ENTITYORPROCESSNOTFOUND: "The necessary data to answer this was not found.",
    DefaultYesNoRejectResponse: "Please just use 'yes', 'no', or 'n' or 'y' or 'yep' or alike. If you tell me to forget about it I will just ignore the info you gave me :)",
    NOINPUT: "No input given",
    TRYAGAIN: "Try again",
    CORRECT: "Correct",
    YESORNO: "Yes or no",
    SPECIFYNUMBER: "Give a number",
    NOTEMPTYALLOWED: "Not allowed",
    INTERNALERROR: "Internal error",
    DISCARDQUESTION: "Discarding the question",
    STUBBORN: "Persisting",
    NODELETION: "OK, nothing was deleted",
    PACKAGELOADED: "PackageLoaded",
    BADCHOICE: "Bad choice",
    BLINDREX: /[^a-z A-Z0-9.,?!:;\/@\$\*-_=%\+'#\(\)?]/gi,
    EMPTYINPUT: "Seems like you gave me empty input.",
    QWIERYCONFIGJSON: "Qwiery.config.json",
    QWIERYPACKAGEDIR: "QStuff",
    DEFAULTREPO: "http://127.0.0.1:9000/"
};