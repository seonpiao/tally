var redis = require('../data/redis');
var util = require('util');

var model = {
  get: function(options) {
    var owner = options.owner;
    var id = options.id;
    var key = util.format('cost:%s', owner);
    return function(done) {
      var self = this;
      if (!isNaN(id)) {
        redis.hget(key, id, function(err, reply) {
          self.locals.cost = reply;
          done.apply(self, arguments);
        });
      } else {
        redis.hvals(key, function(err, reply) {
          var costs = reply.map(function(item) {
            var arr = item.split('|');
            return {
              cost: arr[1],
              id: arr[0]
            }
          });
          self.locals.costs = costs;
          done.apply(self, arguments);
        });
      }
    };
  },
  add: function(options) {
    var owner = options.owner;
    var cost = options.cost;
    var key = util.format('cost:%s', owner);
    return function(done) {
      var self = this;
      redis.incr('cost_next_id', function(err, reply) {
        redis.hset(key, reply, reply + '|' + cost, function() {
          done.apply(self, arguments);
        });
      });
    }
  }
};

module.exports = model;