const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const obisActualSchema = require('../schemas/obisActual');
const obisValueSchema = require('../schemas/obisValue');

async function beforeEachTest() {
}

async function afterEachTest() {
    await obisValueSchema.deleteMany();
    await obisActualSchema.deleteMany();
}

async function beforeAllTests(server, mongoose) {
    const dbOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };
    await mongoose.connect(server.getUri(), dbOptions);
}

async function afterAllTests(server, mongoose) {
    await mongoose.connection.close();
    await server.stop();
}

module.exports = {
    setupTestDb(dbname) {

        var mongoServer = null;

        beforeAll(async () => {
            mongoServer = await MongoMemoryServer.create({ dbName: dbname });
            return beforeAllTests(mongoServer, mongoose);
        });

        afterAll(async () => {
            return afterAllTests(mongoServer, mongoose);
        });

        beforeEach(async () => {
            return beforeEachTest();
        });

        afterEach(async () => {
            return afterEachTest();
        });
    }
};