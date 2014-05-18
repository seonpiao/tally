define(function() {
  window.Element && function(ElementPrototype) {
    ElementPrototype.matchesSelector = ElementPrototype.matchesSelector ||
      ElementPrototype.mozMatchesSelector ||
      ElementPrototype.msMatchesSelector ||
      ElementPrototype.oMatchesSelector ||
      ElementPrototype.webkitMatchesSelector;
  }(Element.prototype);
  var DomWatcher = function(options) {
    options = options || {};
    this.$el = $(options.el || document);
  };
  DomWatcher.prototype.exist = function(selector, callback) {
    var el = this.$el.find(selector);
    if (el.length > 0) {
      callback(el);
    }
    this.onadd(selector, callback);
  };
  DomWatcher.prototype.onadd = function(selector, callback) {
    var self = this;
    this.$el.on('DOMNodeInserted', function(e) {
      var target = e.target;
      var el = self._find(target, selector);
      if (el.length > 0) {
        callback(el);
      }
    });
  };
  DomWatcher.prototype.onremove = function(selector, callback) {
    var self = this;
    this.$el.on('DOMNodeRemoved', function(e) {
      var target = e.target;
      var el = self._find(target, selector);
      if (el.length > 0) {
        callback(el);
      }
    });
  };
  DomWatcher.prototype._find = function(inserted, selector) {
    var els = [];
    //只检查element元素
    if (inserted.nodeType === 1) {
      //先看子元素中是否包含满足条件的元素
      var el = $(inserted).find(selector);
      if (el.length > 0) {
        els = Array.prototype.slice.call(el, 0);
      }
      //再检查当前被插入的元素是否满足条件
      if (inserted.matchesSelector(selector)) {
        els.push(inserted);
      }
    }
    return $(els);
  };
  return DomWatcher;
});