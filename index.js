var Hapi = require('hapi');
var Good = require('good');
var search = require('./lib/search.js');
var package = require('./lib/package.js');

var server = new Hapi.Server();
server.connection({ port: 5000 });

server.route(search);
server.route(package);

server.register({
  register: Good,
  options: {
    reporters: [{
      reporter: require('good-console'),
      events: {
        response: '*',
        log: '*'
      }
    }]
  }
}, function (err) {
  if (err) {
    throw err; // something bad happened loading the plugin
  }

  server.start(function () {
    server.log('info', 'Server running at: ' + server.info.uri);
  });
});