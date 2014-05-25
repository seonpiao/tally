define(["js/models/base"], function(Base) {
  var Model = Base.extend({
    url: function() {
      return '/settings/keyword/del/' + this.keyword;
    }
  });
  return Model;
});