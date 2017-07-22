'use strict';

const Boom = require('boom');

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

  /**
   * Increment balance of player with id of player id by amount of points
   *
   * @param playerId
   * @param points
   * @param options
   * @returns {Promise.<*>}
   */
  Player.incrementBalance = function take(playerId, points, options = {}) {
    return this.increment('balance', Object.assign({by: points, where: {playerId}}, options));
  };

  /**
   * Take points from player balance
   *
   * @param playerId
   * @param points
   * @param options
   * @returns {Promise.<*>}
   */
  Player.take = function take(playerId, points, options = {}) {
    return Player
      .findById(playerId, options)
      .then((player) => {
        if (!player) throw Boom.notFound(`Player with id:${playerId} does not exist`);

        if (player.balance - points < 0) {
          throw Boom.badRequest(`Player id:${playerId} has not enough balance`);
        }

        return Player.incrementBalance(playerId, -points, options);
      });
  };

  /**
   * Fund points to player balance
   *
   * @param playerId
   * @param points
   * @param options
   * @returns {Promise.<*>}
   */
  Player.fund = function (playerId, points, options = {}) {
    return Player
      .findOrCreate(Object.assign({
        where: {playerId},
        defaults: {playerId, balance: points}
      }, options))
      .spread((player, created) => {
        if (!created) {
          return Player.incrementBalance(playerId, points, options);
        }
      });
  };

  /**
   * Get player balance info object
   *
   * @param playerId
   * @returns {Promise.<Object>}
   */
  Player.balance = function balance(playerId) {
    return Player
      .findById(playerId)
      .then((user) => {
        if (!user) {
          throw Boom.notFound(`Player with id:${playerId} does not exist`);
        }
        return {playerId, balance: user.balance};
      });
  };

  return Player;
};
