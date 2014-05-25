define([ "js/common/moduleRunner", "modules/del_category/index", "modules/headbar/index" ], function(ModuleRunner, del_category, headbar) {
    var modules = {
        del_category: del_category,
        headbar: headbar
    };
    ModuleRunner.run(modules);
});