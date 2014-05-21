jade.templates = jade.templates || {};
jade.templates['index'] = (function(){
  return function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (categories, decodeURIComponent) {
buf.push("<div data-module=\"add_keyword\" class=\"add_keyword\"><input id=\"keyword\" type=\"text\" placeholder=\"关键字\"/><select id=\"category\"><option>选择分类</option>");
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

buf.push("<option>新分类</option></select><a onclick=\"javascript:if(document.getElementById('category').selectedIndex === 0){alert('必须选择一个分类');return;}if(document.getElementById('keyword').value === ''){alert('必须输入关键词');return;}location.href='/cost/' + document.getElementById('keyword').value + '/' + document.getElementById('category').value\" class=\"btn small-btn\">确定</a></div>");}("categories" in locals_for_with?locals_for_with.categories:typeof categories!=="undefined"?categories:undefined,"decodeURIComponent" in locals_for_with?locals_for_with.decodeURIComponent:typeof decodeURIComponent!=="undefined"?decodeURIComponent:undefined));;return buf.join("");
};
})();