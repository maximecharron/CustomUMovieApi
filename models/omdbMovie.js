var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var modelHelpers = require('./modelHelpers.js');
var videoSchema = require('./omdbVideo').schema;
var movieSchema = new Schema({
    _id: Number,
    title: String,
    videos : [videoSchema]
}, {strict:false});

movieSchema.method('toJSON', modelHelpers.toJSON);

var Movie = mongoose.model('OMDBMovie', movieSchema);

exports.schema = movieSchema;
exports.model = Movie;
