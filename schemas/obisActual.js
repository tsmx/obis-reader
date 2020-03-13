var mongoose = require('../utils/db').mongoose;
const dbconfig = require('../conf/config').database;

var obisActual = mongoose.Schema({
    date: { type: Date, default: Date.now, index: true, expires: '1d' },
    deviceid: { type: String, required: true, index: true },
    powerCurrent: Number,
    powerCurrentUnit: String
});

// compile & export the master data model
module.exports = mongoose.model('obisactuals', obisActual, dbconfig.collectionActuals); 