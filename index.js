require('newrelic');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var flash = require('connect-flash');

var cors = require('cors');
var passport = require('passport');

var mongoose = require('mongoose');
var mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/ubeat';
mongoose.connect(mongoUri);

var authentication = require('./middleware/authentication');
var genres = require('./routes/genres');
var login = require('./routes/login');
var lookup = require('./routes/lookup');
var search = require('./routes/search');
var signup = require('./routes/signup');
var status = require('./routes/status');
var user = require('./routes/user');
var watchlist = require('./routes/watchlists');
var scraper = require('./common/scraper.js');
var home = require('./routes/home');
var reviews = require('./routes/reviews.js');

var app = express();
var corsOptions = {
    origin: ['http://localhost:8080', 'http://umovie-team01-client.herokuapp.com',]
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'UPDATE'],
    credentials: true
};

var tokenSecret = 'UBEAT_TOKEN_SECRET' || process.env.TOKEN_SECRET;

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('jwtTokenSecret', tokenSecret);

require('./middleware/passport')(passport, app);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'ubeat_session_secret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(cors(corsOptions));

app.get('/scrape/movies', scraper.scrapeMovies);
app.get('/scrape/tvshows', scraper.scrapeTvShows);

app.get('/status', status.getStatus);
app.get('/login', login.showLoginPage);
app.post('/login', passport.authenticate('local-login'), login.getToken);
app.get('/logout', login.logout);
app.post('/auth/google', login.googleLogin);
app.post('/auth/facebook', login.facebook);

app.get('/signup', signup.showSignupPage);
app.post('/signup', passport.authenticate('local-signup'), login.getToken);
app.get('/welcome', signup.welcome);

app.get('/token', login.getToken);
app.get('/tokenInfo', authentication.isAuthenticated, login.getToken);

// Secure API

app.get('/genres/movies', authentication.isAuthenticated, genres.getMoviesGenres);
app.get('/genres/tvshows', authentication.isAuthenticated, genres.getTvShowsGenres);
app.get('/genres/cache/movies', genres.cacheMovies);
app.get('/genres/cache/tvshows', genres.cacheTv);

app.get('/search', authentication.isAuthenticated, search.search);
app.get('/search/actors', authentication.isAuthenticated, search.searchActor);
app.get('/search/movies', authentication.isAuthenticated, search.searchMovie);
app.get('/search/tvshows/episodes', authentication.isAuthenticated, search.searchTvShowEpisode);
app.get('/search/tvshows/seasons', authentication.isAuthenticated, search.searchTvShowSeason);
app.get('/search/users', authentication.isAuthenticated, user.findByName);

app.get('/users', authentication.isAuthenticated, user.allUsers);
app.get('/users/:id', authentication.isAuthenticated, user.findById);

app.post('/follow', authentication.isAuthenticated, user.follow);
app.delete('/follow/:id', authentication.isAuthenticated, user.unfollow);

app.get('/actors/:id', authentication.isAuthenticated, lookup.getActor);
app.get('/actors/:id/movies', authentication.isAuthenticated, lookup.getActorMovies);
app.get('/movies/:id', authentication.isAuthenticated, lookup.getMovie);
app.get('/movies/:id/reviews', authentication.isAuthenticated, reviews.getMovieReviews);
app.get('/tvshows/season/:id', authentication.isAuthenticated, lookup.getTvShowSeason);
app.get('/tvshows/season/:id/reviews', authentication.isAuthenticated, reviews.getTvReviews);
app.get('/tvshows/season/:id/episodes', authentication.isAuthenticated, lookup.getTvShowEpisodes);
app.get('/popular/movies', authentication.isAuthenticated, home.getPopularMovies);
app.get('/popular/tvshows', authentication.isAuthenticated, home.getPopularTvShows);
app.get('/similar/movies/:id', authentication.isAuthenticated, home.getSimilarMovies);
app.get('/similar/tvshows/:id', authentication.isAuthenticated, home.getSimilarTvshows);
app.post('/movies/reviews', authentication.isAuthenticated, reviews.addMovieReviews);
app.post('/tvshows/reviews', authentication.isAuthenticated, reviews.addTvReviews);


app.get('/watchlists', authentication.isAuthenticated, watchlist.getWatchlists);
app.post('/watchlists', authentication.isAuthenticated, watchlist.createWatchlist);
app.get('/watchlists/:id', authentication.isAuthenticated, watchlist.getWatchlistById);
app.post('/watchlists/:id/movies', authentication.isAuthenticated, watchlist.addMovieToWatchlist);
app.delete('/watchlists/:id/movies/:trackId', authentication.isAuthenticated, watchlist.removeMovieFromWatchlist);
app.put('/watchlists/:id', authentication.isAuthenticated, watchlist.updateWatchlist);
app.delete('/watchlists/:id', authentication.isAuthenticated, watchlist.removeWatchlist);

// Unsecure API. Useful for the second release.

app.get('/unsecure/genres/movies', genres.getMoviesGenres);
app.get('/unsecure/genres/tvshows', genres.getTvShowsGenres);

app.get('/unsecure/search', search.search);
app.get('/unsecure/search/actors', search.searchActor);
app.get('/unsecure/search/movies', search.searchMovie);
app.get('/unsecure/search/tvshows/episodes', search.searchTvShowEpisode);
app.get('/unsecure/search/tvshows/seasons', search.searchTvShowSeason);
app.get('/unsecure/search/users', user.findByName);

app.get('/unsecure/users', user.allUsers);
app.get('/unsecure/users/:id', user.findById);

app.post('/unsecure/follow', user.follow);
app.delete('/unsecure/follow/:id', user.unfollow);

app.get('/unsecure/actors/:id', lookup.getActor);
app.get('/unsecure/actors/:id/movies', lookup.getActorMovies);
app.get('/unsecure/movies/:id', lookup.getMovie);
app.get('/unsecure/movies/:id/reviews', reviews.getMovieReviews);
app.get('/unsecure/tvshows/season/:id', lookup.getTvShowSeason);
app.get('/unsecure/tvshows/season/:id/reviews', reviews.getTvReviews);
app.get('/unsecure/tvshows/season/:id/episodes', lookup.getTvShowEpisodes);
app.get('/unsecure/popular/movies', home.getPopularMovies);
app.get('/unsecure/popular/tvshows', home.getPopularTvShows);
app.get('/unsecure/similar/movies/:id', home.getSimilarMovies);
app.get('/unsecure/similar/tvshows/:id', home.getSimilarTvshows);

app.get('/unsecure/watchlists', watchlist.getWatchlists);
app.post('/unsecure/watchlists', watchlist.createWatchlistUnsecure);
app.get('/unsecure/watchlists/:id', watchlist.getWatchlistById);
app.post('/unsecure/watchlists/:id/movies', watchlist.addMovieToWatchlist);
app.delete('/unsecure/watchlists/:id/movies/:trackId', watchlist.removeMovieFromWatchlist);
app.put('/unsecure/watchlists/:id', watchlist.updateWatchlist);
app.delete('/unsecure/watchlists/:id', watchlist.removeWatchlistUnsecure);

var port = process.env.PORT || 3000;
app.listen(port);
