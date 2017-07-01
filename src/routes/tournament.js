'use strict';

const Joi = require('joi');
const {Player, Tournament, Participation, sequelize} = require('../models');

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
        .findOrCreate({where: {tournamentId}, defaults: {tournamentId, deposit}})
        .spread((tournament, created) => {
          if (!created) {
            return reply().code(400);
          }
          return reply();
        })
        .catch((err) => reply().code(500));
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
        .transaction(function (t) {
          return Promise
            .all([
              Tournament.findById(tournamentId, {transaction: t}),
              Player.findById(playerId, {transaction: t}),
              Player.findAll({where: {playerId: {$in: backerId}}}, {transaction: t}),
            ])
            .then(([tournament, player, backers]) => {
              if (!tournament || !tournament.open || !player || backers.length !== backerId.length) {
                return reply().code(400);
              }

              const participants = [player, ...backers];
              const part = tournament.deposit / participants.length;
              if (participants.some((p) => (p.balance < part))) {
                return reply().code(400); // not enough balance
              }

              return Participation
                .findOrCreate({where: {tournamentId, playerId}, defaults: {tournamentId, playerId}, transaction: t})
                .spread((participation, created) => {
                  if (!created) {
                    return reply().code(400); // this player already registered
                  }
                  return participation
                    .setBackers(backers, {transaction: t})
                    .then(() => Promise.all(participants.map(p => p.update({balance: p.balance - part}, {transaction: t}))))
                    .then(() => {
                      return reply();
                    })
                })
            })
        })
        .catch((err) => {
          return reply().code(500);
        });
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
      const playerIds = winners.map(winner => winner.playerId);
      const winnerPrizes = winners.reduce((memo, {playerId, prize}) => {
        memo[playerId] = prize;
        return memo;
      }, {});

      sequelize
        .transaction(function (t) {
          return Promise
            .all([
              Tournament.findById(tournamentId, {transaction: t}),
              Participation.findAll({where: {playerId: {$in: playerIds}}}, {transaction: t})
            ])
            .then(([tournament, participations]) => {
              if (!tournament || !tournament.open || participations.length !== winners.length) {
                return reply().code(400);
              }

              return tournament
                .update({open: false}, {transaction: t})
                .then(() => {
                  const givePrizes = participations
                    .map((p) => {
                      return Promise
                        .all([p.getPlayer({transaction: t}), p.getBackers({transaction: t})])
                        .then(([player, backers]) => {
                          const players = [player, ...backers];
                          const part = winnerPrizes[player.playerId] / players.length;
                          const updateBalances = players.map((player) => {
                            return player.update({balance: player.balance + part}, {transaction: t});
                          });
                          return Promise.all(updateBalances);
                        });
                    });
                  return Promise.all(givePrizes);
                })
                .then(() => reply());
            })
        })
        .catch((err) => {
          return reply().code(500);
        });
    }
  }
];
