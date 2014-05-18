define([ "js/common/moduleRunner", "modules/headbar/index", "modules/state_bar/index", "modules/num_keyboard/index" ], function(ModuleRunner, headbar, state_bar, num_keyboard) {
    var modules = {
        headbar: headbar,
        state_bar: state_bar,
        num_keyboard: num_keyboard
    };
    ModuleRunner.run(modules);
});