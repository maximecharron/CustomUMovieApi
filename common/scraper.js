/**
 * Created by maxime on 2015-10-13.
 */

var Crawler = require("js-crawler");
var qs = require('querystring');
var omdbEndPoint = 'http://api.themoviedb.org/3/';
var omdbApiKey = '7ff441f342ce66026152b06ccc348229';
var OMDBMovie = require('../models/omdbMovie').model;

var scrape = function (i) {
    if (i >= 778) {
        console.log("Done!");
        return "We did it!";
    }
    var crawler = new Crawler().configure({depth: 0});
    var url = omdbEndPoint + "movie/" + i + "?" + qs.stringify({api_key: omdbApiKey});
    crawler.crawl({
        url: url, success: function (page) {
            OMDBMovie.findById(i, function (err, dbMovie) {
                if (!dbMovie) {
                    var movie = new OMDBMovie({
                        _id: JSON.parse(page.content).id,
                        other: JSON.parse(page.content)
                    })
                    movie.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                } else {
                    dbMovie.other = JSON.parse(page.content);
                    dbMovie.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            });
        },
        failure: function (page) {
            console.log("Status: "+ page.status);
            console.log("ID: "+i);
        },
        finished: function (page) {
            console.log("ID:" + i);
        }
    });
    setTimeout(function () {
        scrape(i + 1)
    }, 400);

}

exports.scrape = function (req, res) {
    scrape(578);
    res.status(200).send("Scraping started.")
};
