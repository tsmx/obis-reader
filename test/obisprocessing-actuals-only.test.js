process.env['NODE_ENV'] = 'test-actual-only';
const obisprocessing = require('../functions/obisprocessing');
const obisActualSchema = require('../schemas/obisActual');
const obisValueSchema = require('../schemas/obisValue');
const { setupTestDb } = require('./testutils');

describe('OBIS actuals only processing test suite', () => {

    setupTestDb('obisdata');

    it('tests a successful processing of a single OBIS data set for actual values only', async () => {
        const actualBefore = await obisActualSchema.find({});
        expect(actualBefore.length).toBe(0);
        const valueBefore = await obisValueSchema.find({});
        expect(valueBefore.length).toBe(0);
        obisprocessing.process();
        await new Promise((r) => setTimeout(r, 1000));
        obisprocessing.stop();
        const actualTest = await obisActualSchema.find({});
        expect(actualTest.length).toBe(1);
        expect(actualTest[0].deviceid).toBe('0901454d48000055ac49');
        expect(actualTest[0].powerCurrent).toBe(108.4);
        expect(actualTest[0].powerCurrentUnit).toBe('W');
        const valueTest = await obisValueSchema.find({});
        expect(valueTest.length).toBe(0);
    });

});