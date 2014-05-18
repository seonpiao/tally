var categoryModel = require('../../models/category');
var userModel = require('../../models/user');
var costModel = require('../../models/cost');
var tallyModel = require('../../models/tally');
var keywordModel = require('../../models/keyword');

module.exports = {
  init: function(app) {
    this.routes = [
      app.route('/').get(function * (next) {
        var session = yield this.session;
        yield userModel.check(session);
        if (this.status !== 301) {
          yield userModel.get({
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
        yield userModel.auth(body);
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
        yield userModel.check(session);
        if (this.status !== 301) {
          yield categoryModel.get({
            owner: session.uid
          });
          yield userModel.get();
          yield next;
          yield this.render('category');
        }
      }),
      app.route('/keyword').get(function * (next) {
        var session = yield this.session;
        yield userModel.check(session);
        if (this.status !== 301) {
          yield categoryModel.get({
            owner: session.uid
          });
          yield keywordModel.get({
            owner: session.uid
          });
          yield userModel.get();
          yield next;
          yield this.render('keyword');
        }
      }),
      app.route('/cost/:keyword/:category').get(function * (next) {
        var session = yield this.session;
        yield userModel.check(session);
        if (this.status !== 301) {
          var options = {
            owner: session.uid,
            keyword: decodeURIComponent(this.request.params.keyword)
          };
          yield keywordModel.get(options);
          if (!this.locals.keyword) {
            this.locals.keyword = {
              keyword: options.keyword,
              category: this.request.params.category || '其他'
            }
          }
          session.keyword = this.locals.keyword.keyword;
          session.category = this.locals.keyword.category;
          yield userModel.get();
          yield next;
          yield this.render('cost');
        }
      }),
      app.route('/done/:cost').get(function * (next) {
        var session = yield this.session;
        yield userModel.check(session);
        if (this.status !== 301) {
          var keyword = session.keyword;
          var category = session.category;
          var cost = this.request.params.cost;
          yield categoryModel.get({
            owner: session.uid,
            category: category
          });
          if (this.locals.category === null) {
            yield categoryModel.add({
              owner: session.uid,
              category: category
            });
          }
          yield keywordModel.get({
            owner: session.uid,
            keyword: keyword
          });
          if (this.locals.keyword === null) {
            yield keywordModel.add({
              owner: session.uid,
              keyword: keyword,
              category: category
            });
          }
          yield keywordModel.incr({
            owner: session.uid,
            keyword: keyword
          });
          yield tallyModel.add({
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
        yield userModel.check(session);
        if (this.status !== 301) {
          yield tallyModel.get({
            owner: session.uid
          });
          yield next;
          yield this.render('list');
        }
      }),
      app.route('/tally/del/:id').get(function * (next) {
        var session = yield this.session;
        yield userModel.check(session);
        if (this.status !== 301) {
          var id = this.request.params.id;
          if (id) {
            yield tallyModel.remove({
              owner: session.uid,
              id: id
            });
            this.body = {
              ret_code: 0
            };
            yield next;
          }
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