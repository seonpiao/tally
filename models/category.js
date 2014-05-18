var redis = require('../data/redis');
var util = require('util');

var model = {
  get: function(options) {
    var owner = options.owner;
    var category = options.category;
    var key = util.format('category:%s', owner);
    return function(done) {
      var self = this;
      if (category) {
        self.locals.category = null;
        redis.hget(key, category, function(err, reply) {
          self.locals.category = reply;
          done.apply(self, arguments);
        });
      } else {
        self.locals.categories = [];
        redis.hvals(key, function(err, reply) {
          var categories = reply.map(function(item) {
            return {
              category: item,
            }
          });
          self.locals.categories = categories;
          done.apply(self, arguments);
        });
      }
    };
  },
  add: function(options) {
    var owner = options.owner;
    var category = options.category;
    var key = util.format('category:%s', owner);
    return function(done) {
      var self = this;
      redis.hset(key, category, category, function() {
        done.apply(self, arguments);
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