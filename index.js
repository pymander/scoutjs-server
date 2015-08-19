var Hapi = require('hapi');
var Good = require('good');
var Path = require('path');
var Inert = require('inert');

var search = require('./lib/search.js');
var package = require('./lib/package.js');

var server = new Hapi.Server({
  connections: {
    routes: {
      cors: true,
      files: {
        relativeTo: Path.join(__dirname, 'public')
      }
    }
  }
});

server.connection({
  host: '0.0.0.0', 
  port: ~~process.env.PORT || 5000,
});

server.register(Inert, function () {});

server.route(search);
server.route(package);

server.route({
  method: 'GET',
  path: '/assets/{param*}',
  handler: {
    directory: {
      path: '.',
      redirectToSlash: true,
      index: true
    }
  }
});

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