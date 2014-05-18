define(["./view", 'modules/cost_model/index'], function(View, costModel) {
  return {
    init: function() {
      var view = new View({
        el: $('[data-module="state_bar"]'),
        model: costModel
      });
    }
  };
});