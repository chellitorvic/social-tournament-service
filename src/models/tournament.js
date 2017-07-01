'use strict';

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
  return Tournament;
};
