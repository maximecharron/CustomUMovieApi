var itunes = require('../common/itunes');

exports.getPopularMovies = function (req, res) {
    itunes.popular(res, "movie");
};

exports.getPopularTvShows = function (req, res) {
    itunes.popular(res, "tv");
};

exports.getSimilarMovies = function(req, res){
  itunes.similar(req, res, 'movie');
};

exports.getSimilarTvshows = function(req, res){
    itunes.similar(req, res, 'tv');
};
