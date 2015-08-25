var credentials = require('./credentials.js');
var orchestrate = require('orchestrate');
var db = orchestrate(credentials.api_key, credentials.data_center);
var Joi = require('joi');
var _ = require('lodash');

var FIELDS_TO_SEARCH = [
  'name',
  'description',
  // 'readme',
  'author',
  'keywords',
];

var searchByQuery = {
  path: '/api/search/{query}/{offset?}',
  method: 'GET',
  config: {
    validate: {
      params: {
        query: Joi.string().required(),
        offset: Joi.number(),
      }
    },

    handler: function (request, reply) {
      var query = request.params.query;
      var offset = request.params.offset;

      var searchTerms = _.map(FIELDS_TO_SEARCH, function (term) {
        var boost = (term === 'name') ? '^4' : '';
        return 'value.' + term + ':(' + query + boost + ')';
      });

      return db.newSearchBuilder()
      .collection('packages')
      .limit(10)
      .offset(offset || 0)
      .sort('npf_rank', 'desc')
      .query(searchTerms.join(' OR '))

      .then(cleanSearchResults)
      .then(reply)

      .fail(function (err) {
        console.error('search failed', _.get(err, 'body') || err);
        reply({ error: err }, 500);
      });
    }
  }
};

var showRecent = {
  path: '/api/recent/{offset?}',
  method: 'GET',
  config: {
    validate: {
      params: {
        offset: Joi.number(),
      }
    },

    handler: function (request, reply) {
      var offset = request.params.offset;

      return db.newSearchBuilder()
      .collection('packages')
      .limit(10)
      .offset(offset || 0)
      .sort('modified_date', 'desc')
      .query('value.npf_rank:[0.2 TO *]')

      .then(cleanSearchResults)
      .then(reply)

      .fail(function (err) {
        console.error('search failed', _.get(err, 'body') || err);
        reply({ error: err }, 500);
      });
    }
  }
};


function cleanSearchResults (result) {
  var packages = _.get(result, 'body.results');
  var nextOffset = findSearchOffset(_.get(result, 'body.next'));

  var cleanPackages = _.map(packages, function (item, index) {
    var package = _.get(item, 'value');

    var output = _.pick(package, 'name', 'description', 'version');

    output.id = _.get(item, 'path.key');
    output.downloads = _.get(package, 'downloads.daily_total');
    output.avatar = _.get(package, 'github.owner.avatar_url');
    output.stars = _.get(package, 'github.stargazers_count');
    output.watchers = _.get(package, 'github.watchers_count');
    output.forks = _.get(package, 'github.forks_count');
    output.rank = _.get(package, 'npf_rank');

    output.created = _.get(package, 'created_date');
    output.updated = _.get(package, 'modified_date');

    return output;
  });

  return {
    packages: cleanPackages,
    next: nextOffset,
    results: _.get(result, 'body.total_count'),
  };
}


function findSearchOffset (nextLink) {
  if (!nextLink || !_.isString(nextLink)) return 0;
  var match = nextLink.match(/offset=(\d+)/i);
  if (!match || !_.isArray(match)) return 0;

  return parseInt(match[1]); 
};


module.exports = [
  searchByQuery,
  showRecent,
];
