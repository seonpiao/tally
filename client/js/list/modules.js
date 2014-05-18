define([ "js/common/moduleRunner", "modules/del_tally/index", "modules/headbar/index" ], function(ModuleRunner, del_tally, headbar) {
    var modules = {
        del_tally: del_tally,
        headbar: headbar
    };
    ModuleRunner.run(modules);
});