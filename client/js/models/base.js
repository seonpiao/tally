define(function() {
  Backbone.sync = function(method, model, options) {
    var params = {
      type: 'GET',
      dataType: 'json'
    };

    options || (options = {});
    if (!options.url) {
      params.url = model.url();
    }

    if (!options.data && model && (method === 'create' || method === 'update')) {
      params.data = model.toJSON();
      params.type = 'POST';
    }

    return $.ajax(_.extend(params, options));
  };
  var Model = Backbone.Model.extend({
    initialize: function() {
      this.init.apply(this, arguments);
    },
    init: function() {},
    url: function() {
      if (this.path) {
        return this.path;
      }
      return '/api/' + this.action;
    }
  });
  return Model;
});