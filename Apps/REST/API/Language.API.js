

module.exports = function(app, qwiery) {
    const graph = qwiery.services.graph;
    const identity = qwiery.services.identity;
    const security = require("../security")(identity);
    /**
     * @swagger
     * definition:
     *      KeywordItem:
     *          type: object
     *          description: A keyword from the keyword analysis.
     *          properties:
     *              term:
     *                  type: string
     *                  description: The keyword found in the given text.
     *              probability:
     *                  type: number
     *                  description: The weight or probability of the keyword in the text.
     *      KeywordOutput:
     *          type: object
     *          description: The output of the keyword extraction analysis.
     *          properties:
     *              original:
     *                  type: string
     *              keywords:
     *                  type: array
     *                  items:
     *                      $ref: '#/definitions/KeywordItem'
     *          example:
     *              {
     *                   "original": "After that... ",
     *                   "keywords": [
     *                       [
     *                           {
     *                               "term": "time",
     *                               "probability": "4%"
     *                           },
     *                           {
     *                               "term": "young",
     *                               "probability": "3%"
     *                           }
     *                       ]
     *                   ]
     *               }
     *
     *      PosItem:
     *          type: object
     *          description: A part-of speech element.
     *          properties:
     *              word:
     *                  description: The word or token.
     *                  type: string
     *              tag:
     *                  type: string
     *                  description: The Penn-Treebank tag.
     *              label:
     *                  type: string
     *                  description: The name of the tag.
     *              color:
     *                  type: string
     *                  description: The Qwiery-specific color this tag has.
     *      PosOutput:
     *          type: object
     *          description: The POS info returned from the part-of speech analysis.
     *          properties:
     *              pos:
     *                  type: array
     *                  items:
     *                      $ref: '#/definitions/PosItem'
     *          example:
     *              {
     *                   "original": "It was impossible...",
     *                   "pos": [
     *                       {
     *                           "word": "It",
     *                           "tag": "PRP",
     *                           "label": "Personal pronoun",
     *                           "color": "DodgerBlue"
     *                       },
     *                       {
     *                           "word": "was",
     *                           "tag": "VBD",
     *                           "label": "verb, past tense",
     *                           "color": "DarkGreen"
     *                       },
     *                       {
     *                           "word": "impossible",
     *                           "tag": "JJ",
     *                           "label": "Adjective",
     *                           "color": "Blue"
     *                       }
     *                   ]
     *               }
     *      SentimentItem:
     *          type: object
     *          description: The weight of a language in the language detection analysis.
     *          properties:
     *              language:
     *                  type: string
     *              probability:
     *                  type: number
     *      DetectOutput:
     *          type: object
     *          description: The info returned by the language detection analysis.
     *          properties:
     *              original:
     *                  description: The text which was analyzed.
     *                  type: string
     *              languages:
     *                  type: array
     *                  items:
     *                      $ref:  '#/definitions/SentimentItem'
     *          example:
     *              {
     *                   "original": "This is so superb when the orange is green.",
     *                   "languages": [
     *                       {
     *                           "language": "english",
     *                           "probability": "37%"
     *                       },
     *                       {
     *                           "language": "pidgin",
     *                           "probability": "27%"
     *                       }
     *                   ]
     *               }
     *      SentimentOutput:
     *          type: object
     *          description: The info returned by the sentiment analysis.
     *          properties:
     *              score:
     *                  description: The sentiment score corresponding to the sum of scores of the contributing words.
     *                  type: string
     *              comparative:
     *                  description: The ratio of the score versus the amount of words.
     *                  type: number
     *              tokens:
     *                  description: The words recognized in the given text.
     *                  type: array
     *                  items:
     *                      type: string
     *              words:
     *                  description: The words contributing to the sentiment score.
     *                  type: array
     *                  items:
     *                      type: string
     *              positive:
     *                  description: The words contributing to a positive score.
     *                  type: array
     *                  items:
     *                      type: string
     *              negative:
     *                  description: The words contributing to a negative score.
     *                  type: array
     *                  items:
     *                      type: string
     *              original:
     *                  description: The text which was analyzed.
     *                  type: string
     *          example:
     *              {
     *                         "score": -1,
     *                         "comparative": -0.013888888888888888,
     *                         "tokens": [
     *                             "could",
     *                             "accuse",
     *                             "us",
     *                             "of",
     *                             "doing",
     *                             "anything",
     *                             "wrong"
     *                         ],
     *                         "words": [
     *                             "wrong",
     *                             "accuse",
     *                             "want",
     *                             "like"
     *                         ],
     *                         "positive": [
     *                             "want",
     *                             "like"
     *                         ],
     *                         "negative": [
     *                             "wrong",
     *                             "accuse"
     *                         ],
     *                         "original": "Father, Mother, said his sister,..."
     *                }
     */
    /**
     * @swagger
     * /language/sentiment:
     *   post:
     *     operationId: sentiment
     *     tags:
     *          - language
     *     description: Returns the sentiment out of the given text.
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: text
     *         description: the string you wish to analyze
     *         in: body
     *         required: true
     *         schema:
     *            type: string
     *     responses:
     *       200:
     *         description: Successful response.
     *         schema:
     *            $ref: '#/definitions/SentimentOutput'
     *       401:
     *         description: The ApiKey is empty. Login and use the supplied API key to make requests.
     */
    app.post("/language/sentiment/", security.ensureApiKey, analytics.postLanguageUsage, function(req, res) {
        var text = req.body.text;
        if(utils.isUndefined(text)) {
            res.status(500).send("Missing text parameter in the body.");
        }

        var sentiment = require("../Services/Sentiment/Sentiment");
        sentiment.getScore(text).then(function(score) {
            res.json(score);
        })

    });

    /**
     * @swagger
     * /language/detect:
     *   post:
     *     operationId: detect
     *     tags:
     *          - language
     *     description: Detects the language(s) in the given text.
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: text
     *         description: the string you wish to analyze
     *         in: body
     *         required: true
     *         schema:
     *            type: string
     *     responses:
     *       200:
     *         description: Successful response
     *         schema:
     *            $ref: '#/definitions/DetectOutput'
     *       401:
     *         description: The ApiKey is empty. Login and use the supplied API key to make requests.
     */
    app.post("/language/detect/", security.ensureApiKey, analytics.postLanguageUsage, function(req, res) {
        var text = req.body.text;
        if(utils.isUndefined(text)) {
            res.status(500).send("Missing text parameter in the body.");
        }

        var lan = require("../Services/Language/Language");
        lan.detectLanguage(text).then(function(found) {
            var r = [];
            for(var i = 0; i < found.languages.length; i++) {
                var item = found.languages[i];
                r.push({
                    language: item[0],
                    probability: Math.round(parseFloat(item[1]) * 100, 0) + "%"
                })
            }
            res.json({
                original: found.original,
                languages: r
            });
        })
    });

    /**
     * @swagger
     * /language/pos:
     *   post:
     *     operationId: tagging
     *     tags:
     *          - language
     *     description: Returns part-of speech in the given text.
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: text
     *         description: the string you wish to analyze
     *         in: body
     *         required: true
     *         schema:
     *            type: string
     *     responses:
     *       200:
     *         description: Successful response
     *         schema:
     *            $ref: '#/definitions/PosOutput'
     *       401:
     *         description: The ApiKey is empty. Login and use the supplied API key to make requests.
     */
    app.post("/language/pos/", security.ensureApiKey, analytics.postLanguageUsage, function(req, res) {
        var text = req.body.text;
        if(utils.isUndefined(text)) {
            res.status(500).send("Missing text parameter in the body.");
        }

        var lan = require("../Services/Language/Language");
        lan.getPOS(text).then(function(found) {
            res.json(found);
        })
    });

    /**
     * @swagger
     * /language/keywords:
     *   post:
     *     operationId: keywords
     *     tags:
     *          - language
     *     description: Returns part-of speech in the given text.
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: text
     *         description: the string you wish to analyze
     *         in: body
     *         required: true
     *         schema:
     *            type: string
     *     responses:
     *       200:
     *         description: Successful response
     *         schema:
     *            $ref: '#/definitions/KeywordOutput'
     *       401:
     *         description: The ApiKey is empty. Login and use the supplied API key to make requests.
     */
    app.post("/language/keywords/", security.ensureApiKey, analytics.postLanguageUsage, function(req, res) {
        var text = req.body.text;
        if(utils.isUndefined(text)) {
            res.status(500).send("Missing text parameter in the body.");
        }

        var tagger = require("../Services/Tagger/Tagger");
        // getTags accepts text or URL
        tagger.getKeywords(text).then(function(results) {
            if(utils.isUndefined(results) || results.keywords.length === 0) {
                res.json("Could not fetch the page or returned data was empty.");
                return;
            }
            else {
                var keywords = results.keywords;
                var collector = [];
                for(var i = 0; i < keywords.length; i++) {
                    var single = keywords[i];
                    var topic = [];
                    for(var j = 0; j < single.length; j++) {
                        var item = single[j];
                        topic.push({
                            term: item.term,
                            probability: Math.round(parseFloat(item.probability) * 100, 0) + "%"
                        });
                    }
                    collector.push(topic);
                }
                res.json({
                    original: results.original,
                    keywords: collector
                });
                return;

            }
        });

    });
};