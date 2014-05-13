var assert = require('assert');

var model = require('../../models/user');
var redis = require('../../data/redis');

describe('user model', function() {
  before(function(done) {
    redis.multi()
      .set('testuser:testpwd', '1')
      .exec(done);
  });
  var ctx = {
    locals: {}
  };
  it('auth', function(done) {
    model.auth({
      passwd: 'testpwd',
      name: 'testuser'
    }).call(ctx, function(err, reply) {
      assert.equal('1', reply);
      done();
    });
  });
});