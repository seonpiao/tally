define(["./view", './model'], function(View, Model) {
  return {
    init: function(el) {
      var view = new View({
        el: el,
        model: new Model()
      });
    }
  };
});