define('underscore-src', 'js/libs/underscore.js');
define('jquery-src', 'js/libs/jquery.js');
define('backbone-src', ['jquery-src', 'underscore-src'], 'js/libs/backbone.js');

require(['backbone-src'], function(io) {
  //hack jQuery trigger function to trigger events exactly we want.
  var trigger = jQuery.fn.trigger;
  jQuery.fn.trigger = function(type, data) {
    var globalEvents = ['login', 'logout'];
    if (this[0] === document) {
      if (globalEvents.indexOf(type) !== -1) {
        trigger.apply(this, arguments);
      }
    } else {
      trigger.apply(this, arguments);
    }
  };
});