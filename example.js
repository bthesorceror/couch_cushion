var Journeyman   = require('journeyman');
var Rudder       = require('rudder');
var CouchCushion = require('./index');

var journeyman = new Journeyman(3000);
var rudder     = new Rudder();
var cushion    = new CouchCushion(process.env.COUCH_URL);

rudder.get("/set/(.*)/(.*)", function(req, res, key, value) {
  req.session.set(key, value, function() {
    res.writeHead(200);
    res.end("OK");
  });
});

rudder.get("/get/(.*)", function(req, res, key) {
  req.session.get(key, function(value) {
    res.writeHead(200);
    res.end(value);
  });
});

rudder.get("/destroy", function(req, res) {
  req.session.destroy(function() {
    res.writeHead(200);
    res.end("OK");
  });
});

journeyman.use(rudder.middleware());
journeyman.use(cushion.middleware());

journeyman.listen();
