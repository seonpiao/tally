jade.templates = jade.templates || {};
jade.templates['tmpl'] = (function(){
  return function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (keyword) {
buf.push("<span class=\"type\">支出</span><span class=\"keyword\">" + (jade.escape(null == (jade_interp = (typeof keyword !== 'undefined' ? keyword.keyword :'')) ? "" : jade_interp)) + "</span><span class=\"cost\"></span>");}("keyword" in locals_for_with?locals_for_with.keyword:typeof keyword!=="undefined"?keyword:undefined));;return buf.join("");
};
})();