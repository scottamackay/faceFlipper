'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  crypto    = require('crypto'),
  _   = require('lodash'),
  db = {};

/*
 * For injection attacks
 */
var escapeProperty = function(value) {
  return _.escape(value);
};

/*
 * Email validation
 */
var validateUniqueEmail = function(value, callback) {
  var User = mongoose.model('User');
  User.find({
    $and: [{
      email: value
    }, {
      _id: {
        $ne: this._id
      }
    }]
  }, function(err, user) {
    callback(err || user.length === 0);
  });
};

// User model
var UserSchema = new Schema({
  firstname: {
    type: String,
    required: true,
    get: escapeProperty
  },
  lastname: {
    type: String,
    required: true,
    get: escapeProperty
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please enter a valid email'],
    validate: [validateUniqueEmail, 'E-mail address is already in-use']
  },
  isWinner: {
    type: Boolean,
    default: 0
  },
  image: {
    url: String,
    name: String
  }
});

mongoose.model('User', UserSchema);
mongoose.connect('localhost', 'faceflipper', function(err) {
  if (err) {
    console.log('Could not connect to database: ' + err);
    process.exit(1);
  }
});
