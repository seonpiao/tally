var redis = require('../data/redis');
var util = require('util');

var model = {
  /**
   * get user info by uid
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
   */
  get: function(options) {
    options = options || {};
    var id = options.id;
    var key = 'user';
    return function(done) {
      var self = this;
      if (!isNaN(id)) {
        redis.mget('user:name:' + id, 'user:nickname:' + id, function(err, reply) {
          if (reply !== null) {
            self.locals.user = {
              name: reply[0],
              nickname: reply[1],
              uid: id
            };
          }
          done.apply(self, arguments);
        });
      } else {
        redis.hvals(key, function(err, reply) {
          self.locals.users = reply;
          done.apply(self, arguments);
        });
      }
    };
  },
  add: function(options) {
    options = options || {};
    var name = options.name;
    var key = 'user';
    return function(done) {
      var self = this;
      redis.incr('user_next_id', function(err, reply) {
        redis.hset(key, reply, name, function() {
          done.apply(self, arguments);
        });
      });
    }
  },
  auth: function(options) {
    options = options || {};
    var name = options.name;
    var passwd = options.passwd;
    var key = name + ':' + passwd;
    return function(done) {
      var self = this;
      redis.get(key, function(err, reply) {
        if (reply) {
          self.locals.user = {
            uid: reply
          };
          done.apply(self, arguments);
        } else {
          done.apply(self, arguments);
        }
      });
    };
  },
  check: function(session) {
    return function(done) {
      if (!session.uid) {
        this.status = 301;
        this.set('location', '/login');
        done();
      } else {
        done();
      }
    }
  }
};

module.exports = model;