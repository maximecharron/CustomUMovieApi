var request = require('request');
var qs = require('querystring');
var async = require('async');
var OMDBMovie = require('../models/omdbMovie').model;
var OMDBVideo = require('../models/omdbVideo').model;
var OMDBTvShow = require('../models/omdbTvShow').model;
var OMDBSeason = require('../models/omdbSeason').model;

var searchEndPoint = 'http://itunes.apple.com/search?';
var lookupEndPoint = 'http://itunes.apple.com/lookup?';
var youtubeKey = 'AIzaSyDuaXMmUCegznJkT3oZeStMxoPyRiVoq4M';
var youtubeEndPoint = 'https://www.googleapis.com/youtube/v3/search?part=snippet&';
var omdbEndPoint = 'http://api.themoviedb.org/3/';
var omdbApiKey = '7ff441f342ce66026152b06ccc348229';
var imageEndPoint = 'http://image.tmdb.org/t/p/w500';

exports.search = function (parameters, res) {
    queryItunesApi(searchEndPoint + qs.stringify(parameters), res, parameters.entity);
};

exports.lookup = function (parameters, res, amount) {
    if (parameters.entity == "movieArtist") {
        queryItunesApiForActor(lookupEndPoint + qs.stringify(parameters), res, amount);
    } else {
        queryItunesApi(lookupEndPoint + qs.stringify(parameters), res, amount, parameters.entity);
    }
};

exports.popular = function (res, type) {
    queryOmdbPopular(res, type);
};

exports.similar = function (req, res, type) {
    queryOmdbSimilar(req, res, type);
}

function queryItunesApi(url, res, amount, type) {
    request({
            uri: url,
            method: 'GET'
        },
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                successItunesCallback(res, JSON.parse(body), amount, type);
                console.log(url);
            } else {
                errorCallback(res, error, response, body);
            }
        }
    );
}

function queryItunesApiForActor(url, res, amount) {
    request({
            uri: url,
            method: 'GET'
        },
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                successItunesActorCallback(res, JSON.parse(body), amount);
                console.log(url);
            } else {
                errorCallback(res, error, response, body);
            }
        }
    );
}
function queryOmdbPopular(res, type) {
    var urlPopular;
    if (type == "tv") {
        urlPopular = omdbEndPoint + "tv/popular?" + qs.stringify({
                api_key: omdbApiKey
            })
    } else {
        urlPopular = omdbEndPoint + "movie/popular?" + qs.stringify({
                api_key: omdbApiKey
            })
    }
    var results;
    var itunesResults = [];
    async.waterfall([function (successPopularCallback) {
        request({
                uri: urlPopular,
                method: 'GET'
            },
            function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    results = JSON.parse(body).results;
                    results.splice(10, 10);
                } else {
                    console.log("Failed to get popular movies/tv shows");
                }
                successPopularCallback(null);
            }
        );
    }, function (successItunesCallback) {
        async.forEachOf(results, function (result, iterator, successYoutubeCallback) {
            var urlSearch;
            if (type == "movie") {
                urlSearch = searchEndPoint + qs.stringify({
                        term: result.original_title,
                        media: 'movie',
                        entity: 'movie',
                        limit: 1
                    })
            } else {
                urlSearch = searchEndPoint + qs.stringify({
                        term: result.original_name,
                        media: 'tvShow',
                        entity: 'tvSeason',
                        limit: 1
                    })
            }
            request({
                    uri: urlSearch,
                    method: 'GET'
                },
                function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        if (JSON.parse(body).results[0] !== undefined) {
                            var itunesResult = JSON.parse(body).results[0];
                            itunesResult.poster_path = imageEndPoint + result.poster_path;
                            itunesResult.omdbId = result.id;
                            itunesResults.push(itunesResult);
                        }
                    } else {
                        errorCallback(res, error, response, body);
                    }
                    successYoutubeCallback(null);
                }
            );
        }, function (error) {
            successItunesCallback(null);
        })
    }, function (callback, error) {
        if (error) {
            console.log(error);
        }
        callYoutube(res, itunesResults)
        callback(null);
    }])
}

