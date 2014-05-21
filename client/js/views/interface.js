define(["js/views/base"], function(Base) {
  var Interface = Base.extend({
    initialize: function(options) {
      this.module = options.module;
      this.setElement(this.createElement());
      Base.prototype.initialize.call(this, options);
    },
    appendTo: function(selector) {
      var elem = $(selector);
      if (elem.length > 0) {
        elem.append(this.$el);
      }
    }
  });
  return Interface;
});