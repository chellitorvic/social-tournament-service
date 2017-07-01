'use strict';

const {sequelize} = require('../models');

module.exports = [
  {
    method: 'POST',
    path: '/reset',
    handler(request, reply) {
      sequelize
        .sync({force: true})
        .then(() => reply())
        .catch(() => reply().code(500));
    }
  }
];
