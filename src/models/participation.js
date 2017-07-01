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

  Participation.associate = function ({Player, Tournament}) {
    Participation.belongsTo(Tournament, {foreignKey: 'tournamentId', targetKey: 'tournamentId'});
    Participation.belongsTo(Player, {foreignKey: 'playerId', targetKey: 'playerId'});
    Participation.belongsToMany(Player, {as: 'Backers', through: 'BackerParticipation'});
    Player.belongsToMany(Participation, {as: 'BackedParticipations', through: 'BackerParticipation'});
  };
  return Participation;
};
