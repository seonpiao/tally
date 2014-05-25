define(["js/models/base"], function(Base) {
  var Model = Base.extend({
    url: function() {
      return '/settings/category/del/' + this.category;
    }
  });
  return Model;
});