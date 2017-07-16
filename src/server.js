'use strict';

const {Server} = require('hapi');
const models = require('./models');
const routes = require('./routes');
const {host, port} = require('../config/config.json');

const env = process.env.NODE_ENV || 'development';
const isDev = env === 'development';

const server = new Server();
server.connection({
  host: host || process.env.HOST || '0.0.0.0',
  port: port || process.env.PORT || 8080
});

server.route(routes);

if (!module.parent) {
  sync(function () {
    server.start(function () {
      console.log('Server running at:', server.info.uri);
    });
  });
}

function sync(callback) {
  models.sequelize
    .sync({force: isDev})
    .then(callback)
    .catch(() => {
      console.log('Unable connect to database, retrying...');
      setTimeout(() => sync(callback), 1000);
    });
}

module.exports = server;
