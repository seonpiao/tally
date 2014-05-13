var assert = require('assert');

var model = require('../../models/category');
var redis = require('../../data/redis');

describe('category model', function() {
  before(function(done) {
    redis.multi()
      .del('category:test')
      .set('category_next_id', 0)
      .exec(done);
  });
  var ctx = {
    locals: {}
  };
  it('add a category', function(done) {
    model.add({
      owner: 'test',
      name: 'category2'
    }).call(ctx, function(err, reply) {
      assert.equal(1, reply);
      done();
    });
  });
  it('get category by id', function(done) {
    model.get({
      owner: 'test',
      id: 1
    }).call(ctx, function(err, reply) {
      assert.equal('category2', reply);
      done();
    });
  });
});