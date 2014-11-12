
var accepts = require('accept-encoding');

/**
 * Get the best encoding for `req`
 *
 * @api public
 * @param {http.IncomingMessage} req
 * @param {Array} [encodings]
 * @return {String}
 */

exports = module.exports = function (req, encodings) {
  encodings = encodings || exports.encodings;

  for (var i = 0, len = encodings.length; i < len; i++) {
    if (accepts(req, encodings[i])) {
      return encodings[i];
    }
  }

  return null;
};

/**
 * Expose the default supproted encodings
 *
 * @api public
 * @type {Array}
 */

exports.encodings = [ 'gzip', 'deflate' ];
