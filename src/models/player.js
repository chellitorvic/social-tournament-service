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

  Player.take = function take(playerId, points, options) {
    return this.increment('balance', Object.assign({by: -points, where: {playerId}}, options));
  };

  Player.fund = function fund(playerId, points, options) {
    return this.increment('balance', Object.assign({by: points, where: {playerId}}, options));
  };

  return Player;
};
