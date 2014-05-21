define(["js/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "del_tally",
    events: {
      'touchstart a': '_del'
    },
    _del: function(e) {
      e.preventDefault();
      var target = $(e.target);
      var id = target.attr('data-tally');
      this.model.id = id;
      var isDel = confirm('确定要删除么?');
      if (isDel) {
        this.model.fetch({
          success: function() {
            location.reload();
          }
        });
      }
    }
  });
  return View;
});