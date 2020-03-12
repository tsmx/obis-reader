const obis = require('smartmeter-obis');
const logger = require('./utils/logging').logger;
const connectDB = require('./utils/db').connect;
const shutdown = require('./utils/db').shutdown;
const obisconfig = require('./conf/config').obis;
const obisSchema = require('./schemas/obisSchema');

const OBIS_DEVID = '1-0:0.0.9';
const OBIS_POWER_SUM = '1-0:1.8.0';
const OBIS_POWER_CUR = '1-0:16.7.0'

function processData(err, obisResult) {
    if (err) {
        // handle error
        // if you want to cancel the processing because of this error call smTransport.stop() before returning
        // else processing continues
        logger.error(err);
        return;
    }
    let obisEntry = new obisSchema();
    for (var obisId in obisResult) {
        let measurement = obisResult[obisId];
        if (measurement.idToString().startsWith(OBIS_DEVID)) {
            obisEntry.deviceid = measurement.values[0].value;
        }
        if (measurement.idToString().startsWith(OBIS_POWER_SUM)) {
            obisEntry.powerSum = measurement.values[0].value;
            obisEntry.powerSumUnit = measurement.values[0].unit;
        }
        if (measurement.idToString().startsWith(OBIS_POWER_CUR)) {
            obisEntry.powerCurrent = measurement.values[0].value;
            obisEntry.powerCurrentUnit = measurement.values[0].unit;
        }
        logger.info(
            obisResult[obisId].idToString() + ': ' +
            obis.ObisNames.resolveObisName(obisResult[obisId], obisconfig.obisNameLanguage).obisName + ' = ' +
            obisResult[obisId].valueToString()
        );
    }
    obisEntry.save();
}

connectDB(() => {
    logger.info('Connected to MongoDB');
    const smTransport = obis.init(obisconfig, processData);
    smTransport.process();
    if (process.env.NODE_ENV == 'production') {
        logger.info('Press CTRL+C to stop...');
    }
    else {
        setTimeout(() => {
            smTransport.stop();
            shutdown();
        }, 1000);
    }
});