var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var modelHelpers = require('./modelHelpers.js');
var seasonSchema = new Schema({
    id: String,
    poster_path: String
}, {strict:false});

seasonSchema.method('toJSON', modelHelpers.toJSON);

var season = mongoose.model('OMDBSeason', seasonSchema);

exports.schema = seasonSchema;
exports.model = season;