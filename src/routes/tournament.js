'use strict';

const Joi = require('joi');
const Boom = require('boom');
const {Tournament, sequelize} = require('../models');

module.exports = [
  {
    method: 'POST',
    path: '/announceTournament',
    config: {
      validate: {
        query: {
          tournamentId: Joi.string().required(),
          deposit: Joi.number().min(0).required(),
        }
      }
    },
    handler(request, reply) {
      const {tournamentId, deposit} = request.query;
      Tournament
        .announce(tournamentId, deposit)
        .then(() => reply())
        .catch((err) => reply(Boom.wrap(err)));
    }
  },

  {
    method: 'POST',
    path: '/joinTournament',
    config: {
      validate: {
        query: {
          tournamentId: Joi.string().required(),
          playerId: Joi.string().required(),
          backerId: Joi.array().items(Joi.string()).unique().single().default([]),
        }
      }
    },
    handler(request, reply) {
      const {tournamentId, playerId, backerId /*array*/} = request.query;

      sequelize
        .transaction(t => Tournament.join(tournamentId, playerId, backerId, {
          transaction: t,
          lock: {level: t.LOCK.UPDATE}
        }))
        .then(() => reply())
        .catch((err) => reply(Boom.wrap(err)));
    }
  },

  {
    method: 'POST',
    path: '/resultTournament',
    config: {
      validate: {
        payload: {
          tournamentId: Joi.string().required(),
          winners: Joi.array().items(Joi.object({
            playerId: Joi.string().required(),
            prize: Joi.number().min(0).required(),
          })).unique('playerId').required()
        }
      }
    },
    handler(request, reply) {
      const {tournamentId, winners} = request.payload;
      sequelize
        .transaction(t => Tournament.result(tournamentId, winners, {transaction: t, lock: {level: t.LOCK.UPDATE}}))
        .then(() => reply())
        .catch((err) => reply(Boom.wrap(err)));
    }
  }
];
