var request = require('request');
var qs = require('querystring');
var async = require('async');

var searchEndPoint = 'http://itunes.apple.com/search?';
var lookupEndPoint = 'http://itunes.apple.com/lookup?';
var youtubeKey = 'AIzaSyDuaXMmUCegznJkT3oZeStMxoPyRiVoq4M';
var youtubeEndPoint = 'https://www.googleapis.com/youtube/v3/search?part=snippet&';
var omdbEndPoint = 'http://api.themoviedb.org/3/';
var omdbApiKey = '7ff441f342ce66026152b06ccc348229';
var imageEndPoint = 'http://image.tmdb.org/t/p/w500';

exports.search = function (parameters, res) {
    if (parameters.entity == "movieArtist") {
        queryItunesApiForActor(searchEndPoint + qs.stringify(parameters), res);
    } else {
        queryItunesApi(searchEndPoint + qs.stringify(parameters), res, parameters.entity);
    }
};

exports.lookup = function (parameters, res, amount) {
    if (parameters.entity == "movieArtist") {
        queryItunesApiForActor(lookupEndPoint + qs.stringify(parameters), res, amount);
    } else {
        queryItunesApi(lookupEndPoint + qs.stringify(parameters), res, amount, parameters.entity);
    }

};


function queryItunesApi(url, res, amount, type) {
    request({
            uri: url,
            method: 'GET'
        },
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                successItunesCallback(res, JSON.parse(body), amount, type);
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
            } else {
                errorCallback(res, error, response, body);
            }
        }
    );
}

function successItunesActorCallback(res, body, amount) {
    var results;
    if (amount == 'many') {
        body.results.splice(0, 1);
        body.resultCount--;
        callOMDB(res, body);
    }
    else {
        callOMDB(res, body);
    }
}

function successItunesCallback(res, body, amount, type) {
    var results;
    if (amount == 'many') {
        body.results.splice(0, 1);
        body.resultCount--;
        callYoutube(res, body);
    }
    else if (amount == 'single') {
        getVideoAndReviews(res, body, type);
    }
    else {
        callYoutube(res, body);
    }
}

function getVideoAndReviews(res, body, type) {
    var results = body.results
    async.forEachOf(results, function (result, iterator, successYoutubeCallback) {
        var urlSearch;
        var baseUrlLookup;
        if (type.contains('tv')){
            urlSearch = omdbEndPoint + "search/tv?" + qs.stringify({
                    query: results[iterator].artistName,
                    api_key: omdbApiKey
                });
            baseUrlLookup = omdbEndPoint + "tv/";
        }else{
            urlSearch = omdbEndPoint + "search/movie?" + qs.stringify({
                    query: results[iterator].trackName,
                    api_key: omdbApiKey
                });
            baseUrlLookup = omdbEndPoint + "movie/";
        }

        var id;
        async.parallel([
                async.waterfall([function (successSearchCallback) {
                    request({
                            uri: urlSearch,
                            method: 'GET'
                        },
                        function (error, response, body) {
                            if (!error && response.statusCode === 200) {
                                id = JSON.parse(body).results[0].id;
                            } else {
                                console.log("Failed to get data for " + result.trackName);
                            }
                            successSearchCallback(null);
                        }
                    );
                }, function (successSingleCallback) {
                    request({
                            uri: baseUrlLookup + id + "?" + qs.stringify({api_key: omdbApiKey}),
                            method: 'GET'
                        },
                        function (error, response, body) {
                            if (!error && response.statusCode === 200) {
                                //TODO: Parse result
                            } else {
                                console.log("Failed to get movie/tvshow for " + result.trackName);
                                console.log(response);
                            }
                            successSingleCallback(null);
                        }
                    );
                }]),
                function(successReviewsCallback){
                    if (type == 'movie'){
                        baseUrlLookup = baseUrlLookup +id+"/reviews"
                    } else if (type == 'tvSeason'){
                        baseUrlLookup = baseUrlLookup +id+"/reviews"
                    } else {

                    }
                    request({
                        uri: omdbEndPoint + "person/" + id + "?" + qs.stringify({api_key: omdbApiKey}),
                        method: 'GET'
                    })
                }
            ]
            , successYoutubeCallback
        )
    }, function (error) {
        body.results = results;
        res.status(200).send(body);
    })
}

function callOMDB(res, body) {
    var results = body.results
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
                            console.log("Failed to get actor for " + result.artistName);
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
    var results = body.results
    async.forEachOf(results, function (result, iterator, successYoutubeCallback) {
        var url = youtubeEndPoint + qs.stringify({q: results[iterator].trackName + " Trailer", key: youtubeKey});
        request({
                uri: url,
                method: 'GET'
            },
            function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    results[iterator].previewUrl = "https://www.youtube.com/watch?v=" + JSON.parse(body).items[0].id.videoId;
                } else {
                    console.log("Failed to get video for " + result.trackName);
                }
                successYoutubeCallback(null);
            }
        );
    }, function (error) {
        body.results = results;
        res.status(200).send(body);
    })
}


function errorCallback(res, error, response, body) {
    console.error(error, body);
    res.status(response.statusCode).send(body);
}