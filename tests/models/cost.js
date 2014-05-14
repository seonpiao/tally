var assert = require('assert');

var model = require('../../models/cost');
var redis = require('../../data/redis');

describe('cost model', function() {
  var ctx = {
    locals: {}
  };
  before(function(done) {
    redis.del('cost:1', done);
  });
  var costs = [9, 10, 11, 12, 15, 18, 20, 24, 25, 30, 40, 50, 100, 200, 300];
  costs.forEach(function(cost) {
    it('add cost', function(done) {
      model.add({
        owner: 1,
        cost: cost
      }).call(ctx, function(err, reply) {
        done();
      })
    });
  })
});