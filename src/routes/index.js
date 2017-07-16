'use strict';

module.exports = [].concat.apply([], [
  require('./tournament'),
  require('./player'),
  require('./db')
]);
