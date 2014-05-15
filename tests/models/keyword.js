var assert = require('assert');

var model = require('../../models/keyword');
var redis = require('../../data/redis');

describe('category model', function() {
  var ctx = {
    locals: {}
  };
  var keywords = [
    '早餐|餐饮|1',
    '午餐|餐饮|1',
    '晚餐|餐饮|1',
    '水果|餐饮|1',
    '停车|交通|1',
    '加油|交通|1',
    '打车|交通|0',
    '超市|生活|1',
    '兔粮|宠物|1',
    '猫粮|宠物|1',
    '猫砂|宠物|1'
  ];
  keywords.forEach(function(keyword) {
    it('add keyword', function(done) {
      var arr = keyword.split('|');
      model.add({
        owner: '1',
        keyword: arr[0],
        category: arr[1],
        show: parseInt(arr[2])
      }).call(ctx, function(err, reply) {
        done();
      });
    });
  });
});