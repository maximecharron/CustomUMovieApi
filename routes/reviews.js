var Reviews = require('../models/reviews').model;
var User = require('../models/user').model;

exports.getMovieReviews = function (req, res) {
    Reviews.find({featureId: req.params.id}, function (err, reviews) {
        if (!err) {
            if (reviews) {
                res.status(200).send(reviews);
            } else {
                sendReviewsNotFoundError();
            }
        } else {
            handleFindError();
        }
    })
};

exports.addReviews = function (req, res) {
    User.findById(req.user.id, function (err, user) {
        if (!err) {
            if (!user) {
                if (req.body) {
                    var review = new Reviews({
                        author: req.user.name,
                        author_email: req.user.email,
                        content: req.body.content,
                        featureId: req.params.id
                    });
                    review.save();
                    res.status(200).send(review);
                } else {
                    res.status(412).send({
                        errorCode: 'REQUEST_BODY_REQUIRED',
                        message: 'Request body is missing'
                    });
                }
            } else {
                res.status(403).send("User unauthorized");
            }
        } else {
            console.error(err);
            res.status(500).send(err);
        }
    });
};


function handleFindError(err, res, req) {
    console.error(err);
    if (err.name === 'CastError') {
        sendReviewsNotFoundError(res, req);
    } else {
        res.status(500).send(err);
    }
}

function sendReviewsNotFoundError(res, req) {
    res.status(404).send({
        errorCode: 'REVIEWS_NOT_FOUND',
        message: 'Reviews for feature with id ' + req.params.id + ' was not found'
    });
}