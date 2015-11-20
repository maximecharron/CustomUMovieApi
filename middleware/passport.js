var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user').model;
var moment = require('moment');
var jwt = require('jwt-simple');
var Genre = require('../models/genre').model;

module.exports = function (passport, app) {
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use('local-login', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, username, password, done) {


            process.nextTick(function () {
                User.findOne({ 'username': username }, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    if (!user || !user.validPassword(password)) {
                        return done(null, false);
                    }

                    var expires = moment().add(1, 'days').valueOf();
                    user.token = jwt.encode(
                        {
                            iss: user.id,
                            exp: expires
                        },
                        app.get('jwtTokenSecret')
                    );

                    user.save(function (err) {
                        if (err) {
                            return done(err);
                        }

                        return done(null, user);
                    });
                });
            });
        }));

    passport.use('local-signup', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, username, password, done) {

            process.nextTick(function () {
                if (!req.user) {
                    User.findOne({ 'email': username }, function (err, user) {
                        if (err) {
                            return done(err);
                        }

                        if (user) {
                            return done("The user with username " + username + " already exists and could not be created.");
                        } else {
                            var newUser = new User();
                            var genres = [];
                            for (var genre in req.body.genres){
                                var genreSchema = new Genre();
                                genreSchema.id = genre.id;
                                genreSchema.name = genre.name;
                                genres.push(genreSchema);
                            }
                            newUser.firstname = req.body.firstname;
                            newUser.lastname = req.body.lastname;
                            newUser.email = req.body.email;
                            newUser.genres = genres;
                            newUser.username = username;
                            newUser.password = newUser.generateHash(password);

                            newUser.save(function (err) {
                                if (err) {
                                    return done(err);
                                }

                                return done(null, newUser);
                            });
                        }
                    });
                } else if (!req.user.username) {
                    var user = req.user;
                    user.username = username;
                    user.password = user.generateHash(password);
                    user.save(function (err) {
                        if (err) {
                            return done(err);
                        }

                        return done(null, user);
                    });
                } else {
                    return done(null, req.user);
                }
            });

        }));
};

