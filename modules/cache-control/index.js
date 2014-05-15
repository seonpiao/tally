module.exports = {
  init: function(app) {
    app.use(function * (next) {
      //没有扩展名，认为是动态请求，设置为不缓存
      if (this.path.search(/\.[^\.]+$|\?|#/) === -1) {
        this.set('cache-control', 'no-cache');
        this.set('max-age', '0');
      }
    });
  },
  unload: function(app) {
    this.routes.forEach(function(route) {
      app.unroute(route);
    });
  }
}