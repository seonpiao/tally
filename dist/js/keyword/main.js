
/* @source js/libs/oz.js */;

/**
 * OzJS: microkernel for modular javascript
 * compatible with AMD (Asynchronous Module Definition)
 * see http://ozjs.org for details
 *
 * Copyright (C) 2010-2012, Dexter.Yy, MIT License
 * vim: et:ts=4:sw=4:sts=4
 */
(function() {

    var window = this,
        _toString = Object.prototype.toString,
        _RE_PLUGIN = /(.*)!(.+)/,
        _RE_DEPS = /\Wrequire\((['"]).+?\1\)/g,
        _RE_SUFFIX = /\.(js|json)$/,
        _RE_RELPATH = /^\.+?\/.+/,
        _RE_DOT = /(^|\/)\.\//g,
        _RE_ALIAS_IN_MID = /^([\w\-]+)\//,
        _builtin_mods = {
            "require": 1,
            "exports": 1,
            "module": 1,
            "host": 1,
            "finish": 1
        },

        _config = {
            mods: {}
        },
        _scripts = {},
        _delays = {},
        _refers = {},
        _waitings = {},
        _latest_mod,
        _scope,
        _resets = {},

        forEach = Array.prototype.forEach || function(fn, sc) {
            for (var i = 0, l = this.length; i < l; i++) {
                if (i in this)
                    fn.call(sc, this[i], i, this);
            }
        };

    /**
     * @public define / register a module and its meta information
     * @param {string} module name. optional as unique module in a script file
     * @param {string[]} dependencies
     * @param {function} module code, execute only once on the first call
     *
     * @note
     *
     * define('', [""], func)
     * define([""], func)
     * define('', func)
     * define(func)
     *
     * define('', "")
     * define('', [""], "")
     * define('', [""])
     *
     */
    function define(name, deps, block) {
        var is_remote = typeof block === 'string';
        if (!block) {
            if (deps) {
                if (isArray(deps)) {
                    block = filesuffix(realname(basename(name)));
                } else {
                    block = deps;
                    deps = null;
                }
            } else {
                block = name;
                name = "";
            }
            if (typeof name !== 'string') {
                deps = name;
                name = "";
            } else {
                is_remote = typeof block === 'string';
                if (!is_remote && !deps) {
                    deps = seek(block);
                }
            }
        }
        name = name && realname(name);
        var mod = name && _config.mods[name];
        if (!_config.debug && mod && mod.name && (is_remote && mod.loaded == 2 || mod.exports)) {
            return;
        }
        if (is_remote && _config.enable_ozma) {
            deps = null;
        }
        var host = isWindow(this) ? this : window;
        mod = _config.mods[name] = {
            name: name,
            url: mod && mod.url,
            host: host,
            deps: deps || []
        };
        if (name === "") { // capture anonymous module
            _latest_mod = mod;
        }
        if (typeof block !== 'string') {
            mod.block = block;
            mod.loaded = 2;
        } else { // remote module
            var alias = _config.aliases;
            if (alias) {
                block = block.replace(/\{(\w+)\}/g, function(e1, e2) {
                    return alias[e2] || "";
                });
            }
            mod.url = block;
        }
        if (mod.block && !isFunction(mod.block)) { // json module
            mod.exports = block;
        }
    }

    /**
     * @public run a code block its dependencies
     * @param {string[]} [module name] dependencies
     * @param {function}
     */
    function require(deps, block, _self_mod) {
        if (typeof deps === 'string') {
            if (!block) {
                return (_config.mods[realname(basename(deps, _scope))] || {}).exports;
            }
            deps = [deps];
        } else if (!block) {
            block = deps;
            deps = seek(block);
        }
        var host = isWindow(this) ? this : window;
        if (!_self_mod) {
            _self_mod = {
                url: _scope && _scope.url
            };
        }
        var m, remotes = 0, // counter for remote scripts
            list = scan.call(host, deps, _self_mod); // calculate dependencies, find all required modules
        for (var i = 0, l = list.length; i < l; i++) {
            m = list[i];
            if (m.is_reset) {
                m = _config.mods[m.name];
            }
            if (m.url && m.loaded !== 2) { // remote module
                remotes++;
                m.loaded = 1; // status: loading
                fetch(m, function() {
                    this.loaded = 2; // status: loaded 
                    var lm = _latest_mod;
                    if (lm) { // capture anonymous module
                        lm.name = this.name;
                        lm.url = this.url;
                        _config.mods[this.name] = lm;
                        _latest_mod = null;
                    }
                    // loaded all modules, calculate dependencies all over again
                    if (--remotes <= 0) {
                        require.call(host, deps, block, _self_mod);
                    }
                });
            }
        }
        if (!remotes) {
            _self_mod.deps = deps;
            _self_mod.host = host;
            _self_mod.block = block;
            setTimeout(function() {
                tidy(deps, _self_mod);
                list.push(_self_mod);
                exec(list.reverse());
            }, 0);
        }
    }

    /**
     * @private execute modules in a sequence of dependency
     * @param {object[]} [module object]
     */
    function exec(list) {
        var mod, mid, tid, result, isAsync, deps,
            depObjs, exportObj, moduleObj, rmod,
            wt = _waitings;
        while (mod = list.pop()) {
            if (mod.is_reset) {
                rmod = clone(_config.mods[mod.name]);
                rmod.host = mod.host;
                rmod.newname = mod.newname;
                mod = rmod;
                if (!_resets[mod.newname]) {
                    _resets[mod.newname] = [];
                }
                _resets[mod.newname].push(mod);
                mod.exports = undefined;
            } else if (mod.name) {
                mod = _config.mods[mod.name] || mod;
            }
            if (!mod.block || !mod.running && mod.exports !== undefined) {
                continue;
            }
            depObjs = [];
            exportObj = {}; // for "exports" module
            moduleObj = {
                id: mod.name,
                filename: mod.url,
                exports: exportObj
            };
            deps = mod.deps.slice();
            deps[mod.block.hiddenDeps ? 'unshift' : 'push']("require", "exports", "module");
            for (var i = 0, l = deps.length; i < l; i++) {
                mid = deps[i];
                switch (mid) {
                    case 'require':
                        depObjs.push(require);
                        break;
                    case 'exports':
                        depObjs.push(exportObj);
                        break;
                    case 'module':
                        depObjs.push(moduleObj);
                        break;
                    case 'host': // deprecated
                        depObjs.push(mod.host);
                        break;
                    case 'finish': // execute asynchronously
                        tid = mod.name;
                        if (!wt[tid]) // for delay execute
                            wt[tid] = [list];
                        else
                            wt[tid].push(list);
                        depObjs.push(function(result) {
                            // HACK: no guarantee that this function will be invoked after while() loop termination in Chrome/Safari 
                            setTimeout(function() {
                                // 'mod' equal to 'list[list.length-1]'
                                if (result !== undefined) {
                                    mod.exports = result;
                                }
                                if (!wt[tid])
                                    return;
                                forEach.call(wt[tid], function(list) {
                                    this(list);
                                }, exec);
                                delete wt[tid];
                                mod.running = 0;
                            }, 0);
                        });
                        isAsync = 1;
                        break;
                    default:
                        depObjs.push((
                            (_resets[mid] || []).pop() || _config.mods[realname(mid)] || {}
                        ).exports);
                        break;
                }
            }
            if (!mod.running) {
                // execute module code. arguments: [dep1, dep2, ..., require, exports, module]
                _scope = mod;
                result = mod.block.apply(mod.host, depObjs) || null;
                _scope = false;
                exportObj = moduleObj.exports;
                mod.exports = result !== undefined ? result : exportObj; // use empty exportObj for "finish"
                for (var v in exportObj) {
                    if (v) {
                        mod.exports = exportObj;
                    }
                    break;
                }
            }
            if (isAsync) { // skip, wait for finish() 
                mod.running = 1;
                break;
            }
        }
    }

    /**
     * @private observer for script loader, prevent duplicate requests
     * @param {object} module object
     * @param {function} callback
     */
    function fetch(m, cb) {
        var url = m.url,
            observers = _scripts[url];
        if (!observers) {
            var mname = m.name,
                delays = _delays;
            if (m.deps && m.deps.length && delays[mname] !== 1) {
                delays[mname] = [m.deps.length, cb];
                m.deps.forEach(function(dep) {
                    var d = _config.mods[realname(dep)];
                    if (this[dep] !== 1 && d.url && d.loaded !== 2) {
                        if (!this[dep]) {
                            this[dep] = [];
                        }
                        this[dep].push(m);
                    } else {
                        delays[mname][0]--;
                    }
                }, _refers);
                if (delays[mname][0] > 0) {
                    return;
                } else {
                    delays[mname] = 1;
                }
            }
            observers = _scripts[url] = [
                [cb, m]
            ];
            var true_url = /^\w+:\/\//.test(url) ? url : (_config.enable_ozma && _config.distUrl || _config.baseUrl || '') + (_config.enableAutoSuffix ? namesuffix(url) : url);
            getScript.call(m.host || this, true_url, function() {
                forEach.call(observers, function(args) {
                    args[0].call(args[1]);
                });
                _scripts[url] = 1;
                if (_refers[mname] && _refers[mname] !== 1) {
                    _refers[mname].forEach(function(dm) {
                        var b = this[dm.name];
                        if (--b[0] <= 0) {
                            this[dm.name] = 1;
                            fetch(dm, b[1]);
                        }
                    }, delays);
                    _refers[mname] = 1;
                }
            });
        } else if (observers === 1) {
            cb.call(m);
        } else {
            observers.push([cb, m]);
        }
    }

    /**
     * @private search and sequence all dependencies, based on DFS
     * @param {string[]} a set of module names
     * @param {object[]}
     * @param {object[]} a sequence of modules, for recursion
     * @return {object[]} a sequence of modules
     */
    function scan(m, file_mod, list) {
        list = list || [];
        if (!m[0]) {
            return list;
        }
        var deps,
            history = list.history;
        if (!history) {
            history = list.history = {};
        }
        if (m[1]) {
            deps = m;
            m = false;
        } else {
            var truename,
                _mid = m[0],
                plugin = _RE_PLUGIN.exec(_mid);
            if (plugin) {
                _mid = plugin[2];
                plugin = plugin[1];
            }
            var mid = realname(_mid);
            if (!_config.mods[mid] && !_builtin_mods[mid]) {
                var true_mid = realname(basename(_mid, file_mod));
                if (mid !== true_mid) {
                    _config.mods[file_mod.url + ':' + mid] = true_mid;
                    mid = true_mid;
                }
                if (!_config.mods[true_mid]) {
                    define(true_mid, filesuffix(true_mid));
                }
            }
            m = file_mod = _config.mods[mid];
            if (m) {
                if (plugin === "new") {
                    m = {
                        is_reset: true,
                        deps: m.deps,
                        name: mid,
                        newname: plugin + "!" + mid,
                        host: this
                    };
                } else {
                    truename = m.name;
                }
                if (history[truename]) {
                    return list;
                }
            } else {
                return list;
            }
            if (!history[truename]) {
                deps = m.deps || [];
                // find require information within the code
                // for server-side style module
                //deps = deps.concat(seek(m));
                if (truename) {
                    history[truename] = true;
                }
            } else {
                deps = [];
            }
        }
        for (var i = deps.length - 1; i >= 0; i--) {
            if (!history[deps[i]]) {
                scan.call(this, [deps[i]], file_mod, list);
            }
        }
        if (m) {
            tidy(deps, m);
            list.push(m);
        }
        return list;
    }

    /**
     * @experiment
     * @private analyse module code
     *          to find out dependencies which have no explicit declaration
     * @param {object} module object
     */
    function seek(block) {
        var hdeps = block.hiddenDeps || [];
        if (!block.hiddenDeps) {
            var code = block.toString(),
                h = null;
            hdeps = block.hiddenDeps = [];
            while (h = _RE_DEPS.exec(code)) {
                hdeps.push(h[0].slice(10, -2));
            }
        }
        return hdeps.slice();
    }

    function tidy(deps, m) {
        forEach.call(deps.slice(), function(dep, i) {
            var true_mid = this[m.url + ':' + realname(dep)];
            if (typeof true_mid === 'string') {
                deps[i] = true_mid;
            }
        }, _config.mods);
    }

    function config(opt) {
        for (var i in opt) {
            if (i === 'aliases') {
                if (!_config[i]) {
                    _config[i] = {};
                }
                for (var j in opt[i]) {
                    _config[i][j] = opt[i][j];
                }
                var mods = _config.mods;
                for (var k in mods) {
                    mods[k].name = realname(k);
                    mods[mods[k].name] = mods[k];
                }
            } else {
                _config[i] = opt[i];
            }
        }
    }

    /**
     * @note naming pattern:
     * _g_src.js
     * _g_combo.js
     *
     * jquery.js
     * jquery_pack.js
     *
     * _yy_src.pack.js
     * _yy_combo.js
     *
     * _yy_bak.pack.js
     * _yy_bak.pack_pack.js
     */
    function namesuffix(file) {
        return file.replace(/(.+?)(_src.*)?(\.\w+)$/, function($0, $1, $2, $3) {
            return $1 + ($2 && '_combo' || '_pack') + $3;
        });
    }

    function filesuffix(mid) {
        return _RE_SUFFIX.test(mid) ? mid : mid + '.js';
    }

    function realname(mid) {
        var alias = _config.aliases;
        if (alias) {
            mid = mid.replace(_RE_ALIAS_IN_MID, function(e1, e2) {
                return alias[e2] || (e2 + '/');
            });
        }
        return mid;
    }

    function basename(mid, file_mod) {
        var rel_path = _RE_RELPATH.exec(mid);
        if (rel_path && file_mod) { // resolve relative path in Module ID
            mid = (file_mod.url || '').replace(/[^\/]+$/, '') + rel_path[0];
        }
        return resolvename(mid);
    }

    function resolvename(url) {
        url = url.replace(_RE_DOT, '$1');
        var dots, dots_n, url_dup = url,
            RE_DOTS = /(\.\.\/)+/g;
        while (dots = (RE_DOTS.exec(url_dup) || [])[0]) {
            dots_n = dots.match(/\.\.\//g).length;
            url = url.replace(new RegExp('([^/\\.]+/){' + dots_n + '}' + dots), '');
        }
        return url.replace(/\/\//g, '/');
    }

    /**
     * @public non-blocking script loader
     * @param {string}
     * @param {object} config
     */
    function getScript(url, op) {
        var doc = isWindow(this) ? this.document : document,
            s = doc.createElement("script");
        s.type = "text/javascript";
        s.async = "async"; //for firefox3.6
        if (!op)
            op = {};
        else if (isFunction(op))
            op = {
                callback: op
            };
        if (op.charset)
            s.charset = op.charset;
        s.src = url;
        var h = doc.getElementsByTagName("head")[0];
        s.onload = s.onreadystatechange = function(__, isAbort) {
            if (isAbort || !s.readyState || /loaded|complete/.test(s.readyState)) {
                s.onload = s.onreadystatechange = null;
                if (h && s.parentNode) {
                    h.removeChild(s);
                }
                s = undefined;
                if (!isAbort && op.callback) {
                    op.callback();
                }
            }
        };
        h.insertBefore(s, h.firstChild);
    }

    function isFunction(obj) {
        return _toString.call(obj) === "[object Function]";
    }

    function isArray(obj) {
        return _toString.call(obj) === "[object Array]";
    }

    function isWindow(obj) {
        return "setInterval" in obj;
    }

    function clone(obj) { // be careful of using `delete`
        function NewObj() {}
        NewObj.prototype = obj;
        return new NewObj();
    }

    var oz = {
        VERSION: '2.5.1',
        define: define,
        require: require,
        config: config,
        seek: seek,
        fetch: fetch,
        realname: realname,
        basename: basename,
        filesuffix: filesuffix,
        namesuffix: namesuffix,
        // non-core
        _getScript: getScript,
        _clone: clone,
        _forEach: forEach,
        _isFunction: isFunction,
        _isWindow: isWindow
    };

    require.config = config;
    define.amd = {
        jQuery: true
    };

    if (!window.window) { // for nodejs
        exports.oz = oz;
        exports._config = _config;
        // hook for build tool
        for (var i in oz) {
            exports[i] = oz[i];
        }
        var hooking = function(fname) {
            return function() {
                return exports[fname].apply(this, arguments);
            };
        };
        exec = hooking('exec');
        fetch = hooking('fetch');
        require = hooking('require');
        require.config = config;
    } else {
        window.oz = oz;
        window.define = define;
        window.require = require;
    }

})();
require.config({ enable_ozma: true });


/* @source js/libs/jquery.popupoverlay.js */;

/*!
 * jQuery Popup Overlay
 *
 * @version 1.6.3
 * @requires jQuery v1.7.1+
 * @link http://vast-engineering.github.com/jquery-popup-overlay/
 */
;
(function($) {

    var $window = $(window);
    var options = {};
    var zindexvalues = [];
    var lastclicked = [];
    var scrollbarwidth;
    var bodymarginright = null;
    var opensuffix = '_open';
    var closesuffix = '_close';
    var stack = [];
    var transitionSupport = null;

    var methods = {

        _init: function(el) {
            var $el = $(el);
            var options = $el.data('popupoptions');
            lastclicked[el.id] = false;
            zindexvalues[el.id] = 0;

            if (!$el.data('popup-initialized')) {
                $el.attr('data-popup-initialized', 'true');
                methods._initonce(el);
            }

            if (options.autoopen) {
                setTimeout(function() {
                    methods.show(el, 0);
                }, 0);
            }
        },

        _initonce: function(el) {
            var $body = $('body'),
                $wrapper,
                options = $el.data('popupoptions'),
                css;
            bodymarginright = parseInt($body.css('margin-right'), 10);
            transitionSupport = document.body.style.webkitTransition !== undefined ||
                document.body.style.MozTransition !== undefined ||
                document.body.style.msTransition !== undefined ||
                document.body.style.OTransition !== undefined ||
                document.body.style.transition !== undefined;

            if (options.type == 'tooltip') {
                options.background = false;
                options.scrolllock = false;
            }

            if (options.backgroundactive) {
                options.background = false;
                options.blur = false;
                options.scrolllock = false;
            }

            if (options.scrolllock) {
                // Calculate the browser's scrollbar width dynamically
                var parent;
                var child;
                if (typeof scrollbarwidth === 'undefined') {
                    parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body');
                    child = parent.children();
                    scrollbarwidth = child.innerWidth() - child.height(99).innerWidth();
                    parent.remove();
                }
            }

            if (!$el.attr('id')) {
                $el.attr('id', 'j-popup-' + parseInt((Math.random() * 100000000), 10));
            }

            $el.addClass('popup_content');

            $body.append(el);

            $el.wrap('<div id="' + el.id + '_wrapper" class="popup_wrapper" />');

            $wrapper = $('#' + el.id + '_wrapper');

            $wrapper.css({
                opacity: 0,
                visibility: 'hidden',
                position: 'absolute'
            });

            if (options.type == 'overlay') {
                $wrapper.css({
                    overflow: 'auto'
                });
            }

            $el.css({
                opacity: 0,
                visibility: 'hidden',
                display: 'inline-block'
            });

            if (options.setzindex && !options.autozindex) {
                $wrapper.css('z-index', '100001');
            }

            if (!options.outline) {
                $el.css('outline', 'none');
            }

            if (options.transition) {
                $el.css('transition', options.transition);
                $wrapper.css('transition', options.transition);
            }

            // Hide popup content from screen readers initially
            $(el).attr('aria-hidden', true);

            if ((options.background) && (!$('#' + el.id + '_background').length)) {

                var popupbackground = '<div id="' + el.id + '_background" class="popup_background"></div>';

                $body.prepend(popupbackground);

                var $background = $('#' + el.id + '_background');

                $background.css({
                    opacity: 0,
                    visibility: 'hidden',
                    backgroundColor: options.color,
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                });

                if (options.setzindex && !options.autozindex) {
                    $background.css('z-index', '100000');
                }

                if (options.transition) {
                    $background.css('transition', options.transition);
                }
            }

            if (options.type == 'overlay') {
                $el.css({
                    textAlign: 'left',
                    position: 'relative',
                    verticalAlign: 'middle'
                });

                css = {
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    left: 0,
                    bottom: 0,
                    textAlign: 'center'
                };

                if (options.backgroundactive) {
                    css.position = 'relative';
                    css.height = '0';
                    css.overflow = 'visible';
                }

                $wrapper.css(css);

                // CSS vertical align helper
                $wrapper.append('<div class="popup_align" />');

                $('.popup_align').css({
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    height: '100%'
                });
            }

            // Add WAI ARIA role to announce dialog to screen readers
            $el.attr('role', 'dialog');

            var openelement = (options.openelement) ? options.openelement : ('.' + el.id + opensuffix);

            $(openelement).each(function(i, item) {
                $(item).attr('data-popup-ordinal', i);

                if (!$(item).attr('id')) {
                    $(item).attr('id', 'open_' + parseInt((Math.random() * 100000000), 10));
                }
            });

            // Set aria-labelledby (if aria-label or aria-labelledby is not set in html)
            if (!($el.attr('aria-labelledby') || $el.attr('aria-label'))) {
                $el.attr('aria-labelledby', $(openelement).attr('id'));
            }

            // $(document).on('click', openelement, function (event) {
            //     if (!($el.data('popup-visible'))) {
            //         var ord = $(this).data('popup-ordinal');

            //         // Show element when clicked on `open` link.
            //         // setTimeout is to allow `close` method to finish (for issues with multiple tooltips)
            //         setTimeout(function() {
            //             methods.show(el, ord);
            //         }, 0);

            //         event.preventDefault();
            //     }
            // });

            if (options.detach) {
                $el.hide().detach();
            } else {
                $wrapper.hide();
            }
        },

        /**
         * Show method
         *
         * @param {object} el - popup instance DOM node
         * @param {number} ordinal - order number of an `open` element
         */
        show: function(el, ordinal) {
            var $el = $(el);

            if ($el.data('popup-visible')) return;

            // Initialize if not initialized. Required for: $('#popup').popup('show')
            if (!$el.data('popup-initialized')) {
                methods._init(el);
            }
            $el.attr('data-popup-initialized', 'true');

            var $body = $('body');
            var options = $el.data('popupoptions');
            var $wrapper = $('#' + el.id + '_wrapper');
            var $background = $('#' + el.id + '_background');

            // `beforeopen` callback event
            callback(el, ordinal, options.beforeopen);

            // Remember last clicked place
            lastclicked[el.id] = ordinal;

            // Add popup id to popup stack
            stack.push(el.id);

            // Calculating maximum z-index
            if (options.autozindex) {

                var elements = document.getElementsByTagName('*');
                var len = elements.length;
                var maxzindex = 0;

                for (var i = 0; i < len; i++) {

                    var elementzindex = $(elements[i]).css('z-index');

                    if (elementzindex !== 'auto') {

                        elementzindex = parseInt(elementzindex, 10);

                        if (maxzindex < elementzindex) {
                            maxzindex = elementzindex;
                        }
                    }
                }

                zindexvalues[el.id] = maxzindex;

                // Add z-index to the background
                if (options.background) {
                    if (zindexvalues[el.id] > 0) {
                        $('#' + el.id + '_background').css({
                            zIndex: (zindexvalues[el.id] + 1)
                        });
                    }
                }

                // Add z-index to the wrapper
                if (zindexvalues[el.id] > 0) {
                    $wrapper.css({
                        zIndex: (zindexvalues[el.id] + 2)
                    });
                }

            }

            if (options.detach) {
                $wrapper.prepend(el);
                $el.show();
            } else {
                $wrapper.show();
            }

            setTimeout(function() {
                $wrapper.css({
                    visibility: 'visible',
                    opacity: 1
                });

                $('html').addClass('popup_visible').addClass('popup_visible_' + el.id);
                $el.addClass('popup_content_visible');
            }, 20);

            // Disable background layer scrolling when popup is opened
            if (options.scrolllock) {
                $body.css('overflow', 'hidden');
                if ($body.height() > $window.height()) {
                    $body.css('margin-right', bodymarginright + scrollbarwidth);
                }
            }

            if (options.backgroundactive) {
                //calculates the vertical align
                $el.css({
                    top: (
                        $(window).height() - (
                            $el.get(0).offsetHeight +
                            parseInt($el.css('margin-top'), 10) +
                            parseInt($el.css('margin-bottom'), 10)
                        )
                    ) / 2 + 'px',
                });
            }

            $el.css({
                'visibility': 'visible',
                'opacity': 1
            });

            // Show background
            if (options.background) {
                $background.css({
                    'visibility': 'visible',
                    'opacity': options.opacity
                });

                // Fix IE8 issue with background not appearing
                setTimeout(function() {
                    $background.css({
                        'opacity': options.opacity
                    });
                }, 0);
            }

            $el.data('popup-visible', true);

            // Position popup
            methods.reposition(el, ordinal);

            // Remember which element had focus before opening a popup
            $el.data('focusedelementbeforepopup', document.activeElement);

            // Handler: Keep focus inside dialog box
            if (options.keepfocus) {
                // Make holder div focusable
                $el.attr('tabindex', -1);

                // Focus popup or user specified element.
                // Initial timeout of 50ms is set to give some time to popup to show after clicking on
                // `open` element, and after animation is complete to prevent background scrolling.
                setTimeout(function() {
                    if (options.focuselement === 'closebutton') {
                        $('#' + el.id + ' .' + el.id + closesuffix + ':first').focus();
                    } else if (options.focuselement) {
                        $(options.focuselement).focus();
                    } else {
                        $el.focus();
                    }
                }, options.focusdelay);

            }

            // Hide main content from screen readers
            $(options.pagecontainer).attr('aria-hidden', true);

            // Reveal popup content to screen readers
            $el.attr('aria-hidden', false);

            callback(el, ordinal, options.onopen);

            if (transitionSupport) {
                $wrapper.one('transitionend', function() {
                    callback(el, ordinal, options.opentransitionend);
                });
            } else {
                callback(el, ordinal, options.opentransitionend);
            }
        },

        /**
         * Hide method
         *
         * @param {object} el - popup instance DOM node
         */
        hide: function(el) {

            var $body = $('body');
            var $el = $(el);
            var options = $el.data('popupoptions');
            var $wrapper = $('#' + el.id + '_wrapper');
            var $background = $('#' + el.id + '_background');

            $el.data('popup-visible', false);

            // Remove last opened popup from the stack

            var index = stack.indexOf(el.id);
            if (index !== -1) {
                stack.splice(index, 1);
            }

            if (stack.length === 0) {
                $('html').removeClass('popup_visible').removeClass('popup_visible_' + el.id);
            } else {
                $('html').removeClass('popup_visible_' + el.id);
            }

            $el.removeClass('popup_content_visible');

            if (options.keepfocus) {
                // Focus back on saved element
                setTimeout(function() {
                    if ($($el.data('focusedelementbeforepopup')).is(':visible')) {
                        $el.data('focusedelementbeforepopup').focus();
                    }
                }, 0);
            }

            // Hide popup
            $wrapper.css({
                'visibility': 'hidden',
                'opacity': 0
            });
            $el.css({
                'visibility': 'hidden',
                'opacity': 0
            });

            // Hide background
            if (options.background) {
                $background.css({
                    'visibility': 'hidden',
                    'opacity': 0
                });
            }

            // Reveal main content to screen readers
            $(options.pagecontainer).attr('aria-hidden', false);

            // Hide popup content from screen readers
            $el.attr('aria-hidden', true);

            // `onclose` callback event
            callback(el, lastclicked[el.id], options.onclose);

            if (transitionSupport) {
                $el.one('transitionend', function(e) {

                    if (!($el.data('popup-visible'))) {
                        if (options.detach) {
                            $el.hide().detach();
                        } else {
                            $wrapper.hide();
                        }
                    }

                    // Re-enable scrolling of background layer
                    if (options.scrolllock) {
                        setTimeout(function() {
                            $body.css({
                                overflow: 'visible',
                                'margin-right': bodymarginright
                            });
                        }, 10); // 10ms added for CSS transition in Firefox which doesn't like overflow:auto
                    }

                    callback(el, lastclicked[el.id], options.closetransitionend);
                });
            } else {
                if (options.detach) {
                    $el.hide().detach();
                } else {
                    $wrapper.hide();
                }

                // Re-enable scrolling of background layer
                if (options.scrolllock) {
                    setTimeout(function() {
                        $body.css({
                            overflow: 'visible',
                            'margin-right': bodymarginright
                        });
                    }, 10); // 10ms added for CSS transition in Firefox which doesn't like overflow:auto
                }

                callback(el, lastclicked[el.id], options.closetransitionend);
            }

        },

        /**
         * Toggle method
         *
         * @param {object} el - popup instance DOM node
         * @param {number} ordinal - order number of an `open` element
         */
        toggle: function(el, ordinal) {
            if ($el.data('popup-visible')) {
                methods.hide(el);
            } else {
                setTimeout(function() {
                    methods.show(el, ordinal);
                }, 0);
            }
        },

        /**
         * Reposition method
         *
         * @param {object} el - popup instance DOM node
         * @param {number} ordinal - order number of an `open` element
         */
        reposition: function(el, ordinal) {
            var $el = $(el);
            var options = $el.data('popupoptions');
            var $wrapper = $('#' + el.id + '_wrapper');
            var $background = $('#' + el.id + '_background');

            ordinal = ordinal || 0;

            // Tooltip type
            if (options.type == 'tooltip') {
                $wrapper.css({
                    'position': 'absolute'
                });

                var $elementclicked;
                if (options.triggerevent) {
                    $elementclicked = $(options.triggerevent.target);
                } else if (options.openelement) {
                    $elementclicked = $(options.openelement).filter('[data-popup-ordinal="' + ordinal + '"]');
                } else {
                    $elementclicked = $('.' + el.id + opensuffix + '[data-popup-ordinal="' + ordinal + '"]');
                }

                var linkOffset = $elementclicked.offset();

                // Horizontal position for tooltip
                if (options.horizontal == 'right') {
                    $wrapper.css('left', linkOffset.left + $elementclicked.outerWidth() + options.offsetleft);
                } else if (options.horizontal == 'leftedge') {
                    $wrapper.css('left', linkOffset.left + $elementclicked.outerWidth() - $elementclicked.outerWidth() + options.offsetleft);
                } else if (options.horizontal == 'left') {
                    $wrapper.css('right', $(window).width() - linkOffset.left - options.offsetleft);
                } else if (options.horizontal == 'rightedge') {
                    $wrapper.css('right', $(window).width() - linkOffset.left - $elementclicked.outerWidth() - options.offsetleft);
                } else {
                    $wrapper.css('left', linkOffset.left + ($elementclicked.outerWidth() / 2) - ($el.outerWidth() / 2) - parseFloat($el.css('marginLeft')) + options.offsetleft);
                }

                // Vertical position for tooltip
                if (options.vertical == 'bottom') {
                    $wrapper.css('top', linkOffset.top + $elementclicked.outerHeight() + options.offsettop);
                } else if (options.vertical == 'bottomedge') {
                    $wrapper.css('top', linkOffset.top + $elementclicked.outerHeight() - $el.outerHeight() + options.offsettop);
                } else if (options.vertical == 'top') {
                    $wrapper.css('bottom', $(window).height() - linkOffset.top - options.offsettop);
                } else if (options.vertical == 'topedge') {
                    $wrapper.css('bottom', $(window).height() - linkOffset.top - $el.outerHeight() - options.offsettop);
                } else {
                    $wrapper.css('top', linkOffset.top + ($elementclicked.outerHeight() / 2) - ($el.outerHeight() / 2) - parseFloat($el.css('marginTop')) + options.offsettop);
                }

                // Overlay type
            } else if (options.type == 'overlay') {

                // Horizontal position for overlay
                if (options.horizontal) {
                    $wrapper.css('text-align', options.horizontal);
                } else {
                    $wrapper.css('text-align', 'center');
                }

                // Vertical position for overlay
                if (options.vertical) {
                    $el.css('vertical-align', options.vertical);
                } else {
                    $el.css('vertical-align', 'middle');
                }
            }
        }

    };

    /**
     * Callback event calls
     *
     * @param {object} el - popup instance DOM node
     * @param {number} ordinal - order number of an `open` element
     * @param {function} func - callback function
     */
    var callback = function(el, ordinal, func) {
        var openelement = (options.openelement) ? options.openelement : ('.' + el.id + opensuffix);
        var elementclicked = $(openelement + '[data-popup-ordinal="' + ordinal + '"]');
        if (typeof func == 'function') {
            func(elementclicked);
        }
    };

    // Hide popup if ESC key is pressed
    $(document).on('keydown', function(event) {
        if (stack.length) {
            var elementId = stack[stack.length - 1];
            var el = document.getElementById(elementId);

            if ($(el).data('popupoptions').escape && event.keyCode == 27 && $(el).data('popup-visible')) {
                methods.hide(el);
            }
        }
    });

    // Hide popup if clicked outside of it
    $(document).on('click touchstart', function(event) {
        if (stack.length) {
            var elementId = stack[stack.length - 1];
            var el = document.getElementById(elementId);

            if ($(el).data('popupoptions').blur && !$(event.target).parents().andSelf().is('#' + elementId) && $(el).data('popup-visible') && event.which !== 2) {
                methods.hide(el);

                if ($(el).data('popupoptions').type === 'overlay') {
                    event.preventDefault(); // iPad...
                }
            }
        }
    });

    // Hide popup if `close` element is clicked
    $(document).on('click', function(event) {
        if (stack.length) {
            var elementId = stack[stack.length - 1];
            var el = document.getElementById(elementId);
            var closingelement = ($(el).data('popupoptions').closeelement) ? $(el).data('popupoptions').closeelement : ('.' + elementId + closesuffix);

            if ($(event.target).parents().andSelf().is(closingelement)) {
                event.preventDefault();
                methods.hide(el);
            }
        }
    });

    // Keep keyboard focus inside of popup
    $(document).on('focusin', function(event) {
        if (stack.length) {
            var elementId = stack[stack.length - 1];
            var el = document.getElementById(elementId);

            if ($(el).data('popupoptions').keepfocus) {
                if (!el.contains(event.target)) {
                    event.stopPropagation();
                    el.focus();
                }
            }
        }
    });

    /**
     * Plugin API
     */
    $.fn.popup = function(customoptions) {
        return this.each(function() {

            $el = $(this);

            if (typeof customoptions === 'object') { // e.g. $('#popup').popup({'color':'blue'})
                var opt = $.extend({}, $.fn.popup.defaults, customoptions);
                $el.data('popupoptions', opt);
                options = $el.data('popupoptions');

                methods._init(this);

            } else if (typeof customoptions === 'string') { // e.g. $('#popup').popup('hide')
                if (!($el.data('popupoptions'))) {
                    $el.data('popupoptions', $.fn.popup.defaults);
                    options = $el.data('popupoptions');
                }

                methods[customoptions].call(this, this);

            } else { // e.g. $('#popup').popup()
                if (!($el.data('popupoptions'))) {
                    $el.data('popupoptions', $.fn.popup.defaults);
                    options = $el.data('popupoptions');
                }

                methods._init(this);

            }

        });
    };

    $.fn.popup.defaults = {
        type: 'overlay',
        autoopen: false,
        background: true,
        backgroundactive: false,
        color: 'black',
        opacity: '0.5',
        horizontal: 'center',
        vertical: 'middle',
        offsettop: 0,
        offsetleft: 0,
        escape: true,
        blur: true,
        setzindex: true,
        autozindex: false,
        scrolllock: false,
        keepfocus: true,
        focuselement: null,
        focusdelay: 50,
        outline: false,
        pagecontainer: null,
        detach: false,
        openelement: null,
        closeelement: null,
        transition: null,
        triggerevent: null,
        beforeopen: null,
        onclose: null,
        onopen: null,
        opentransitionend: null,
        closetransitionend: null
    };

})(jQuery);
/* autogeneration */
define("popupoverlay-src", [], function(){});

/* @source js/views/base.js */;

define("js/views/base", function() {
  var templates = {};
  var View = Backbone.View.extend({
    __base: '/template/modules/',
    events: {
      'touchstart a': '__activeHack'
    },
    loadTemplate: function(template, callback) {
      if (arguments.length === 1) {
        callback = template;
        template = null;
      }
      var tmplKey = this.moduleName + '/' + (template || this.template);
      if (templates[tmplKey]) {
        callback(templates[tmplKey]);
      } else {
        $.getScript(this.__base + tmplKey + '.js', function() {
          var keys = Object.keys(jade.templates);
          templates[tmplKey] = jade.templates[keys[0]];
          delete jade.templates[keys[0]];
          callback(templates[tmplKey]);
        }.bind(this));
      }
    },
    $doc: $(document),
    $body: $(document.body),
    initialize: function() {
      this.$el.data('view', this);
      this.$el[0].__view = this;
      this.init.apply(this, arguments);
      this.$el.trigger({
        type: 'viewbind',
        view: this
      });
    },
    init: function() {},
    render: function() {
      var self = this;
      this.buildHtml(function(html) {
        self.$el.html(html);
        self.trigger('afterrender');
      }.bind(this));
    },
    renderTo: function(selector) {
      var self = this;
      this.buildHtml(function(html) {
        self.$el.find(selector).html(html);
        self.trigger('afterrender');
      }.bind(this));
    },
    buildHtml: function(callback) {
      var dataSource = this.model || this.collection;
      var self = this;
      this.loadTemplate(function(template) {
        var renderData = {};
        var originData = dataSource.toJSON();
        if (originData.__combined) {
          renderData = originData
        } else {
          renderData[dataSource.action] = originData;
        }
        callback(template(renderData));
      });
    },
    $: function(selector) {
      return this.$el.find(selector);
    },
    __activeHack: function() {}
  });
  return View;
});
/* @source js/views/interface.js */;

define("js/views/interface", [
  "js/views/base"
], function(Base) {
  var Interface = Base.extend({
    initialize: function(options) {
      this.module = options.module;
      this.setElement(this.createElement());
      Base.prototype.initialize.call(this, options);
    },
    appendTo: function(selector) {
      var elem = $(selector);
      if (elem.length > 0) {
        elem.append(this.$el);
      }
    }
  });
  return Interface;
});
/* @source modules/add_keyword/interfaces/keywordList.js */;

define("modules/add_keyword/interfaces/keywordList", [
  "js/views/interface"
], function(Interface) {
  var View = Interface.extend({
    events: {
      'touchend': 'toggle'
    },
    init: function() {
      this.appendTo('.keywords');
    },
    createElement: function() {
      return $('<li class="plugin"><a href="#" class="icon-plus"></a></li>');
    },
    toggle: function(e) {
      e.preventDefault();
      this.module.toggle();
    }
  });
  return View;
});
/* @source modules/add_keyword/view.js */;

define('popupoverlay-src', 'js/libs/jquery.popupoverlay.js');
define("modules/add_keyword/view", [
  "js/views/base",
  "modules/add_keyword/interfaces/keywordList",
  "popupoverlay-src"
], function(Base, KeywordList) {
  var View = Base.extend({
    moduleName: "add_keyword",
    events: {
      'touchend .btn': '_create',
      'change #category': '_categoryChange'
    },
    init: function() {
      new KeywordList({
        module: this
      });
      this.$keyword = this.$('#keyword');
      this.$category = this.$('#category');
      this.$keyword_tip = this.$keyword.next();
      this.$category_tip = this.$category.next();
      this._showTip();
    },
    toggle: function() {
      this.$el.toggle();
    },
    _showTip: function() {
      var $tips = this.$('[data-tip]');
      $tips.each(function(index, tip) {
        var $tip = $(tip);
        $tip.html($tip.attr('data-tip'));
      })
    },
    _create: function(e) {
      e.preventDefault();
      var keyword = this.$keyword.val().trim();
      var category = this.$category.val();
      if (keyword === '') {
        this._keywordError('必须输入消费项目');
        return;
      }
      if (this.$category.prop('selectedIndex') === 0) {
        this._categoryError('必须选择一个分类');
        return;
      }
      location.href = '/cost/' + keyword + '/' + category;
    },
    _categoryChange: function() {
      var category = this.$category.val();
      var self = this;
      if (category === '创建新分类') {
        category = prompt('输入分类名').trim();
        if (category) {
          var $option = $('<option>' + category + '</option>');
          $option.innerText = category;
          setTimeout(function() {
            $option.insertBefore(self.$category.find('option').last());
            self.$category[0].selectedIndex = self.$category.find('option').length - 2;
          }, 0);
        }
      }
    },
    _keywordError: function(msg) {
      this.$keyword.addClass('error');
      this.$keyword_tip.addClass('error');
      this.$keyword_tip.html(msg);
      var self = this;
      setTimeout(function() {
        self.$keyword.removeClass('error');
        self.$keyword_tip.removeClass('error');
        self._showTip();
      }, 3000);
    },
    _categoryError: function(msg) {
      this.$category.addClass('error');
      this.$category_tip.addClass('error');
      this.$category_tip.html(msg);
      var self = this;
      setTimeout(function() {
        self.$category.removeClass('error');
        self.$category_tip.removeClass('error');
        self._showTip();
      }, 3000);
    }
  });
  return View;
});
/* @source modules/add_keyword/index.js */;

define("modules/add_keyword/index", [
  "modules/add_keyword/view"
],function(View){return {init:function(){var view = new View({el: $('[data-module="add_keyword"]')});}};});
/* @source modules/headbar/view.js */;

define("modules/headbar/view", [
  "js/views/base"
],function(Base){var View = Base.extend({moduleName:"headbar"});return View;});
/* @source modules/headbar/index.js */;

define("modules/headbar/index", [
  "modules/headbar/view"
],function(View){return {init:function(){var view = new View({el: $('[data-module="headbar"]')});}};});
/* @source js/common/domWatcher.js */;

define("js/common/domWatcher", function() {
  window.Element && function(ElementPrototype) {
    ElementPrototype.matchesSelector = ElementPrototype.matchesSelector ||
      ElementPrototype.mozMatchesSelector ||
      ElementPrototype.msMatchesSelector ||
      ElementPrototype.oMatchesSelector ||
      ElementPrototype.webkitMatchesSelector;
  }(Element.prototype);
  var DomWatcher = function(options) {
    options = options || {};
    this.$el = $(options.el || document);
  };
  DomWatcher.prototype.exist = function(selector, callback) {
    var el = this.$el.find(selector);
    if (el.length > 0) {
      callback(el);
    }
    this.onadd(selector, callback);
  };
  DomWatcher.prototype.onadd = function(selector, callback) {
    var self = this;
    this.$el.on('DOMNodeInserted', function(e) {
      var target = e.target;
      var el = self._find(target, selector);
      if (el.length > 0) {
        callback(el);
      }
    });
  };
  DomWatcher.prototype.onremove = function(selector, callback) {
    var self = this;
    this.$el.on('DOMNodeRemoved', function(e) {
      var target = e.target;
      var el = self._find(target, selector);
      if (el.length > 0) {
        callback(el);
      }
    });
  };
  DomWatcher.prototype._find = function(inserted, selector) {
    var els = [];
    //只检查element元素
    if (inserted.nodeType === 1) {
      //先看子元素中是否包含满足条件的元素
      var el = $(inserted).find(selector);
      if (el.length > 0) {
        els = Array.prototype.slice.call(el, 0);
      }
      //再检查当前被插入的元素是否满足条件
      if (inserted.matchesSelector(selector)) {
        els.push(inserted);
      }
    }
    return $(els);
  };
  return DomWatcher;
});
/* @source js/common/moduleRunner.js */;

define("js/common/moduleRunner", [
  "js/common/domWatcher"
], function(DomWatcher) {
  //当组件从页面中摘除时，需要取消组件的事件监听
  new DomWatcher().onremove('[data-module]', function(els) {
    els.each(function(i, el) {
      var view = el.__view;
      //当$(el).data('view')存在时，说明并不是要真正摘除这个节点，可能是append到另外的地方，因此不能取消事件监听
      if (view && !$(el).data('view')) {
        view.stopListening();
      }
    });
  });
  return {
    run: function(modules) {
      for (var name in modules) {
        var module = modules[name];
        if (!module) continue;
        try {
          if (module.init) {
            (function(module) {
              new DomWatcher().exist('[data-module="' + name + '"]', function(el) {
                if (!el.data('view')) {
                  module.init(el);
                }
              });
            })(module);
          }
        } catch (e) {
          console.error(e.stack);
        }
      }
    }
  }
});
/* @source js/keyword/modules.js */;

define("js/keyword/modules", [
  "js/common/moduleRunner",
  "modules/headbar/index",
  "modules/add_keyword/index"
], function(ModuleRunner, headbar, add_keyword) {
    var modules = {
        headbar: headbar,
        add_keyword: add_keyword
    };
    ModuleRunner.run(modules);
});
/* @source  */;

require(['js/keyword/modules'], function() {});