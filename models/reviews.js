var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var modelHelpers = require('./modelHelpers.js');
var reviewSchema = new Schema({
    author: String,
    author_email: String,
    content: String,
    type: String,
    featureId: String
}, {strict:false});

reviewSchema.method('toJSON', modelHelpers.toJSON);

var Reviews = mongoose.model('Reviews', reviewSchema);

exports.schema = reviewSchema;
exports.model = Reviews;
