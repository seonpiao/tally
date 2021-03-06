var assert = require('assert');

var model = require('../../models/tally');
var redis = require('../../data/redis');

describe('cost model', function() {
  var ctx = {
    locals: {}
  };
  it('tally', function(done) {
    model.get({
      owner: 1
    }).call(ctx, function(err, reply) {
      if (reply) {
        var years = {};
        reply.forEach(function(item) {
          var arr = item.split('|');
          var time = arr[3];
          var id = arr[0];
          var date = new Date(parseInt(time));
          var year = date.getFullYear();
          var month = date.getMonth() + 1;
          date = date.getDate();
          redis.rpush('tally:1:index:' + year, id);
          redis.rpush('tally:1:index:' + year + ':' + month, id);
          redis.rpush('tally:1:index:' + year + ':' + month + ':' + date, id);
        });
      }
      done();
    })
  });
  it.skip('delete keys', function(done) {
    var ctx = {
      locals: {}
    };
    redis.keys('tally:1:index:\*', function(err, reply) {
      redis.del(reply,function(err,reply){
        done();
      });
    });
  });
});
