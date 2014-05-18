define(["js/models/base"], function(Base) {
  var Model = Base.extend({
    url: function() {
      return '/tally/del/' + this.id;
    }
  });
  return Model;
});