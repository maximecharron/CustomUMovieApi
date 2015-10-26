var itunes = require('../common/itunes');

exports.getPopularMovies = function (req, res) {
    itunes.popular(res, "movie");
};

exports.getPopularTvShows = function (req, res) {
    itunes.popular(res, "tv");
};
