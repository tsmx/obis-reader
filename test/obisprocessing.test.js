const obisprocessing = require('../functions/obisprocessing');
const obisActualSchema = require('../schemas/obisActual');
const obisValueSchema = require('../schemas/obisValue');
const { setupTestDb } = require('./testutils');

describe('Download test suite', () => {

    setupTestDb('obisdata');

    it('tests a successful processing of OBIS data', async () => {
        const actualBefore = await obisActualSchema.find({});
        expect(actualBefore.length).toBe(0);
        const valueBefore = await obisValueSchema.find({});
        expect(valueBefore.length).toBe(0);
        obisprocessing.process();
        await new Promise((r) => setTimeout(r, 1000));
        obisprocessing.stop();
        const actualTest = await obisActualSchema.find({});
        expect(actualTest.length).toBe(1);
        const valueTest = await obisValueSchema.find({});
        expect(valueTest.length).toBe(1);
    });

});