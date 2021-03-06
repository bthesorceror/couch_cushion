var nano    = require('nano');
var Runner5 = require('runner5');

function SessionManager(connection, ttl) {
  this.connection = connection;
  this.ttl = ttl;
}

(require('util')).inherits(SessionManager, (require('events').EventEmitter));

SessionManager.prototype.setup = function(id, cb) {
  if (!cb && id && typeof(id) === 'function') {
    cb = id; id = null;
  }

  this.id = id;
  this.id ? this._createOrUpdate(cb) : this._create(cb);
}

SessionManager.prototype.destroy = function(cb) {
  var runner = new Runner5(this.connection, this.connection.get);

  runner.setSuccessCheck(function(error) {
    return !error || error.status_code == 404;
  });

  runner.on('success', function(doc) {
    doc.data = {};
    this._update(doc, cb);
  }.bind(this));

  runner.on('failure', function(error) {
    this.emit('error','Session database failed');
  }.bind(this));

  runner.run(this.id);
}

// TODO: Get with array
SessionManager.prototype.get = function(key, cb) {
  var runner = new Runner5(this.connection, this.connection.get);

  runner.setSuccessCheck(function(error) {
    return !error || error.status_code == 404;
  });

  runner.on('success', function(doc) {
    cb(doc.data[key]);
  }.bind(this));

  runner.on('failure', function(error) {
    this.emit('error','Session database failed');
  }.bind(this));

  runner.run(this.id);
}

// TODO: Set with object
SessionManager.prototype.set = function(key, value, cb) {
  var runner = new Runner5(this.connection, this.connection.get);

  runner.on('success', function(doc) {
    doc.data[key] = value;
    this._update(doc, cb);
  }.bind(this));

  runner.on('failure', function(error) {
    this.emit('error','Session database failed');
  }.bind(this));

  runner.run(this.id);
}

SessionManager.prototype._createOrUpdate = function(cb) {
  this.connection.get(this.id, function(error, body) {
    if (error && error.status_code != 404) {
      this.emit('error','Session database failed');
      return;
    }
    if (!body || body.expiresAt < +(new Date())) {
      this._create(cb);
    } else {
      this.id = body._id;
      this._update(body, cb);
    }
  }.bind(this));
}

SessionManager.prototype._update = function(doc, cb) {
  doc.expiresAt = +(new Date()) + this.ttl;
  this.connection.insert(doc, function(error, body) {
    if (error) {
      this.emit('error','Session database failed');
      return;
    }
    cb();
  });
};

SessionManager.prototype._create = function(cb) {
  var expire_at = +(new Date()) + this.ttl;
  this.connection.insert({data: {}, expiresAt: expire_at}, function(error, body) {
    if (error) {
      this.emit('error','Session database failed');
      return;
    }
    this.id = body.id;
    cb()
  }.bind(this));
}

module.exports = SessionManager;
