var redis = require('../data/redis');
var util = require('util');

var model = {
  get: function(options) {
    var owner = options.owner;
    var id = options.id;
    var key = util.format('tally:%s', owner);
    return function(done) {
      var self = this;
      if (!isNaN(id)) {
        redis.hget(key, id, function(err, reply) {
          self.locals.tally = reply;
          done.apply(self, arguments);
        });
      } else {
        redis.hvals(key, function(err, reply) {
          var tallies = reply.map(function(item) {
            var arr = item.split('|');
            return {
              id: arr[0],
              cost: arr[1],
              category: arr[2],
              time: arr[3]
            };
          });
          self.locals.tallies = tallies;
          done.apply(self, arguments);
        });
      }
    };
  },
  add: function(options) {
    var owner = options.owner;
    var cost = options.cost;
    var category = options.category;
    var time = Date.now();
    var key = util.format('tally:%s', owner);
    return function(done) {
      var self = this;
      redis.incr('tally_next_id', function(err, reply) {
        var data = [reply, cost, category, time];
        redis.hset(key, reply, data.join('|'), function() {
          done.apply(self, arguments);
        });
      });
    }
  }
};

module.exports = model;