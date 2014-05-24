jade.templates = jade.templates || {};
jade.templates['index'] = (function(){
  return function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (categories, decodeURIComponent) {
buf.push("<div data-module=\"add_keyword\" class=\"add_keyword\"><div class=\"row\"><input id=\"keyword\" type=\"text\" placeholder=\"消费项目\"/><span data-tip=\"例如：午餐、加油\" class=\"tip\"></span></div><div class=\"row\"><select id=\"category\"><option>选择分类</option>");
// iterate categories
;(function(){
  var $$obj = categories;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var item = $$obj[$index];

buf.push("<option>" + (jade.escape(null == (jade_interp = decodeURIComponent(item.category)) ? "" : jade_interp)) + "</option>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var item = $$obj[$index];

buf.push("<option>" + (jade.escape(null == (jade_interp = decodeURIComponent(item.category)) ? "" : jade_interp)) + "</option>");
    }

  }
}).call(this);

buf.push("<option class=\"create\">创建新分类</option></select><span data-tip=\"例如：餐饮、交通\" class=\"tip\"></span></div><div class=\"row\"><a class=\"btn small-btn\">确定</a></div></div>");}("categories" in locals_for_with?locals_for_with.categories:typeof categories!=="undefined"?categories:undefined,"decodeURIComponent" in locals_for_with?locals_for_with.decodeURIComponent:typeof decodeURIComponent!=="undefined"?decodeURIComponent:undefined));;return buf.join("");
};
})();