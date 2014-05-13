var redis = require('../data/redis');
var util = require('util');

var model = {
  get: function(options) {
    var owner = options.owner;
    var id = options.id;
    var key = util.format('category:%s', owner);
    return function(done) {
      var self = this;
      if (!isNaN(id)) {
        redis.hget(key, id, function(err, reply) {
          self.locals.category = reply;
          done.apply(self, arguments);
        });
      } else {
        redis.hvals(key, function(err, reply) {
          self.locals.categories = reply;
          done.apply(self, arguments);
        });
      }
    };
  },
  add: function(options) {
    var owner = options.owner;
    var name = options.name;
    var key = util.format('category:%s', owner);
    return function(done) {
      var self = this;
      redis.incr('category_next_id', function(err, reply) {
        redis.hset(key, reply, name, function() {
          done.apply(self, arguments);
        });
      });
    }
  },
  modify: function(options) {
    var owner = options.owner;
    var name = options.name;
    var id = options.id;
    var key = util.format('category:%s', owner);
    return function(done) {
      var self = this;
      redis.hset(key, id, name, function() {
        done.apply(self, arguments);
      });
    }
  }
};

module.exports = model;