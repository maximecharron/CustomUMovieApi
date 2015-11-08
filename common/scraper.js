var Crawler = require("js-crawler");
var qs = require('querystring');
var omdbEndPoint = 'http://api.themoviedb.org/3/';
var omdbApiKey = '7ff441f342ce66026152b06ccc348229';
var OMDBMovie = require('../models/omdbMovie').model;
var OMDBVideo = require('../models/omdbVideo').model;
var OMDBTvShow = require('../models/omdbTvShow').model;
var OMDBSeason = require('../models/omdbSeason').model;

var scrapeMovies = function (i) {
    if (i >= 135000) {
        return;
    }
    var crawler = new Crawler().configure({depth: 0});
    var url = omdbEndPoint + "movie/" + i + "?" + qs.stringify({api_key: omdbApiKey, append_to_response: "videos"});
    crawler.crawl({
        url: url, success: function (page) {
            OMDBMovie.findById(i, function (err, dbMovie) {
                if (!dbMovie) {
                    var content = JSON.parse(page.content);
                    var videos = [];
                    for (var i = 0; i < content.videos.results.length; i++) {
                        videos[i] = new OMDBVideo({
                            _id: content.videos.results[i].key,
                            type: content.videos.results[i].type
                        });
                    }
                    var movie = new OMDBMovie({
                        _id: content.id,
                        title: content.title,
                        videos: videos
                    })
                    movie.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                } else {
                    var content = JSON.parse(page.content);
                    var videos = [];
                    for (var i = 0; i < content.videos.results.length; i++) {
                        videos[i] = new OMDBVideo({
                            _id: content.videos.results[i].key,
                            type: content.videos.results[i].type
                        });
                    }
                    dbMovie.videos = videos;
                    dbMovie.title = content.title;
                    dbMovie.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            });
        },
        failure: function (page) {
            console.log("Status: " + page.status);
            console.log("ID: " + i);
        },
        finished: function (page) {
            console.log("ID:" + i);
        }
    });
    setTimeout(function () {
        scrapeMovies(i + 1)
    }, 400);

}

var scrapeTvshows = function (i) {
    if (i >= 61000) {
        return;
    }
    var crawler = new Crawler().configure({depth: 0});
    var url = omdbEndPoint + "tv/" + i + "?" + qs.stringify({api_key: omdbApiKey, append_to_response: "videos"});
    crawler.crawl({
        url: url, success: function (page) {
            OMDBTvShow.findById(i, function (err, dbTvShow) {
                if (!dbMovie) {
                    var content = JSON.parse(page.content);
                    var videos = [];
                    var seasons = [];
                    for (var i = 0; i < content.videos.results.length; i++) {
                        videos[i] = new OMDBVideo({
                            _id: content.videos.results[i].key,
                            type: content.videos.results[i].type
                        });
                    }
                    for (var i = 0; i < content.seasons.length; i++){
                        seasons[i] = new OMDBSeason({
                            id: content.seasons[i].season_number,
                            poster_path : content.seasons[i].poster_path
                        })
                    }
                    var tvShow = new OMDBTvShow({
                        _id: content.id,
                        title: content.name,
                        seasons: seasons,
                        videos: videos
                    })
                    tvShow.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                } else {
                    var content = JSON.parse(page.content);
                    var videos = [];
                    var seasons = [];
                    for (var i = 0; i < content.videos.results.length; i++) {
                        videos[i] = new OMDBVideo({
                            _id: content.videos.results[i].key,
                            type: content.videos.results[i].type
                        });
                    }
                    for (var i = 0; i < content.seasons.length; i++){
                        seasons[i] = new OMDBSeason({
                            id: content.seasons[i].season_number,
                            poster_path : content.seasons[i].poster_path
                        })
                    }
                    dbTvShow.seasons = seasons;
                    dbTvShow.videos = videos;
                    dbTvShow.title = content.name;
                    dbTvShow.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            });
        },
        failure: function (page) {
            console.log("Status: " + page.status);
            console.log("ID: " + i);
        },
        finished: function (page) {
            console.log("ID:" + i);
        }
    });
    setTimeout(function () {
        scrapeTvshows(i + 1)
    }, 400);

}


exports.scrapeMovies = function (req, res) {
    scrapeMovies(0);
    res.status(200).send("Scraping started.")
};

exports.scrapeTvShows = function (req, res) {
    scrapeTvshows(0);
    res.status(200).send("Scraping started.")
};