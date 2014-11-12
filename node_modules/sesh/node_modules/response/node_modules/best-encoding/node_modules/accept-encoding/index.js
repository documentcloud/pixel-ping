
/**
 * Check if `req` accepts the given `encoding`
 *
 * @api public
 * @param {http.IncomingMessage|Array} req
 * @param {String} encoding
 * @return {Boolean}
 */

exports = module.exports = function (req, encoding) {
  var encodings = Array.isArray(req)
      ? req
      : exports.encodings(req);

  return !!~encodings.indexOf(encoding);
};

/**
 * Get accepted encodings from `req`
 *
 * @api public
 * @param {http.IncomingMessage} req
 * @return {Array}
 */

exports.encodings = function encodings(req) {
  var accept = req.headers['accept-encoding'];

  return accept
    ? accept.trim().split(/ *, */)
    : [];
};
