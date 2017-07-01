'use strict';


module.exports = [].concat.apply([], [
  require('./tournament'),
  require('./user'),
  require('./db')
]);
