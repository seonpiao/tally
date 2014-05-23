var redis = require('../data/redis');
var util = require('util');
var logger = require('log4js').getLogger('model.tally');

var model = {
  get: function(options) {
    var owner = options.owner;
    var id = options.id;
    var key = util.format('tally:%s', owner);
    var filter = '';
    if (options.year) {
      filter = key + ':index';
      filter += ':' + options.year;
      if (options.month) {
        filter += ':' + options.month;
        if (options.date) {
          filter += ':' + options.date;
        }
      }
    }
    return function(done) {
      var self = this;
      if (!isNaN(id)) {
        redis.hget(key, id, function(err, reply) {
          self.locals.tally = reply;
          done.apply(self, arguments);
        });
      } else {
        if (filter) {
          console.log(filter)
          redis.lrange(filter, 0, -1, function(err, reply) {
            if (reply) {
              var ids = reply;
              ids.unshift(key);
              redis.hmget(ids, function(err, reply) {
                if (reply) {
                  var tallies = reply.map(function(item) {
                    var arr = item.split('|');
                    return {
                      id: arr[0],
                      cost: arr[1],
                      category: arr[2],
                      time: arr[3],
                      keyword: arr[4]
                    };
                  });
                  self.locals.tallies = tallies;
                }
                done.apply(self, arguments);
              });
            } else {
              done.apply(self, arguments);
            }
          });
        } else {
          redis.hvals(key, function(err, reply) {
            if (reply) {
              var tallies = reply.map(function(item) {
                var arr = item.split('|');
                return {
                  id: arr[0],
                  cost: arr[1],
                  category: arr[2],
                  time: arr[3],
                  keyword: arr[4]
                };
              });
              self.locals.tallies = tallies;
            }
            done.apply(self, arguments);
          });
        }
      }
    };
  },
  add: function(options) {
    var owner = options.owner;
    var cost = options.cost;
    var category = options.category;
    var keyword = options.keyword;
    var time = new Date;
    var key = util.format('tally:%s', owner);
    return function(done) {
      var self = this;
      redis.incr('tally_next_id', function(err, reply) {
        var data = [reply, cost, category, time.getTime(), keyword].join('|');
        logger.debug('Add [' + data + '] to ' + reply);
        redis.multi()
          .hset(key, reply, data)
          .rpush(key += ':index:' + time.getFullYear(), reply)
          .rpush(key += ':' + (time.getMonth() + 1), reply)
          .rpush(key += ':' + time.getDate(), reply)
          .exec(function() {
            done.apply(self, arguments);
          });
      });
    }
  },
  remove: function(options) {
    var owner = options.owner;
    var id = options.id;
    var key = util.format('tally:%s', owner);
    return function(done) {
      var self = this;
      redis.hget(key, id, function(err, reply) {
        if (reply) {
          var time = parseInt(reply.split('|')[3]);
          var date = new Date(time);
          redis.multi()
            .hdel(key, id)
            .lrem(key += ':index:' + date.getFullYear(), 0, id)
            .lrem(key += ':' + (date.getMonth() + 1), 0, id)
            .lrem(key += ':' + date.getDate(), 0, id)
            .exec(function(err, replies) {

            });
        }
      });
      redis.hdel(key, id, function() {
        done.apply(self, arguments);
      });
    }
  }
};

module.exports = model;