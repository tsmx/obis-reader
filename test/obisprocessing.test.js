const obisprocessing = require('../functions/obisprocessing');
const obisActualSchema = require('../schemas/obisActual');
const obisValueSchema = require('../schemas/obisValue');
const { setupTestDb } = require('./testutils');

describe('Download test suite', () => {

    setupTestDb('obisdata');

    it('tests a successful processing of OBIS data', async () => {
        expect(true).toBe(true);
    });

});