var Cookies        = require('cookies');
var SessionManager = require('./lib/session_manager');
var nano = require('nano');

function CouchCushion(url, ttl) {
  this.connection = nano(url);
  this.ttl = ttl || 30 * 60 * 1000;
}

CouchCushion.prototype.getSessionId = function(req, res) {
  return (new Cookies(req, res)).get('session_id');
}

CouchCushion.prototype.setSessionId = function(req, res, id) {
  (new Cookies(req, res)).set('session_id', id);
}

CouchCushion.prototype.middleware = function() {
  var self = this;
  return function(req, res, next) {
    req.session = new SessionManager(self.connection, self.ttl);

    req.session.on('error', function(err) {
      this.handleError(req, res, err);
    }.bind(this));

    req.session.setup(this.getSessionId(req, res), function() {
      this.setSessionId(req, res, req.session.id); next();
    }.bind(this));
  }
}

module.exports = CouchCushion;
