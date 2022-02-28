const logger = require('../utils/logging').logger;
const obis = require('smartmeter-obis');
const obisconfig = require('../conf/config').obis;
const intervalconf = require('../conf/config').intervals;
const obisValue = require('../schemas/obisValue');
const obisActual = require('../schemas/obisActual');

const OBIS_DEVID = '1-0:0.0.9';
const OBIS_POWER_SUM = '1-0:1.8.0';
const OBIS_POWER_CUR = '1-0:16.7.0'

var lastPersist = null;

async function processData(err, obisResult) {
    if (err) {
        // handle error
        // if you want to cancel the processing because of this error call smTransport.stop() before returning
        // else processing continues
        logger.error(err);
        return;
    }
    // always create obisActual, obisValue only if next persistence interval is reached or not set
    let obisActualEntry = new obisActual();
    let obisValueEntry = null;
    // logger.info('Last: ' + lastPersist);
    let testDate = (lastPersist ? new Date(lastPersist.getTime() + (intervalconf.persistValuesMinutes * 60000)) : null);
    // logger.info('Next: ' + testDate);
    let currentDate = new Date();
    // logger.info('Curr: ' + currentDate);
    if ((intervalconf.persistValuesMinutes == -1) ||
        (testDate == null) ||
        (currentDate >= testDate)) {
        obisValueEntry = new obisValue();
        // set last persistence date
        lastPersist = currentDate;
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
        try {
            let obisValueDoc = await obisValueEntry.save();
            logger.info('ObisValueEntry saved with ID ' + obisValueDoc.id + '. (DEV_ID: ' + obisValueEntry.deviceid +
                ' CUR: ' + obisValueEntry.powerCurrent + obisValueEntry.powerCurrentUnit +
                ' SUM: ' + obisValueEntry.powerSum + obisValueEntry.powerSumUnit + ')');
        }
        catch (err) {
            logger.error(err.message);
        }
    }
    try {
        let obisActualDoc = await obisActualEntry.save();
        logger.info('ObisActualEntry saved with ID ' + obisActualDoc.id + '. (DEV_ID: ' + obisActualEntry.deviceid +
            ' CUR: ' + obisActualEntry.powerCurrent + obisActualEntry.powerCurrentUnit + ')');
    }
    catch (err) {
        logger.error(err.message);
    }
}

module.exports = obis.init(obisconfig, processData);