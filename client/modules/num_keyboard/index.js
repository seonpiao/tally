define(["./view", 'modules/cost_model/index'], function(View, costModel) {
  return {
    init: function() {
      var view = new View({
        el: $('[data-module="num_keyboard"]'),
        model: costModel
      });
    }
  };
});