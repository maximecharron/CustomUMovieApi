var passport = require('passport');
var request = require('request');
var User = require('../models/user').model;
var  FACEBOOK_SECRET = 'YOUR_FACEBOOK_CLIENT_SECRET';
var  GOOGLE_SECRET =  'jJw1sxBOFvaMF66zb1RuSiuu';


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
                        user.firstname = user.firstname || splittedName[0];
                        user.lastname = user.lastname || splittedName[1];
                        user.save(function() {
                            var token = createJWT(user);
                            res.send({ token: token });
                        });
                    });
                });
            } else {
                // Step 3b. Create a new user account or return an existing one.
                User.findOne({ google: profile.sub }, function(err, existingUser) {
                    if (existingUser) {
                        return res.send({ token: createJWT(existingUser) });
                    }
                    var user = new User();
                    user.google = profile.sub;
                    user.picture = profile.picture.replace('sz=50', 'sz=200');
                    user.username = user.username || profile.name;
                    // split display name to populate first and last name
                    var splittedName = profile.name.split(" ");
                    user.firstname = user.firstname || splittedName[0];
                    user.lastname = user.lastname || splittedName[1];
                    user.save(function(err) {
                        var token = createJWT(user);
                        res.send({ token: token });
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
        app.get('jwtTokenSecret')
    );
}

