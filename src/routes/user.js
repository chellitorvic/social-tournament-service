'use strict';

const Joi = require('joi');
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
          return reply().code(404);
        })
        .catch(() => reply().code(500))
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
            .findById(playerId, {transaction: t})
            .then((user) => {
              if (user) {
                const balance = user.balance;
                if (balance - points >= 0) {
                  return user
                    .update({balance: balance - points}, {transaction: t})
                    .then(() => reply());
                }
                return reply().code(400);
              }
              return reply().code(404);
            })
        })
        .catch(() => reply().code(500))
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
            .findOrCreate({where: {playerId}, defaults: {playerId, balance: points}, transaction: t})
            .spread((user, created) => {
              if (!created) {
                return user.update({balance: user.balance + points}, {transaction: t});
              }
            })
        })
        .then(() => reply())
        .catch((err) => {
          return reply().code(500);
        })
    }
  }
];
