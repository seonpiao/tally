define(["js/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "num_keyboard",
    events: {
      'touchstart .num': '_input',
      'touchstart .del': '_del',
      'touchstart .clear': '_clear',
      'touchstart .ok': '_ok',
      'touchstart .operator': '_operate'
    },
    init: function() {},
    _input: function(e) {
      e.preventDefault();
      var target = $(e.target);
      var cost = this.model.get('cost').toString();
      cost += target.html();
      this.model.set('cost', cost);
    },
    _del: function(e) {
      e.preventDefault();
      var target = $(e.target);
      var cost = this.model.get('cost').toString();
      cost = cost.replace(/.$/, '');
      this.model.set('cost', cost || 0);
    },
    _ok: function(e) {
      e.preventDefault();
      var cost = parseFloat(this.model.get('cost'));
      location.href = '/done/' + cost + '?' + Date.now();
    },
    _clear: function(e) {
      e.preventDefault();
      this.model.set('cost', 0);
    },
    _operate: function(e) {
      e.preventDefault();
      var target = $(e.target);
      var cost = this.model.get('cost');
      cost += target.html();
      this.model.set('cost', cost);
    }
  });
  return View;
});