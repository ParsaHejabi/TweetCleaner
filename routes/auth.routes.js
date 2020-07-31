const router = require('express').Router();
const passport = require('passport');
const url = require('url');

let frontEndUrl;

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  // dev
  frontEndUrl = 'http://localhost:3000';
} else {
  // production
  frontEndUrl = 'https://parsahejabi.github.io/TweetCleanerWebsite';
}

router.get('/login/success', (req, res) => {
  if (req.user) {
    req.user.accessToken = undefined;
    req.user.accessTokenSecret = undefined;
    res.json({
      success: true,
      message: 'User has successfully authenticated.',
      user: req.user,
    });
  }
});

router.get('/login/failed', (req, res) => {
  req.statusCode(401);
  res.redirect(
    url.format({
      protocol: 'https',
      hostname: 'parsahejabi.github.io',
      pathname: '/TweetCleanerWebsite',
      query: {
        success: false,
        message: 'User failed to authenticate.',
      },
    })
  );
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.redirect(frontEndUrl);
  });
});

router.get('/twitter', passport.authenticate('twitter'));

router.get(
  '/twitter/callback',
  passport.authenticate('twitter', {
    successRedirect: frontEndUrl,
    failureRedirect: '/auth/login/failed',
  })
);

module.exports = { router, frontEndUrl };
