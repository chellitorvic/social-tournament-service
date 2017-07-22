'use strict';

module.exports = function (sequelize, DataTypes) {
  const Participation = sequelize.define('Participation', {
    tournamentId: {
      type: DataTypes.STRING,
    },
    playerId: {
      type: DataTypes.STRING,
    }
  }, {
    indexes: [{
      unique: true,
      fields: ['tournamentId', 'playerId']
    }],
  });

  let models;

  Participation.associate = function associate(db) {
    models = db;
    const {Player, Tournament} = db;
    Participation.belongsTo(Tournament, {foreignKey: 'tournamentId', targetKey: 'tournamentId', onDelete: 'cascade'});
    Participation.belongsTo(Player, {foreignKey: 'playerId', targetKey: 'playerId'});
    Participation.belongsToMany(Player, {as: 'Backers', through: 'BackerParticipation'});
    Player.belongsToMany(Participation, {as: 'BackedParticipations', through: 'BackerParticipation'});
  };

  /**
   * Get player and his backers in one list
   *
   * @param options
   * @returns {Promise.<Player[]>}
   */
  Participation.prototype.getPlayers = function getPlayers(options = {}) {
    return Promise
      .all([
        this.getPlayer(options),
        this.getBackers(options)
      ])
      .then(([player, backers]) => {
        return [player, ...backers];
      });
  };

  /**
   * Give equal parts of the prize to player and its backers
   *
   * @param prize
   * @param options
   * @returns {Promise.<*>}
   */
  Participation.prototype.givePrize = function givePrize(prize, options = {}) {
    return this
      .getPlayers(options)
      .then((players) => {
        const part = prize / players.length;

        const updateBalances = players.map((player) => {
          return models.Player.incrementBalance(player.playerId, part, options);
        });

        return Promise.all(updateBalances);
      });
  };

  return Participation;
};