function queryOmdbSimilar(req, res, type) {
    var urlPopular;
    urlPopular = omdbEndPoint + type + "/" + req.params.id + "/similar?" + qs.stringify({
            api_key: omdbApiKey,
            append_to_response: "video"
        })
    var results;
    var itunesResults = [];
    async.waterfall([function (successPopularCallback) {
        request({
                uri: urlPopular,
                method: 'GET'
            },
            function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    results = JSON.parse(body).results;
                    results.splice(10, 10);
                } else {
                    console.log("Failed to get popular movies/tv shows");
                }
                successPopularCallback(null);
            }
        );
    }, function (successItunesCallback) {
        async.forEachOf(results, function (result, iterator, successYoutubeCallback) {
            var urlSearch;
            console.log(results.length);
            if (type == 'movie') {
                urlSearch = searchEndPoint + qs.stringify({
                        term: result.original_title,
                        media: 'movie',
                        entity: 'movie',
                        limit: 1
                    })
            } else {
                urlSearch = searchEndPoint + qs.stringify({
                        term: result.original_name,
                        media: 'tvShow',
                        entity: 'tvSeason',
                        limit: 1
                    })
            }
            request({
                    uri: urlSearch,
                    method: 'GET'
                },
                function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        if (JSON.parse(body).results[0] !== undefined) {
                            var itunesResult = JSON.parse(body).results[0];
                            itunesResult.poster_path = imageEndPoint + result.poster_path;
                            itunesResult.omdbId = result.id;
                            itunesResults.push(itunesResult);
                        }
                    } else {
                        errorCallback(res, error, response, body);
                    }
                    successYoutubeCallback(null);
                }
            );
        }, function (error) {
            successItunesCallback(null);
        })
    }, function (callback, error) {
        if (error) {
            console.log(error);
        }
        callYoutube(res, itunesResults)
        callback(null);
    }])
}

function successItunesActorCallback(res, body, amount) {
    var results;
    if (amount == 'many') {
        body.results.splice(0, 1);
        body.resultCount--;
        callOMDBActor(res, body);
    }
    else {
        callOMDBActor(res, body);
    }
}

function successItunesCallback(res, body, amount, type) {
    var results;
    if (amount == 'many') {
        body.results.splice(0, 1);
        body.resultCount--;
        callYoutube(res, body);
    }
    else {
        callYoutube(res, body);
    }
}

function callOMDBActor(res, body) {
    var results = body.results || body;
    async.forEachOf(results, function (result, iterator, successYoutubeCallback) {
        var urlSearch = omdbEndPoint + "search/person?" + qs.stringify({
                query: results[iterator].artistName,
                api_key: omdbApiKey
            });
        var id;
        async.waterfall([function (successSearchCallback) {
                request({
                        uri: urlSearch,
                        method: 'GET'
                    },
                    function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            id = JSON.parse(body).results[0].id;
                        } else {
                            console.log("Failed to get id for " + result.artistName);
                        }
                        successSearchCallback(null);
                    }
                );
            }, function (successSingleCallback) {
                request({
                        uri: omdbEndPoint + "person/" + id + "?" + qs.stringify({api_key: omdbApiKey}),
                        method: 'GET'
                    },
                    function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            result.biography = JSON.parse(body).biography;
                            result.birthday = JSON.parse(body).birthday;
                            result.deathday = JSON.parse(body).deathday;
                            result.placeOfBirth = JSON.parse(body).place_of_birth;
                            result.image = imageEndPoint + JSON.parse(body).profile_path;
                        } else {
                            console.log("Failed to get actor for " + result.artistName);
                            console.log(response);
                        }
                        successSingleCallback(null);
                    }
                );
            }]
            , successYoutubeCallback
        )
    }, function (error) {
        body.results = results;
        res.status(200).send(body);
    })
}

