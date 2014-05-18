define(["js/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "state_bar",
    init: function() {
      this.listenTo(this.model, 'change', this.updateCost.bind(this));
      this.$cost = this.$el.find('.cost');
    },
    updateCost: function() {
      var cost = this.model.get('cost');
      var dotTail = /\.$/.test(cost);
      var hasOperator = /[+-]/.test(cost);
      cost = parseFloat(cost) + '';
      if (dotTail) {
        cost += '.';
      }
      if (hasOperator) {

      }
      this.$cost.html(cost);
    }
  });
  return View;
});