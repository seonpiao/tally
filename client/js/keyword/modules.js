define([ "js/common/moduleRunner", "modules/headbar/index", "modules/add_keyword/index" ], function(ModuleRunner, headbar, add_keyword) {
    var modules = {
        headbar: headbar,
        add_keyword: add_keyword
    };
    ModuleRunner.run(modules);
});