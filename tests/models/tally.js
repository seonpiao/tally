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
          years[year] = years[year] || {};
          years[year].items = years[year].items || [];
          years[year].months = years[year].months || {};
          years[year].months[month] = years[year].months[month] || {};
          years[year].months[month].items = years[year].months[month].items || [];
          years[year].months[month].dates = years[year].months[month].dates || {};
          years[year].months[month].dates[date] = years[year].months[month].dates[date] || {};
          years[year].months[month].dates[date].items = years[year].months[month].dates[date].items || [];
          years[year].items.push(id);
          years[year].months[month].items.push(id);
          years[year].months[month].dates[date].items.push(id);
          console.log(JSON.stringify(years));
        });
        for (var year in years) {
          var ids = years[year].items.join(',');
          redis.set('tally:index:' + year, ids, function(err, reply) {});
          var months = years[year].months;
          for (var month in months) {
            var ids = months[month].items.join(',');
            redis.set('tally:index:' + year + ":" + month, ids, function(err, reply) {});
            var dates = months[month].dates;
            for (var date in dates) {
              var ids = dates[date].items.join(',');
              redis.set('tally:index:' + year + ":" + month + ":" + date, ids, function(err, reply) {});
            }
          }
        }
      }
      done();
    })
  });
});