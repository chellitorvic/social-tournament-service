'use strict';

const assert = require('assert');
const server = require('../server');
const models = require('../models');

describe('Server', function () {

  before(function () {
    return models.sequelize
      .sync({force: true});
  });

  describe('/reset', function () {
    it('returns status code 200', function (done) {
      const options = {
        method: 'POST',
        url: '/reset',
      };

      server.inject(options, function (response) {
        assert.equal(response.statusCode, 200);
        done();
      });
    });
  });

  describe('/fund', function () {
    describe('/fund?playerId=P1&points=300', function () {
      it('returns status code 200', function (done) {
        const options = {
          method: 'POST',
          url: '/fund?playerId=P1&points=300'
        };

        server.inject(options, function (response) {
          assert.equal(response.statusCode, 200);
          done();
        });
      });

      it('set 300 balance for P1', function (done) {
        const options = {
          method: 'GET',
          url: '/balance?playerId=P1'
        };

        server.inject(options, function (response) {
          const {balance} = response.result;
          assert.equal(response.statusCode, 200);
          assert.equal(balance, 300);
          done();
        });
      });
    });

    describe('/fund?playerId=P2&points=300', function () {
      it('returns status code 200', function (done) {
        const options = {
          method: 'POST',
          url: '/fund?playerId=P2&points=300'
        };

        server.inject(options, function (response) {
          assert.equal(response.statusCode, 200);
          done();
        });
      });
    });

    describe('/fund?playerId=P3&points=300', function () {
      it('returns status code 200', function (done) {
        const options = {
          method: 'POST',
          url: '/fund?playerId=P3&points=300'
        };

        server.inject(options, function (response) {
          assert.equal(response.statusCode, 200);
          done();
        });
      });
    });

    describe('/fund?playerId=P4&points=500', function () {
      it('returns status code 200', function (done) {
        const options = {
          method: 'POST',
          url: '/fund?playerId=P4&points=500'
        };

        server.inject(options, function (response) {
          assert.equal(response.statusCode, 200);
          done();
        });
      });
    });

    describe('/fund?playerId=P5&points=1000', function () {
      it('returns status code 200', function (done) {
        const options = {
          method: 'POST',
          url: '/fund?playerId=P5&points=1000'
        };

        server.inject(options, function (response) {
          assert.equal(response.statusCode, 200);
          done();
        });
      });
    });
  });

  describe('/announceTournament?tournamentId=1&deposit=1000', function () {
    it('returns status code 200', function (done) {
      const options = {
        method: 'POST',
        url: '/announceTournament?tournamentId=1&deposit=1000'
      };

      server.inject(options, function (response) {
        assert.equal(response.statusCode, 200);
        done();
      });
    });
  });

  describe('/joinTournament?tournamentId=1&playerId=P5', function () {
    it('returns status code 200', function (done) {
      const options = {
        method: 'POST',
        url: '/joinTournament?tournamentId=1&playerId=P5'
      };

      server.inject(options, function (response) {
        assert.equal(response.statusCode, 200);
        done();
      });
    });
  });

  describe('/joinTournament?tournamentId=1&playerId=P1&backerId=P2&backerId=P3&backerId=P4', function () {
    it('returns status code 200', function (done) {
      const options = {
        method: 'POST',
        url: '/joinTournament?tournamentId=1&playerId=P1&backerId=P2&backerId=P3&backerId=P4'
      };

      server.inject(options, function (response) {
        assert.equal(response.statusCode, 200);
        done();
      });
    });
  });

  describe('/resultTournament ', function () {
    it('returns status code 200', function (done) {
      const options = {
        method: 'POST',
        url: '/resultTournament',
        payload: {"tournamentId": "1", "winners": [{"playerId": "P1", "prize": 2000}]}
      };

      server.inject(options, function (response) {
        assert.equal(response.statusCode, 200);
        done();
      });
    });

    it('results in P1 having balance of 550', function (done) {
      const options = {
        method: 'GET',
        url: '/balance?playerId=P1'
      };

      server.inject(options, function (response) {
        const {balance} = response.result;
        assert.equal(response.statusCode, 200);
        assert.equal(balance, 550);
        done();
      });
    });

    it('results in P2 having balance of 550', function (done) {
      const options = {
        method: 'GET',
        url: '/balance?playerId=P2'
      };

      server.inject(options, function (response) {
        const {balance} = response.result;
        assert.equal(response.statusCode, 200);
        assert.equal(balance, 550);
        done();
      });
    });

    it('results in P3 having balance of 550', function (done) {
      const options = {
        method: 'GET',
        url: '/balance?playerId=P3'
      };

      server.inject(options, function (response) {
        const {balance} = response.result;
        assert.equal(response.statusCode, 200);
        assert.equal(balance, 550);
        done();
      });
    });

    it('results in P4 having balance of 750', function (done) {
      const options = {
        method: 'GET',
        url: '/balance?playerId=P4'
      };

      server.inject(options, function (response) {
        const {balance} = response.result;
        assert.equal(response.statusCode, 200);
        assert.equal(balance, 750);
        done();
      });
    });

    it('results in P5 having balance of 0', function (done) {
      const options = {
        method: 'GET',
        url: '/balance?playerId=P5'
      };

      server.inject(options, function (response) {
        const {balance} = response.result;
        assert.equal(response.statusCode, 200);
        assert.equal(balance, 0);
        done();
      });
    });
  });

});
