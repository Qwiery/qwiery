module.exports = function(identity) {
    return {

        /***
         * Captures the userId from the apiKey and puts
         * the context (ctx) in the request object.
         * @param req
         * @param res
         * @param next
         */
        ensureApiKey: function(req, res, next) {
            identity.getUserContext(req).then(function(ctx) {
                req.ctx = ctx;
                next();
            }).catch(function(e) {
                res.status(401).send(e);
            });
        },
        ensureAdmin: function(req, res, next) {
            identity.getUserContext(req, "Admin").then(function(ctx) {
                req.ctx = ctx;
                next();
            }).catch(function(e) {
                res.status(401).send(e);
            });
        }
    };
};