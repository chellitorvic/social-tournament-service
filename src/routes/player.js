'use strict';

const Joi = require('joi');
const Boom = require('boom');
const {Player, sequelize} = require('../models');

module.exports = [
  {
    method: 'GET',
    path: '/balance',
    config: {
      validate: {
        query: {
          playerId: Joi.string().required(),
        }
      }
    },
    handler(request, reply) {
      const {playerId} = request.query;
      Player
        .findById(playerId)
        .then((user) => {
          if (user) {
            const {playerId, balance} = user;
            return reply({playerId, balance});
          }
          return reply(Boom.notFound(`Player with id:${playerId} does not exist`));
        })
        .catch((err) => reply(Boom.wrap(err)));
    }
  },

  {
    method: 'POST',
    path: '/take',
    config: {
      validate: {
        query: {
          playerId: Joi.string().required(),
          points: Joi.number().min(1).required(),
        }
      }
    },
    handler(request, reply) {
      const {playerId, points} = request.query;
      sequelize
        .transaction(function (t) {
          return Player
            .findById(playerId, {transaction: t, lock: {level: t.LOCK.UPDATE}})
            .then((player) => {
              if (player) {
                const balance = player.balance;

                if (balance - points >= 0) {
                  return Player
                    .take(playerId, points, {transaction: t})
                    .then(() => reply());
                }

                return reply(Boom.badRequest(`Player id:${playerId} has not enough balance`));
              }

              return reply(Boom.notFound(`Player with id:${playerId} does not exist`));
            });
        })
        .catch((err) => {
          return reply(Boom.wrap(err));
        });
    }
  },

  {
    method: 'POST',
    path: '/fund',
    config: {
      validate: {
        query: {
          playerId: Joi.string().required(),
          points: Joi.number().min(1).required(),
        }
      }
    },
    handler(request, reply) {
      const {playerId, points} = request.query;
      sequelize
        .transaction(function (t) {
          return Player
            .findOrCreate({
              where: {playerId},
              defaults: {playerId, balance: points},
              transaction: t,
              lock: {level: t.LOCK.UPDATE}
            })
            .spread((player, created) => {
              if (!created) {
                return Player.fund(playerId, points, {transaction: t});
              }
            });
        })
        .then(() => reply())
        .catch((err) => {
          return reply(Boom.wrap(err));
        });
    }
  }
];
