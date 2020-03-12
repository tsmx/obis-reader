// declare and export a logger with local timestamp

var winston = require('winston');
var format = winston.format;

const myFormat = format.printf((info) => {
    return `${info.timestamp} ${info.level.toUpperCase()} ${info.message}`;
});

var transporters = [new winston.transports.Console()];
if (process.env.NODE_ENV == 'test') {
    transporters[0].silent = true;
}

var logger = winston.createLogger({
    format: format.combine(format.timestamp(), myFormat),
    transports: transporters
});

module.exports.logger = logger;