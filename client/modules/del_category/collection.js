define(["js/collections/base", "./model"], function(Base, Model) {
  var Colletion = Base.extend({
    model: Model,
    moduleName: "del_category"
  });
  return Colletion;
});