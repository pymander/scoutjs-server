var credentials = require('./credentials.js');
var orchestrate = require('orchestrate');
var db = orchestrate(credentials.api_key, credentials.data_center);
var Joi = require('joi');
var _ = require('lodash');


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

      return db.get('packages', id)
      .then(function (result) {
        reply(_.get(result, 'body'));
      })

      .fail(function (err) {
        console.error('get failed', _.get(err, 'body') || err);

        if (_.get(err, 'statusCode') === 404) {
          reply({}).code(404);
        }

        else {
          reply({ error: _.get(err, 'body.message') }).code(500);
        }
      });
    }
  }
}
