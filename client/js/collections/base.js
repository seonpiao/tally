define(['../models/base'], function(Model) {
  var Colletion = Backbone.Collection.extend({
    model: Model,
    url: function() {
      return '/api/' + this.action;
    },
    initialize: function() {
      this.init.apply(this, arguments);
    },
    init: function() {},
    parse: function(res) {
      var module, action;
      if (res && (module = res[this.moduleName]) && (action = module[this.action]) && action.ret_code === 0) {
        return action.data;
      }
      if (action && action.ret_code != 0) {
        this.trigger('error', action);
        return [];
      }
      return [];
    }
  });
  return Colletion;
});