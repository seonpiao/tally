var redis = require('../data/redis');
var util = require('util');

var model = {
  get: function(options) {
    var owner = options.owner;
    var keyword = options.keyword;
    var key = util.format('keyword:%s', owner);
    return function(done) {
      var self = this;
      if (keyword) {
        console.log(key + '---' + keyword)
        redis.hget(key, keyword, function(err, reply) {
          if (reply) {
            var arr = reply.split('|');
            self.locals.keyword = {
              category: arr[1],
              keyword: arr[0],
              show: parseInt(arr[2])
            };
          }
          done.apply(self, arguments);
        });
      } else {
        redis.hvals(key, function(err, reply) {
          var keywords = reply.map(function(item) {
            var arr = item.split('|');
            return {
              category: arr[1],
              keyword: arr[0],
              show: parseInt(arr[2])
            }
          });
          self.locals.keywords = keywords;
          done.apply(self, arguments);
        });
      }
    };
  },
  add: function(options) {
    var owner = options.owner;
    var keyword = options.keyword;
    var category = options.category;
    var show = options.show === 1 ? 1 : 0;
    var key = util.format('keyword:%s', owner);
    return function(done) {
      var self = this;
      redis.hset(key, keyword, keyword + '|' + category + '|' + show, function() {
        done.apply(self, arguments);
      });
    }
  },
  modify: function(options) {
    var owner = options.owner;
    var keyword = options.keyword;
    var category = options.category;
    var show = options.show === 1 ? 1 : 0;
    var key = util.format('keyword:%s', owner);
    return function(done) {
      var self = this;
      redis.hset(key, keyword, keyword + '|' + category + '|' + show, function() {
        done.apply(self, arguments);
      });
    }
  }
};

module.exports = model;