const logger = require('./utils/logging').logger;
const connectDB = require('./utils/db').connect;
const shutdown = require('./utils/db').shutdown;
const obisprocessing = require('./functions/obisprocessing');

connectDB(() => {
    logger.info('Connected to MongoDB');
    obisprocessing.process();
    if (process.env.NODE_ENV == 'production') {
        logger.info('Press CTRL+C to stop...');
    }
    else {
        setTimeout(() => {
            obisprocessing.stop();
            shutdown();
        }, 1000);
    }
});