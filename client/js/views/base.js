define(function() {
  var templates = {};
  var View = Backbone.View.extend({
    __base: '/template/modules/',
    events: {
      'touchstart a': '__activeHack'
    },
    loadTemplate: function(template, callback) {
      if (arguments.length === 1) {
        callback = template;
        template = null;
      }
      var tmplKey = this.moduleName + '/' + (template || this.template);
      if (templates[tmplKey]) {
        callback(templates[tmplKey]);
      } else {
        $.getScript(this.__base + tmplKey + '.js', function() {
          var keys = Object.keys(jade.templates);
          templates[tmplKey] = jade.templates[keys[0]];
          delete jade.templates[keys[0]];
          callback(templates[tmplKey]);
        }.bind(this));
      }
    },
    $doc: $(document),
    $body: $(document.body),
    initialize: function() {
      this.$el.data('view', this);
      this.$el[0].__view = this;
      this.init.apply(this, arguments);
      this.$el.trigger({
        type: 'viewbind',
        view: this
      });
    },
    init: function() {},
    render: function() {
      var self = this;
      this.buildHtml(function(html) {
        self.$el.html(html);
        self.trigger('afterrender');
      }.bind(this));
    },
    renderTo: function(selector) {
      var self = this;
      this.buildHtml(function(html) {
        self.$el.find(selector).html(html);
        self.trigger('afterrender');
      }.bind(this));
    },
    buildHtml: function(callback) {
      var dataSource = this.model || this.collection;
      var self = this;
      this.loadTemplate(function(template) {
        var renderData = {};
        var originData = dataSource.toJSON();
        if (originData.__combined) {
          renderData = originData
        } else {
          renderData[dataSource.action] = originData;
        }
        callback(template(renderData));
      });
    },
    __activeHack: function() {}
  });
  return View;
});