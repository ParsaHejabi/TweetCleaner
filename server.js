require('dotenv').config();

var express = require('express');
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var fs = require('fs');
var path = require('path');

var trustProxy = false;
if (process.env.DYNO) {
  // Apps on heroku are behind a trusted proxy
  trustProxy = true;
}

passport.use(
  new Strategy(
    {
      consumerKey: process.env['TWITTER_CONSUMER_KEY'],
      consumerSecret: process.env['TWITTER_CONSUMER_SECRET'],
      callbackURL: '/auth/twitter/callback',
      proxy: trustProxy,
    },
    function (token, tokenSecret, profile, cb) {
      // In this example, the user's Twitter profile is supplied as the user
      // record.  In a production-quality application, the Twitter profile should
      // be associated with a user record in the application's database, which
      // allows for account linking and authentication with other identity
      // providers.
      return cb(null, profile);
    }
  )
);

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(
  require('morgan')('combined', {
    stream: fs.createWriteStream(path.join(__dirname, 'access.log'), {
      flags: 'a',
    }),
  })
);
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(
  require('express-session')({
    name: 'TweetCleanerSession',
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      maxAge: 30 * 60 * 1000,
      secure: 'auto',
    },
  })
);

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// Define routes.
app.get('/', function (req, res) {
  res.render('home', { user: req.user });
});

app.get('/login', function (req, res) {
  // console.log('ENV');
  // console.log(process.env);
  // console.log('Headers:');
  // console.log(req.headers);
  res.render('login');
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get(
  '/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  }
);

app.get('/profile', require('connect-ensure-login').ensureLoggedIn(), function (
  req,
  res
) {
  res.render('profile', { user: req.user });
});

app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    res.redirect('/');
  });
});

app.listen(process.env['PORT'] || 9000);
