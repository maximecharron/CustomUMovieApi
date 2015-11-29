var request = require('request');
var Genres = require('../models/genre').model;
exports.getMoviesGenres = function (req, res) {
    getGenresInCache(req, res, '33');
};

exports.getTvShowsGenres = function (req, res) {
    getGenresInCache(req, res, '32');
};

exports.cache = function (req, res) {
    getGenres(req, res, '32', true);
    getGenres(req, res, '33', true);
}

function getGenres(req, res, entityCode, isCaching) {
    request({
            uri: 'https://itunes.apple.com/WebObjects/MZStoreServices.woa/ws/genres',
            method: 'GET'
        },
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                successCallback(res, JSON.parse(body), entityCode, isCaching);
            } else {
                errorCallback(res, error, response, body);
            }
        }
    );
}

function getGenresInCache(req, res, entityCode) {
    Genres.find({'entityCode': entityCode}, function (err, genres) {
        if (!err) {
            if (genres && genres.length > 0) {
                res.status(200).seng(genres);
            } else {
                getGenres(req, res, entityCode, false);
            }
        } else {
            getGenres(req, res, entityCode, false);
        }
    });
}

function successCallback(res, body, entityCode, isCaching) {
    // 33 corresponds to the movie entity.
    var genres = [];
    var subgenres = body[entityCode]['subgenres'];
    for (var subgenre in subgenres) {
        var genre = subgenres[subgenre];
        genres.push({id: genre['id'], name: genre['name']});
        if (isCaching) {
            var genreDb = new Genres({
                entityCode: entityCode,
                name: genre['name'],
                id: genre['id']
            });
            genreDb.save();
        }
    }
    res.status(200).send(genres);
}

function errorCallback(res, error, response, body) {
    console.error(error, body);
    res.status(response.statusCode).send(body);
}