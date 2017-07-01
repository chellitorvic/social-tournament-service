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

sync();

function sync() {
  models.sequelize
    .sync({force: isDev})
    .then(function () {
      server.start(function () {
        console.log('Server running at:', server.info.uri);
      });
    })
    .catch(() => {
      console.log('Unable connect to database, retrying...');
      setTimeout(sync, 1000);
    });
}
