var passport = require('passport');
var request = require('request');
var User = require('../models/user').model;
var moment = require('moment');
var jwt = require('jwt-simple');
var  FACEBOOK_SECRET = '261ad1a5ff2a723b295f329dd97bb09d';
var  GOOGLE_SECRET =  'jJw1sxBOFvaMF66zb1RuSiuu';
var local_FACEBOOK_SECRET = 'aa21704d3b854ef4c9666992523da3af';
var tokenSecret = 'UBEAT_TOKEN_SECRET' || process.env.TOKEN_SECRET;

var authentication = require('../middleware/authentication');

exports.showLoginPage = function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
    req.session.destroy();
};

exports.passportLogin = passport.authenticate('local-login', {
    successRedirect: '/token',
    failureRedirect: '/login',
    failureFlash: true
});

exports.getToken = function (req, res) {
    if (req.user) {
        res.send(req.user);
    } else {
        var token = authentication.retrieveToken(req);
        if (token) {
            res.status(401).send({
                errorCode: 'ACCESS_DENIED',
                message: 'User associated with token was not found'
            });
        } else {
            res.status(401).send({
                errorCode: 'ACCESS_DENIED',
                message: 'Access token is missing'
            });
        }
    }
    req.session.destroy();
};

exports.logout = function (req, res) {
    req.session.destroy();
    req.logout();
    res.status(200).send();
};

exports.googleLogin = function(req, res) {
    var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
    var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: GOOGLE_SECRET,
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
    };

    // Step 1. Exchange authorization code for access token.
    request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
        var accessToken = token.access_token;
        var headers = { Authorization: 'Bearer ' + accessToken };

        // Step 2. Retrieve profile information about the current user.
        request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {
            if (profile.error) {
                return res.status(500).send({message: profile.error.message});
            }
            // Step 3a. Link user accounts.
            if (req.headers.authorization) {
                User.findOne({ google: profile.sub }, function(err, existingUser) {
                    if (existingUser) {
                        return res.status(409).send({ message: 'There is already a Google account that belongs to you' });
                    }
                    var token = req.headers.authorization.split(' ')[1];
                    var payload = jwt.decode(token, config.TOKEN_SECRET);
                    User.findById(payload.sub, function(err, user) {
                        if (!user) {
                            return res.status(400).send({ message: 'User not found' });
                        }
                        user.google = profile.sub;
                        user.picture = user.picture || profile.picture.replace('sz=50', 'sz=200');
                        user.username = user.username || profile.name;
                        // split display name to populate first and last name
                        var splittedName = profile.name.split(" ");
                        user.name = profile.name;
                        user.firstname = user.firstname || splittedName[0];
                        user.lastname = user.lastname || splittedName[1];
                        user.token = createJWT(user);
                        console.log(user);
                        console.log(user.token);
                        user.save(function(err) {
                            res.send(user);
                        });
                    });
                });
            } else {
                // Step 3b. Create a new user account or return an existing one.
                User.findOne({ google: profile.sub }, function(err, existingUser) {
                    if (existingUser) {
                        return res.send(existingUser);
                    }
                    var user = new User();
                    user.google = profile.sub;
                    user.picture = profile.picture.replace('sz=50', 'sz=200');
                    user.username = user.username || profile.name;
                    user.email = user.email || profile.email;
                    // split display name to populate first and last name
                    var splittedName = profile.name.split(" ");
                    user.name = profile.name;
                    user.firstname = user.firstname || splittedName[0];
                    user.lastname = user.lastname || splittedName[1];
                    user.token = createJWT(user);
                    console.log(user);
                    console.log(user.token);
                    user.save(function(err) {
                        res.send(user);
                    });
                });
            }
        });
    });
};

function createJWT(user){
    var expires = moment().add(1, 'days').valueOf();
    user.token = jwt.encode(
        {
            iss: user.id,
            exp: expires
        },
        tokenSecret
    );
    return user.token;
};

exports.facebook = function(req, res) {
    var fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name'];
    var accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
    var graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
    var token = FACEBOOK_SECRET;
    if (req.get('origin').indexOf('localhost')!= -1){
        token = local_FACEBOOK_SECRET;
    }
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: token,
        redirect_uri: req.body.redirectUri
    };



    // Step 1. Exchange authorization code for access token.
    request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
        if (response.statusCode !== 200) {
            return res.status(500).send({ message: accessToken.error.message });
        }

        // Step 2. Retrieve profile information about the current user.
        request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
            if (response.statusCode !== 200) {
                return res.status(500).send({ message: profile.error.message });
            }
            console.log(profile);
            if (req.headers.authorization) {
                User.findOne({ facebook: profile.id }, function(err, existingUser) {
                    if (existingUser) {
                        return res.status(409).send({ message: 'There is already a Facebook account that belongs to you' });
                    }
                    var token = req.headers.authorization.split(' ')[1];
                    var payload = jwt.decode(token, config.TOKEN_SECRET);
                    User.findById(payload.sub, function(err, user) {
                        if (!user) {
                            return res.status(400).send({ message: 'User not found' });
                        }
                        user.facebook = profile.id;
                        user.picture = user.picture || 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
                        user.displayName = user.displayName || profile.name;
                        user.email = user.email || profile.email;
                        // split display name to populate first and last name
                        var splittedName = profile.name.split(" ");
                        user.name = profile.name;
                        user.firstname = user.firstname || splittedName[0];
                        user.lastname = user.lastname || splittedName[1];
                        user.token = createJWT(user);
                        user.save(function() {
                            res.send(user);
                        });
                    });
                });
            } else {
                // Step 3b. Create a new user account or return an existing one.
                User.findOne({ facebook: profile.id }, function(err, existingUser) {
                    if (existingUser) {
                        existingUser.token = createJWT(existingUser);
                        return res.send(existingUser);
                    }
                    var user = new User();
                    user.facebook = profile.id;
                    user.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
                    user.displayName = profile.name;
                    user.email = user.email || profile.email;
                    // split display name to populate first and last name
                    var splittedName = profile.name.split(" ");
                    user.firstname = user.firstname || splittedName[0];
                    user.lastname = user.lastname || splittedName[1];
                    user.token = createJWT(user);
                    user.save(function() {
                        res.send(user);
                    });
                });
            }
        });
    });
};

