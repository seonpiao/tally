
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


/* @source js/models/base.js */;

define("js/models/base", function() {
  Backbone.sync = function(method, model, options) {
    var params = {
      type: 'GET',
      dataType: 'json'
    };

    options || (options = {});
    if (!options.url) {
      params.url = model.url();
    }

    if (!options.data && model && (method === 'create' || method === 'update')) {
      params.data = model.toJSON();
      params.type = 'POST';
    }

    return $.ajax(_.extend(params, options));
  };
  var Model = Backbone.Model.extend({
    initialize: function() {
      this.init.apply(this, arguments);
    },
    init: function() {},
    url: function() {
      if (this.path) {
        return this.path;
      }
      return '/api/' + this.action;
    }
  });
  return Model;
});
/* @source modules/cost_model/model.js */;

define("modules/cost_model/model", [
  "js/models/base"
], function(Base) {
  var Model = Base.extend({});
  return Model;
});
/* @source modules/cost_model/index.js */;

define("modules/cost_model/index", [
  "modules/cost_model/model"
], function(Model) {
  return new Model({
    cost: 0
  });
});
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
    __activeHack: function() {}
  });
  return View;
});
/* @source modules/num_keyboard/view.js */;

define("modules/num_keyboard/view", [
  "js/views/base"
], function(Base) {
  var View = Base.extend({
    moduleName: "num_keyboard",
    events: {
      'touchstart .num': '_input',
      'touchstart .del': '_del',
      'touchstart .clear': '_clear',
      'touchstart .ok': '_ok',
      'touchstart .operator': '_operate'
    },
    init: function() {},
    _input: function(e) {
      e.preventDefault();
      var target = $(e.target);
      var cost = this.model.get('cost').toString();
      cost += target.html();
      this.model.set('cost', cost);
    },
    _del: function(e) {
      e.preventDefault();
      var target = $(e.target);
      var cost = this.model.get('cost').toString();
      cost = cost.replace(/.$/, '');
      this.model.set('cost', cost || 0);
    },
    _ok: function(e) {
      e.preventDefault();
      var cost = parseFloat(this.model.get('cost'));
      location.href = '/done/' + cost;
    },
    _clear: function(e) {
      e.preventDefault();
      this.model.set('cost', 0);
    },
    _operate: function(e) {
      e.preventDefault();
      var target = $(e.target);
      var cost = this.model.get('cost');
      cost += target.html();
      this.model.set('cost', cost);
    }
  });
  return View;
});
/* @source modules/num_keyboard/index.js */;

define("modules/num_keyboard/index", [
  "modules/num_keyboard/view",
  "modules/cost_model/index"
], function(View, costModel) {
  return {
    init: function() {
      var view = new View({
        el: $('[data-module="num_keyboard"]'),
        model: costModel
      });
    }
  };
});
/* @source modules/state_bar/view.js */;

define("modules/state_bar/view", [
  "js/views/base"
], function(Base) {
  var View = Base.extend({
    moduleName: "state_bar",
    init: function() {
      this.listenTo(this.model, 'change', this.updateCost.bind(this));
      this.$cost = this.$el.find('.cost');
    },
    updateCost: function() {
      var cost = this.model.get('cost');
      var dotTail = /\.$/.test(cost);
      var hasOperator = /[+-]/.test(cost);
      cost = parseFloat(cost) + '';
      if (dotTail) {
        cost += '.';
      }
      if (hasOperator) {

      }
      this.$cost.html(cost);
    }
  });
  return View;
});
/* @source modules/state_bar/index.js */;

define("modules/state_bar/index", [
  "modules/state_bar/view",
  "modules/cost_model/index"
], function(View, costModel) {
  return {
    init: function() {
      var view = new View({
        el: $('[data-module="state_bar"]'),
        model: costModel
      });
    }
  };
});
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
/* @source js/cost/modules.js */;

define("js/cost/modules", [
  "js/common/moduleRunner",
  "modules/headbar/index",
  "modules/state_bar/index",
  "modules/num_keyboard/index"
], function(ModuleRunner, headbar, state_bar, num_keyboard) {
    var modules = {
        headbar: headbar,
        state_bar: state_bar,
        num_keyboard: num_keyboard
    };
    ModuleRunner.run(modules);
});
/* @source  */;

require(['js/cost/modules'], function() {});