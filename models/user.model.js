const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  screenName: String,
  twitterId: String,
  profileImageUrl: String,
  accessToken: String,
  accessTokenSecret: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
