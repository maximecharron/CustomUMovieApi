var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var modelHelpers = require('./modelHelpers.js');
var reviewSchema = new Schema({
    content : String,
    owner: {
        id: String,
        email: String,
        name: String
    },
    featureId: String
}, {strict:false});

reviewSchema.method('toJSON', modelHelpers.toJSON);

var Reviews = mongoose.model('Reviews', reviewSchema);

exports.schema = reviewSchema;
exports.model = Reviews;
