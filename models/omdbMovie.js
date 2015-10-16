var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var modelHelpers = require('./modelHelpers.js');

var movieSchema = new Schema({}, {strict:false});

movieSchema.method('toJSON', modelHelpers.toJSON);

var Movie = mongoose.model('OMDBMovie', movieSchema);

exports.schema = movieSchema;
exports.model = Movie;
