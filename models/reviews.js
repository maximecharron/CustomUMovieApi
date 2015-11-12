var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var modelHelpers = require('./modelHelpers.js');
var reviewSchema = new Schema({
    author: String,
    content : String,
    author_email: String
}, {strict:false});

reviewSchema.method('toJSON', modelHelpers.toJSON);

var Reviews = mongoose.model('Reviews', reviewSchema);

exports.schema = reviewSchema;
exports.model = Reviews;
