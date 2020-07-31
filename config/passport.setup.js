require('dotenv').config();
const passport = require('passport');
const User = require('../models/user.model');
const Strategy = require('passport-twitter').Strategy;

let trustProxy = false;
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
    async (token, tokenSecret, profile, cb) => {
      const currentUser = await User.findOne({
        twitterId: profile._json.id_str,
      });

      if (!currentUser) {
        const newUser = await new User({
          name: profile._json.name,
          screenName: profile._json.screen_name,
          twitterId: profile._json.id_str,
          profileImageUrl: profile._json.profile_image_url_https,
          accessToken: token,
          accessTokenSecret: tokenSecret,
        }).save();

        if (newUser) {
          return cb(null, newUser);
        }
      }
      return cb(null, currentUser);
    }
  )
);

// Configure Passport authenticated session persistence.
passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((_id, cb) => {
  User.findById(_id)
    .then((user) => {
      cb(null, user);
    })
    .catch((err) => {
      cb(new Error('Failed to deserialize an user.'));
    });
});
