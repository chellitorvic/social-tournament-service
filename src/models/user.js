'use strict';

module.exports = function (sequelize, DataTypes) {
  const Player = sequelize.define('Player', {
    playerId: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    balance: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0
      }
    }
  });
  return Player;
};
