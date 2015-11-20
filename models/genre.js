var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var modelHelpers = require('./modelHelpers.js');

var genreSchema = new Schema({
    genreId : Number,
    genreName : String
});

genreSchema.method('toJSON', modelHelpers.toJSON);

var Genre = mongoose.model('Genre', genreSchema);

exports.schema = genreSchema;
exports.model = Genre;