function callYoutube(res, body) {
    var results = body.results || body;
    async.forEachOf(results, function (result, iterator, successYoutubeCallback) {
        var url;
        if (results[iterator].trackName !== undefined) {
            var regex = new RegExp("(.*){1}(\(\d*\)){1,}");

            var omdbSearchTitle = regex.exec(results[iterator].trackName);
            if (!results[iterator].omdbId) {
                OMDBMovie.find({"title": omdbSearchTitle[1]}, function (err, omdbmovie) {
                    if (omdbmovie[0] == undefined) {
                        var url = youtubeEndPoint + qs.stringify({
                                q: results[iterator].trackName + " Trailer",
                                key: youtubeKey
                            });
                        request({
                                uri: url,
                                method: 'GET'
                            },
                            function (error, response, body) {
                                if (!error && response.statusCode === 200) {
                                    result.previewUrl = "https://www.youtube.com/watch?v=" + JSON.parse(body).items[0].id.videoId;
                                } else {
                                    console.log("Failed to get video for " + results[iterator].trackName);
                                }
                                successYoutubeCallback(null);
                            }
                        );
                    } else {
                        results[iterator].videos = omdbmovie[0].videos;
                        for (var video in omdbmovie[0].videos) {
                            if (omdbmovie[0].videos[video].type == "Trailer") {
                                results[iterator].previewUrl = "https://www.youtube.com/watch?v=" + omdbmovie[0].videos[video]._id;
                            }
                        }
                        successYoutubeCallback(null);
                    }

                });
            } else {
                OMDBMovie.find({"_id": results[iterator].omdbId}, function (err, omdbmovie) {
                    if (omdbmovie[0] == undefined) {
                        var url = youtubeEndPoint + qs.stringify({
                                q: results[iterator].trackName + " Trailer",
                                key: youtubeKey
                            });
                        request({
                                uri: url,
                                method: 'GET'
                            },
                            function (error, response, body) {
                                if (!error && response.statusCode === 200) {
                                    results[iterator].previewUrl = "https://www.youtube.com/watch?v=" + JSON.parse(body).items[0].id.videoId;
                                } else {
                                    console.log("Failed to get video for " + results[iterator].trackName);
                                }
                                successYoutubeCallback(null);
                            }
                        );
                    } else {
                        results[iterator].videos = omdbmovie[0].videos;
                        for (var video in omdbmovie[0].videos) {
                            if (omdbmovie[0].videos[video].type == "Trailer") {
                                console.log("in omdb movie");
                                results[iterator].previewUrl = "https://www.youtube.com/watch?v=" + omdbmovie[0].videos[video]._id;
                                successYoutubeCallback(null);
                            }
                        }
                        if (results[iterator].previewUrl.indexOf("youtube") == -1){
                            console.log("youtube");
                            request({
                                    uri: url,
                                    method: 'GET'
                                },
                                function (error, response, body) {
                                    if (!error && response.statusCode === 200) {
                                        results[iterator].previewUrl = "https://www.youtube.com/watch?v=" + JSON.parse(body).items[0].id.videoId;
                                    } else {
                                        console.log("Failed to get video for " + results[iterator].trackName);
                                    }
                                    successYoutubeCallback(null);
                                }
                            );
                        }
                    }

                });
            }

        } else {
            url = youtubeEndPoint + qs.stringify({
                    q: results[iterator].collectionName + " Trailer",
                    key: youtubeKey
                });
            var regex = new RegExp("(.*){1}(, Season (\d)*.*){1}", "g");

            var omdbSearchTitle = regex.exec(results[iterator].collectionName);
            async.waterfall([function (successMongoCallback) {
                if (omdbSearchTitle != null) {
                    OMDBTvShow.find({"title": omdbSearchTitle[1]}, function (err, omdbmovie) {
                        if (omdbmovie[0] != undefined) {
                            results[iterator].poster_path = omdbmovie[0].seasons[omdbSearchTitle[3]];
                        }

                    });
                }
                successMongoCallback(null);
            }, function (successYoutubeCallback) {
                request({
                        uri: url,
                        method: 'GET'
                    },
                    function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            results[iterator].previewUrl = "https://www.youtube.com/watch?v=" + JSON.parse(body).items[0].id.videoId;
                        } else {
                            console.log("Failed to get video for " + results[iterator].trackName);
                        }
                        successYoutubeCallback(null);
                    }
                )
                ;
            }, function (callback, error) {
                if (error){
                    console.log(error);
                }
                callback(null);
            }]);
            successYoutubeCallback(null);
        }
    }, function (error) {
        body.results = results;
        res.status(200).send(body);
    })
}

function successCallback(res, body) {
    res.status(200).send(body.results);
}

function errorCallback(res, error, response, body) {
    console.error(error, body);
    res.status(response.statusCode).send(body);
}