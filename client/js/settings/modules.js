define([ "js/common/moduleRunner", "modules/headbar/index" ], function(ModuleRunner, headbar) {
    var modules = {
        headbar: headbar
    };
    ModuleRunner.run(modules);
});