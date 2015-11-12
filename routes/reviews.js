var itunes = require('../commons/itunes');

exports.getMovieReviews = function(req, res){
    itunes.reviews({
        id: req.params.id,
        type: 'movie'
    }, res);
};