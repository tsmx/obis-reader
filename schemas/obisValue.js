var mongoose = require('../utils/db').mongoose;
const dbconfig = require('../conf/config').database;

var obisValues = mongoose.Schema({
    date: { type: Date, default: Date.now, index: true },
    deviceid: { type: String, required: true, index: true },
    powerSum: Number,
    powerSumUnit: String,
    powerCurrent: Number,
    powerCurrentUnit: String
});

// compile & export the master data model
module.exports = mongoose.model('obisvalues', obisValues, dbconfig.collectionValues); 