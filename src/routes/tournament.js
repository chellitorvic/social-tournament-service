'use strict';

const Joi = require('joi');
const Boom = require('boom');
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
            return reply(Boom.badRequest(`Tournament with id:${tournamentId} already exists`));
          }
          return reply();
        })
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
        .transaction(function (t) {
          return Promise
            .all([
              Tournament.findById(tournamentId, {transaction: t}),
              Player.findById(playerId, {transaction: t, lock: {level: t.LOCK.UPDATE}}),
              Player.findAll({where: {playerId: {$in: backerId}}, transaction: t, lock: {level: t.LOCK.UPDATE}}),
            ])
            .then(([tournament, player, backers]) => {
              if (!tournament) {
                return reply(Boom.badRequest(`Tournament with id:${tournamentId} does not exist`));
              }

              if (!tournament.open) {
                return reply(Boom.badRequest(`Tournament with id:${tournamentId} is already closed`));
              }

              if (!player) {
                return reply(Boom.badRequest(`Player with id:${playerId} does not exist`));
              }

              if (backers.length !== backerId.length) {
                return reply(Boom.badRequest(`One or more backers does not exist`));
              }

              const participants = [player, ...backers];
              const part = tournament.deposit / participants.length;
              if (participants.some((p) => (p.balance < part))) {
                return reply(Boom.badRequest('One or more players have not enough balance'));
              }

              return Participation
                .findOrCreate({where: {tournamentId, playerId}, defaults: {tournamentId, playerId}, transaction: t})
                .spread((participation, created) => {
                  if (!created) {
                    return reply(Boom.badRequest(`Player is already joined this tournament`));
                  }

                  return participation
                    .setBackers(backers, {transaction: t})
                    .then(() => Promise.all(participants.map(p => Player.take(p.playerId, part, {transaction: t}))))
                    .then(() => {
                      return reply();
                    });
                });
            });
        })
        .catch((err) => {
          return reply(Boom.wrap(err));
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
              Tournament.findById(tournamentId, {transaction: t, lock: {level: t.LOCK.UPDATE}}),
              Participation.findAll({
                where: {playerId: {$in: playerIds}},
                transaction: t,
                lock: {level: t.LOCK.UPDATE}
              })
            ])
            .then(([tournament, participations]) => {
              if (!tournament) {
                return reply(Boom.badRequest(`Tournament with id:${tournamentId} does not exist`));
              }

              if (!tournament.open) {
                return reply(Boom.badRequest(`Tournament with id:${tournamentId} is already closed`));
              }

              if (participations.length !== winners.length) {
                return reply(Boom.badRequest(`One or more winners have not joined tournament`));
              }

              return tournament
                .update({open: false}, {transaction: t})
                .then(() => {
                  const givePrizes = participations
                    .map((p) => {
                      return Promise
                        .all([
                          p.getPlayer({transaction: t, lock: {level: t.LOCK.UPDATE}}),
                          p.getBackers({transaction: t, lock: {level: t.LOCK.UPDATE}})
                        ])
                        .then(([player, backers]) => {
                          const players = [player, ...backers];
                          const part = winnerPrizes[player.playerId] / players.length;

                          const updateBalances = players.map((player) => {
                            return Player.fund(player.playerId, part, {transaction: t});
                          });

                          return Promise.all(updateBalances);
                        });
                    });
                  return Promise.all(givePrizes);
                })
                .then(() => tournament.destroy({transaction: t}))
                .then(() => reply());
            })
        })
        .catch((err) => {
          return reply(Boom.wrap(err));
        });
    }
  }
];
