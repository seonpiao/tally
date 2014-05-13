var category = require('../models/category');
var user = require('../models/user');

module.exports = {
  init: function(app) {
    this.routes = [
      app.route('/').get(function * (next) {
        // yield category.modify({
        //   owner: 0,
        //   id: 3,
        //   name: Date.now()
        // });
        // 
        // yield category.get({
        //   owner: 1
        // });
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
          console.log(session)
          this.status = 301;
          this.set('location', '/');
        } else {
          this.status = 301;
          this.set('location', '/login');
        }

      }),
      app.route('/add').get(function * (next) {
        // yield category.modify({
        //   owner: 0,
        //   id: 3,
        //   name: Date.now()
        // });
        yield category.get({
          owner: 1
        });
        // yield user.add({
        //   name: 'u' + Date.now()
        // });
        yield user.get();
        yield this.render('add');
      })
    ];
  },
  unload: function(app) {
    this.routes.forEach(function(route) {
      app.unroute(route);
    });
  }
}