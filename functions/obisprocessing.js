const logger = require('../utils/logging').logger;
const obis = require('smartmeter-obis');
const obisconfig = require('../conf/config').obis;
const intervalconf = require('../conf/config').intervals;
const obisValue = require('../schemas/obisValue');
const obisActual = require('../schemas/obisActual');

const OBIS_DEVID = '1-0:0.0.9';
const OBIS_POWER_SUM = '1-0:1.8.0';
const OBIS_POWER_CUR = '1-0:16.7.0'

var processingCounter = 0;

function processData(err, obisResult) {
    if (err) {
        // handle error
        // if you want to cancel the processing because of this error call smTransport.stop() before returning
        // else processing continues
        logger.error(err);
        return;
    }
    // increase processing counter
    processingCounter++;
    // always create obisActual, obisValue only if counter MOD interval = 0
    let obisActualEntry = new obisActual();
    let obisValueEntry = null;
    if (processingCounter % intervalconf.persistValuesInterval == 0) {
        obisValueEntry = new obisValue();
        // reset processing counter to 0 for new interval counting
        processingCounter = 0;
    }
    for (var obisId in obisResult) {
        let measurement = obisResult[obisId];
        if (measurement.idToString().startsWith(OBIS_DEVID)) {
            obisActualEntry.deviceid = measurement.values[0].value;
        }
        if (measurement.idToString().startsWith(OBIS_POWER_CUR)) {
            obisActualEntry.powerCurrent = measurement.values[0].value;
            obisActualEntry.powerCurrentUnit = measurement.values[0].unit;
        }
        if (obisValueEntry && measurement.idToString().startsWith(OBIS_POWER_SUM)) {
            obisValueEntry.powerSum = measurement.values[0].value;
            obisValueEntry.powerSumUnit = measurement.values[0].unit;
        }
    }
    if (obisValueEntry) {
        obisValueEntry.deviceid = obisActualEntry.deviceid;
        obisValueEntry.powerCurrent = obisActualEntry.powerCurrent;
        obisValueEntry.powerCurrentUnit = obisActualEntry.powerCurrentUnit
        obisValueEntry.save();
        logger.info('ObisValueEntry saved. (DEV_ID: ' + obisValueEntry.deviceid +
            ' CUR: ' + obisValueEntry.powerCurrent + obisValueEntry.powerCurrentUnit +
            ' SUM: ' + obisValueEntry.powerSum + obisValueEntry.powerSumUnit + ')');
    }
    obisActualEntry.save();
    logger.info('ObisActualEntry saved. (DEV_ID: ' + obisActualEntry.deviceid +
        ' CUR: ' + obisActualEntry.powerCurrent + obisActualEntry.powerCurrentUnit + ')');
}

module.exports = obis.init(obisconfig, processData);