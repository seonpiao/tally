define([ "js/common/moduleRunner", "modules/del_keyword/index", "modules/headbar/index" ], function(ModuleRunner, del_keyword, headbar) {
    var modules = {
        del_keyword: del_keyword,
        headbar: headbar
    };
    ModuleRunner.run(modules);
});