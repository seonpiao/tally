var category = require('../../models/category');
var user = require('../../models/user');
var cost = require('../../models/cost');
var tally = require('../../models/tally');

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
          yield this.render('category');
        }
      }),
      app.route('/cost/:category').get(function * (next) {
        var session = yield this.session;
        yield user.check(session);
        if (this.status !== 301) {
          var category = this.request.params.category;
          session.category = category;
          yield cost.get({
            owner: 1
          });
          yield user.get();
          yield this.render('cost');
        }
      }),
      app.route('/done/:cost').get(function * (next) {
        var session = yield this.session;
        yield user.check(session);
        if (this.status !== 301) {
          var category = session.category;
          var cost = this.request.params.cost;
          session.category = category;
          yield tally.add({
            owner: session.uid,
            cost: cost,
            category: category
          });
          this.status = 301;
          this.set('location', '/');
          yield next;
        }
      }),
      app.route('/list').get(function * (next) {
        var session = yield this.session;
        yield user.check(session);
        if (this.status !== 301) {
          yield tally.get({
            owner: session.uid
          });
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