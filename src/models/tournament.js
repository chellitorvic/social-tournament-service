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

  /**
   * Calculate amount of points each of n players must pay to join tournament
   *
   * @param n
   * @returns {number}
   */
  Tournament.prototype.calcDeposit = function calcDeposit(n) {
    return this.deposit / n;
  };

  return Tournament;
};
