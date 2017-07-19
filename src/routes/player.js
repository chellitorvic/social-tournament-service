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
      Player
        .balance(request.query.playerId)
        .then((balance) => reply(balance))
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
        .transaction(t => Player.take(playerId, points, {transaction: t, lock: {level: t.LOCK.UPDATE}}))
        .then(() => reply())
        .catch((err) => reply(Boom.wrap(err)));
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
        .transaction(t => Player.fund(playerId, points, {transaction: t, lock: {level: t.LOCK.UPDATE}}))
        .then(() => reply())
        .catch((err) => reply(Boom.wrap(err)));
    }
  }
];
