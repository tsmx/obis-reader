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

        async function beforeAll() {
            mongoServer = await MongoMemoryServer.create({ dbName: dbname });
            return beforeAllTests(mongoServer, mongoose);
        }

        async function afterAll() {
            return afterAllTests(mongoServer, mongoose);
        }

        async function beforeEach() {
            return beforeEachTest(loadDocuments);
        }

        async function afterEach() {
            return afterEachTest();
        }
    }
};