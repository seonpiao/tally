define(["js/views/interface"], function(Interface) {
  var View = Interface.extend({
    events: {
      'touchstart': 'toggle'
    },
    init: function() {
      this.appendTo('.keywords');
    },
    createElement: function() {
      return $('<li class="plugin"><a href="#" class="icon-plus"></a></li>');
    },
    toggle: function(e) {
      e.preventDefault();
      this.module.toggle();
    }
  });
  return View;
});