const logger = require('../utils/logging').logger;

var conf = null;
if (process.env.NODE_ENV == 'production') {
    logger.info('Using configuration config-prod...');
    conf = require('./config-prod.json');
}
else {
    logger.info('Using configuration config-dev...');
    conf = require('./config-dev.json');
}

module.exports = conf;