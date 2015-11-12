var itunes = require('../common/itunes');

exports.getActor = function (req, res) {
    itunes.lookup({
        id: req.params.id,
        entity: 'movieArtist'
    }, res, 'single');
};

exports.getActorMovies = function (req, res) {
    itunes.lookup({
        id: req.params.id,
        entity: 'movie'
    }, res, 'many');
};

exports.getMovie = function (req, res) {
    itunes.lookup({
        id: req.params.id,
        entity: 'movie'
    }, res, 'single');
};

exports.getTvShowSeason = function (req, res) {
    itunes.lookup({
        id: req.params.id,
        entity: 'tvSeason'
    }, res, 'single');
};

exports.getTvShowEpisodes = function (req, res) {
    itunes.lookup({
        id: req.params.id,
        entity: 'tvEpisode'
    }, res, 'many');
};

exports.getMovieReviews = function(req, res){
    itunes.reviews({
        id: req.params.id,
        type: 'movie'
    }, res);
};
