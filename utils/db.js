var mongoose = require('mongoose');
const logger = require('./logging').logger;
const dbconfig = require('../conf/config').database;

const dbURI = dbconfig.protocol + '://' + dbconfig.server + (dbconfig.port ? (':' + dbconfig.port) : ('')) + '/' + dbconfig.database;
const dbOptions = {
    user: dbconfig.user,
    pass: dbconfig.password,
    useNewUrlParser: true,
    useUnifiedTopology: true
};

// Create the database connection 
function connect(cb) {
    logger.info('Trying to connect to ' + dbURI);
    mongoose.connect(dbURI, dbOptions);
    var db = mongoose.connection;
    db.on('error', function (err) {
        logger.error('Mongoose default connection error: ' + err);
        process.exit(1);
    });
    db.on('disconnected', function () {
        logger.info('Mongoose default connection disconnected');
    });
    db.once('open', function () {
        logger.info('Mongoose default connection open to ' + dbURI);
        cb();
    });
}

function shutdown() {
    mongoose.connection.close(function () {
        logger.info('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
}

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function () {
    shutdown();
});

module.exports.connect = function (cb) { connect(cb); };
module.exports.shutdown = function () { shutdown(); };
module.exports.mongoose = mongoose;