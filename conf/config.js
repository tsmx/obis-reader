const logger = require('../utils/logging').logger;
const conf = require('@tsmx/secure-config')();

if (conf != null) {
    logger.info('Using configuration ' + conf.name + '...');
}
else {
    logger.error('Could not load configuration!');
}

module.exports = conf;