require('dotenv').config();

const express = require('express');
const passport = require('passport');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const passportSetup = require('./config/passport.setup');

const authRoutes = require('./routes/auth.routes');

const PORT = process.env.PORT || 9000;

const app = express();

// Connect to mongo
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to mongo db...');
  })
  .catch((err) => {
    throw new Error('There was error conneting to DB');
  });

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

// Setup cors
app.use(
  cors({
    origin: 'https://parsahejabi.github.io/',
    methods: 'GET,HEAD,POST',
    credentials: true,
  })
);

app.use(require('body-parser').urlencoded({ extended: true }));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// Use application-level middleware for common functionality, including logging, parsing, and session handling.
app.use(
  require('morgan')('combined', {
    stream: fs.createWriteStream(path.join(__dirname, 'access.log'), {
      flags: 'a',
    }),
  })
);

// Setup routes
app.use('/auth', authRoutes.router);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
