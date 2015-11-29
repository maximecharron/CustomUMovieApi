var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var modelHelpers = require('./modelHelpers.js');
var videoSchema = require('./omdbVideo').schema;
var seasonSchema = require('./omdbSeason').schema;
var tvshowSchema = new Schema({
    _id: Number,
    title: String,
    seasons : [seasonSchema],
    videos : [videoSchema]
}, {strict:false});

tvshowSchema.method('toJSON', modelHelpers.toJSON);

var TvShow = mongoose.model('OMDBTvShow', tvshowSchema);

exports.schema = tvshowSchema;
exports.model = TvShow;
