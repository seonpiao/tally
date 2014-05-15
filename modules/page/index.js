var category = require('../../models/category');
var user = require('../../models/user');
var cost = require('../../models/cost');
var tally = require('../../models/tally');
var keyword = require('../../models/keyword');

module.exports = {
  init: function(app) {
    this.routes = [
      app.route('/').get(function * (next) {
        var session = yield this.session;
        yield user.check(session);
        if (this.status !== 301) {
          yield user.get({
            id: session.uid
          });
          yield next;
          yield this.render('index');
        }
      }),
      app.route('/login').get(function * (next) {
        yield this.render('login');
      }).post(function * (next) {
        var body = this.request.body;
        yield user.auth(body);
        if (this.locals.user) {
          yield this.session = {
            uid: this.locals.user.uid
          };
          var session = yield this.session;
          this.status = 301;
          this.set('location', '/');
        } else {
          this.status = 301;
          this.set('location', '/login');
        }
      }),
      app.route('/category').get(function * (next) {
        var session = yield this.session;
        yield user.check(session);
        if (this.status !== 301) {
          yield category.get({
            owner: 1
          });
          yield user.get();
          yield next;
          yield this.render('category');
        }
      }),
      app.route('/keyword').get(function * (next) {
        var session = yield this.session;
        yield user.check(session);
        if (this.status !== 301) {
          yield keyword.get({
            owner: 1
          });
          yield user.get();
          yield next;
          yield this.render('keyword');
        }
      }),
      app.route('/cost/:keyword').get(function * (next) {
        var session = yield this.session;
        yield user.check(session);
        if (this.status !== 301) {
          var options = {
            owner: session.uid,
            keyword: decodeURIComponent(this.request.params.keyword)
          };
          yield keyword.get(options);
          if (!this.locals.keyword) {
            this.locals.keyword = {
              keyword: options.keyword,
              category: '其他'
            }
          }
          session.keyword = this.locals.keyword.keyword;
          session.category = this.locals.keyword.category;
          yield cost.get({
            owner: 1
          });
          yield user.get();
          yield next;
          yield this.render('cost');
        }
      }),
      app.route('/done/:cost').get(function * (next) {
        var session = yield this.session;
        yield user.check(session);
        if (this.status !== 301) {
          var keyword = session.keyword;
          var category = session.category;
          var cost = this.request.params.cost;
          yield tally.add({
            owner: session.uid,
            cost: cost,
            keyword: keyword,
            category: category
          });
          yield next;
          this.status = 301;
          this.set('location', '/');
        }
      }),
      app.route('/list').get(function * (next) {
        var session = yield this.session;
        yield user.check(session);
        if (this.status !== 301) {
          yield tally.get({
            owner: session.uid
          });
          yield next;
          yield this.render('list');
        }
      })
    ];
  },
  unload: function(app) {
    this.routes.forEach(function(route) {
      app.unroute(route);
    });
  }
}