process.env['NODE_ENV'] = 'test-fail';
const obisprocessing = require('../functions/obisprocessing');
const obisActualSchema = require('../schemas/obisActual');
const obisValueSchema = require('../schemas/obisValue');
const { setupTestDb } = require('./testutils');

describe('OBIS data processing error test suite', () => {

    setupTestDb('obisdata');

    it('tests a failed processing of a malformed OBIS data set', async () => {
        const actualBefore = await obisActualSchema.find({});
        expect(actualBefore.length).toBe(0);
        const valueBefore = await obisValueSchema.find({});
        expect(valueBefore.length).toBe(0);
        obisprocessing.process();
        await new Promise((r) => setTimeout(r, 1000));
        obisprocessing.stop();
        const actualTest = await obisActualSchema.find({});
        expect(actualTest.length).toBe(0);
        const valueTest = await obisValueSchema.find({});
        expect(valueTest.length).toBe(0);
    });

});