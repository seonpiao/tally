var path = require('path');
var fs = require('fs');

module.exports = {
  init: function(host) {
    var modulePath = path.join(__dirname, 'modules');
    var moduleNames = fs.readdirSync(modulePath);
    host.loadModule(moduleNames);
  },
  unload: function(host) {

  }
}