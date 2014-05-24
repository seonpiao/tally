define('popupoverlay-src', 'js/libs/jquery.popupoverlay.js');
define(["js/views/base", './interfaces/keywordList', 'popupoverlay-src'], function(Base, KeywordList) {
  var View = Base.extend({
    moduleName: "add_keyword",
    events: {
      'touchend .btn': '_create',
      'change #category': '_categoryChange'
    },
    init: function() {
      new KeywordList({
        module: this
      });
      this.$keyword = this.$('#keyword');
      this.$category = this.$('#category');
      this.$keyword_tip = this.$keyword.next();
      this.$category_tip = this.$category.next();
      this._showTip();
    },
    toggle: function() {
      this.$el.toggle();
    },
    _showTip: function() {
      var $tips = this.$('[data-tip]');
      $tips.each(function(index, tip) {
        var $tip = $(tip);
        $tip.html($tip.attr('data-tip'));
      })
    },
    _create: function(e) {
      e.preventDefault();
      var keyword = this.$keyword.val().trim();
      var category = this.$category.val();
      if (keyword === '') {
        this._keywordError('必须输入消费项目');
        return;
      }
      if (this.$category.prop('selectedIndex') === 0) {
        this._categoryError('必须选择一个分类');
        return;
      }
      location.href = '/cost/' + keyword + '/' + category;
    },
    _categoryChange: function() {
      var category = this.$category.val();
      var self = this;
      if (category === '创建新分类') {
        category = prompt('输入分类名').trim();
        if (category) {
          var $option = $('<option>' + category + '</option>');
          $option.innerText = category;
          setTimeout(function() {
            $option.insertBefore(self.$category.find('option').last());
            self.$category[0].selectedIndex = self.$category.find('option').length - 2;
          }, 0);
        }
      }
    },
    _keywordError: function(msg) {
      this.$keyword.addClass('error');
      this.$keyword_tip.addClass('error');
      this.$keyword_tip.html(msg);
      var self = this;
      setTimeout(function() {
        self.$keyword.removeClass('error');
        self.$keyword_tip.removeClass('error');
        self._showTip();
      }, 3000);
    },
    _categoryError: function(msg) {
      this.$category.addClass('error');
      this.$category_tip.addClass('error');
      this.$category_tip.html(msg);
      var self = this;
      setTimeout(function() {
        self.$category.removeClass('error');
        self.$category_tip.removeClass('error');
        self._showTip();
      }, 3000);
    }
  });
  return View;
});