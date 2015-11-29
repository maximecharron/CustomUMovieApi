var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var modelHelpers = require('./modelHelpers.js');
var videoSchema = new Schema({
    _id: String,
    type: String
}, {strict:false});

videoSchema.method('toJSON', modelHelpers.toJSON);

var video = mongoose.model('OMDBVideo', videoSchema);

exports.schema = videoSchema;
exports.model = video;