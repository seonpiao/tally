define('popupoverlay-src', 'js/libs/jquery.popupoverlay.js');
define(["js/views/base", './interfaces/keywordList', 'popupoverlay-src'], function(Base, KeywordList) {
  var View = Base.extend({
    moduleName: "add_keyword",
    init: function() {
      new KeywordList({
        module: this
      });
    },
    toggle: function() {
      this.$el.toggle();
    }
  });
  return View;
});