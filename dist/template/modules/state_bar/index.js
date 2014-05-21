jade.templates = jade.templates || {};
jade.templates['index'] = (function(){
  return function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (keyword) {
buf.push("<div data-module=\"state_bar\" class=\"state_bar\"><span class=\"keyword\">" + (jade.escape(null == (jade_interp = (typeof keyword !== 'undefined' ? keyword.keyword :'')) ? "" : jade_interp)) + "</span><span class=\"type\">支出</span><div class=\"cost\">0</div></div>");}("keyword" in locals_for_with?locals_for_with.keyword:typeof keyword!=="undefined"?keyword:undefined));;return buf.join("");
};
})();