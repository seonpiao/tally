define(['./domWatcher'], function(DomWatcher) {
  //当组件从页面中摘除时，需要取消组件的事件监听
  new DomWatcher().onremove('[data-module]', function(els) {
    els.each(function(i, el) {
      var view = el.__view;
      //当$(el).data('view')存在时，说明并不是要真正摘除这个节点，可能是append到另外的地方，因此不能取消事件监听
      if (view && !$(el).data('view')) {
        view.stopListening();
      }
    });
  });
  return {
    run: function(modules) {
      for (var name in modules) {
        var module = modules[name];
        if (!module) continue;
        try {
          if (module.init) {
            (function(module) {
              new DomWatcher().exist('[data-module="' + name + '"]', function(el) {
                if (!el.data('view')) {
                  module.init(el);
                }
              });
            })(module);
          }
        } catch (e) {
          console.error(e.stack);
        }
      }
    }
  }
});