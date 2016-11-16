var creds = require('./credentials.js');
var Joi = require('joi');
var _ = require('lodash');
var Q = require('q');

var mongodbUrl = 'mongodb://' + creds.mongodbHost + ':27017/scout';
var MongoClient = require('mongodb').MongoClient

module.exports = {
  path: '/api/packages/{id}',
  method: 'GET',
  config: {
    validate: {
      params: {
        id: Joi.required(),
      }
    },

    handler: function (request, reply) {
      var id = request.params.id;
      var deferred = Q.defer();

      MongoClient.connect(mongodbUrl, function (err, db) {
        var collection = db.collection('packages');

        collection.findOne({"id":id}, function (err, record) {
          deferred.resolve(record);

          db.close();
        });

      })
      
      return deferred.promise
        .then(function (result) {
          reply(result);
        })

        .fail(function (err) {
          console.error('get failed', _.get(err, 'body') || err);

          if (_.get(err, 'statusCode') === 404) {
            reply({}).code(404);
          }

          else {
            reply({ error: err }).code(500);
          }
        });
    }
  }
}
