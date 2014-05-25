define(["js/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "del_category",
    events: {
      'touchend a': '_del'
    },
    _del: function(e) {
      e.preventDefault();
      var target = $(e.target);
      var category = target.attr('data-category');
      this.model.category = category;
      var isDel = confirm('确定要删除么?');
      if (isDel) {
        this.model.fetch({
          success: function() {
            // location.reload();
          }
        });
      }
    }
  });
  return View;
});