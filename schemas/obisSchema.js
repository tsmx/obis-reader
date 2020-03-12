var mongoose = require('../utils/db').mongoose;

var obisSchema = mongoose.Schema({
    date: { type: Date, default: Date.now },
    deviceid: { type: String, required: true, index: true },
    powerSum: Number,
    powerSumUnit: String,
    powerCurrent: Number,
    powerCurrentUnit: String
});

// compile & export the master data model
module.exports = mongoose.model('obisvalues', obisSchema, 'obisvalues'); 