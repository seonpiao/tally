define(["./view", './model'], function(View, Model) {
  return {
    init: function() {
      var view = new View({
        el: $('[data-module="del_tally"]'),
        model: new Model()
      });
    }
  };
});