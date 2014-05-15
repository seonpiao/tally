var logger = require('log4js').getLogger('module.cache-control');

module.exports = {
  init: function(app) {
    app.use(function * (next) {
      var log = this.path + ' is a ';
      logger.debug('cache-control');
      //没有扩展名，认为是动态请求，设置为不缓存
      if (this.path.search(/\.[^\.]+$|\?|#/) === -1) {
        log += 'dynamic resource.';
        this.set('cache-control', 'no-cache');
        this.set('max-age', '0');
      } else {
        log += 'static resource.';
      }
      logger.debug(log);
      yield next;
    });
  },
  unload: function(app) {

  }
}