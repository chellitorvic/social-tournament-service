'use strict';

const Boom = require('boom');

module.exports = function (sequelize, DataTypes) {
  const Tournament = sequelize.define('Tournament', {
    tournamentId: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    deposit: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0
      }
    },
    open: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  let models;

  Tournament.associate = function associate(db) {
    models = db;
  };

  /**
   * Calculate amount of points each of n players must pay to join tournament
   *
   * @param n
   * @returns {number}
   */
  Tournament.prototype.calcDeposit = function calcDeposit(n) {
    return this.deposit / n;
  };


  /**
   * Announce tournament specifying the entry deposit
   *
   * @param tournamentId
   * @param deposit
   * @returns {*}
   */
  Tournament.announce = function announce(tournamentId, deposit) {
    return Tournament
      .findOrCreate({where: {tournamentId}, defaults: {tournamentId, deposit}})
      .spread((tournament, created) => {
        if (!created) {
          throw Boom.badRequest(`Tournament with id:${tournamentId} already exists`);
        }
      });
  };


  /**
   *  Join player into a tournament optionally backed by a set of backers
   *
   * @param tournamentId
   * @param playerId
   * @param backerIds
   * @param options
   * @returns {Promise.<*>}
   */
  Tournament.join = function join(tournamentId, playerId, backerIds = [], options = {}) {
    const {Player, Participation} = models;
    return Promise
      .all([
        Tournament.findById(tournamentId, options),
        Player.findById(playerId, options),
        Player.findAll(Object.assign({where: {playerId: {$in: backerIds}}}, options)),
      ])
      .then(([tournament, player, backers]) => {
        if (!tournament) {
          throw Boom.badRequest(`Tournament with id:${tournamentId} does not exist`);
        }

        if (!tournament.open) {
          throw Boom.badRequest(`Tournament with id:${tournamentId} is already closed`);
        }

        if (!player) {
          throw Boom.badRequest(`Player with id:${playerId} does not exist`);
        }

        if (backers.length !== backerIds.length) {
          throw Boom.badRequest(`One or more backers does not exist`);
        }

        const participants = [player, ...backers];
        const part = tournament.calcDeposit(participants.length);
        if (participants.some((p) => (p.balance < part))) {
          throw Boom.badRequest('One or more players have not enough balance');
        }

        return Participation
          .findOrCreate(Object.assign({where: {tournamentId, playerId}, defaults: {tournamentId, playerId}}, options))
          .spread((participation, created) => {
            if (!created) {
              throw Boom.badRequest(`Player is already joined this tournament`);
            }

            return participation
              .setBackers(backers, options)
              .then(() => Promise.all(participants.map(p => {
                return Player.incrementBalance(p.playerId, -part, options);
              })));
          });
      });
  };


  /**
   * Result tournament winners and prizes
   *
   * @param tournamentId
   * @param winners
   * @param options
   * @returns {Promise.<*>}
   */
  Tournament.result = function result(tournamentId, winners = [], options = {}) {
    const playerIds = winners.map(winner => winner.playerId);
    const winnerPrizes = winners.reduce((memo, {playerId, prize}) => {
      memo[playerId] = prize;
      return memo;
    }, {});

    const {Participation} = models;
    return Promise
      .all([
        Tournament.findById(tournamentId, options),
        Participation.findAll(Object.assign({where: {playerId: {$in: playerIds}}}, options))
      ])
      .then(([tournament, participations]) => {
        if (!tournament) {
          throw Boom.notFound(`Tournament with id:${tournamentId} does not exist`);
        }

        if (!tournament.open) {
          throw Boom.badRequest(`Tournament with id:${tournamentId} is already closed`);
        }

        if (participations.length !== winners.length) {
          throw Boom.badRequest(`One or more winners have not joined tournament`);
        }

        return tournament
          .update({open: false}, options)
          .then(() => {
            const givePrizes = participations
              .map((participation) => {
                return participation.givePrize(winnerPrizes[participation.playerId], options);
              });
            return Promise.all(givePrizes);
          })
          .then(() => tournament.destroy(options));
      });
  };

  return Tournament;
};
