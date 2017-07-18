'use strict';

const Boom = require('boom');
const {sequelize} = require('../models');

module.exports = [
  {
    method: 'POST',
    path: '/reset',
    handler(request, reply) {
      sequelize
        .sync({force: true})
        .then(() => reply())
        .catch((err) => reply(Boom.wrap(err)));
    }
  }
];
