jade.templates = jade.templates || {};
jade.templates['index'] = (function(){
  return function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div data-module=\"num_keyboard\" class=\"num_keyboard\"><ul class=\"keys\"><li class=\"key num\"><a href=\"#\">1</a></li><li class=\"key num\"><a href=\"#\">2</a></li><li class=\"key num\"><a href=\"#\">3</a></li><li class=\"key del\"><a href=\"#\"><-</a></li><li class=\"key num\"><a href=\"#\">4</a></li><li class=\"key num\"><a href=\"#\">5</a></li><li class=\"key num\"><a href=\"#\">6</a></li><li class=\"key clear\"><a href=\"#\">C</a></li><li class=\"key num\"><a href=\"#\">7</a></li><li class=\"key num\"><a href=\"#\">8</a></li><li class=\"key num\"><a href=\"#\">9</a></li><li class=\"key num\"><a href=\"#\">.</a></li><li class=\"key num zero\"><a href=\"#\">0</a></li><li class=\"key ok\"><a href=\"#\">确定</a></li></ul></div>");;return buf.join("");
};
})();