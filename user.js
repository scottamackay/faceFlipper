'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  _ = require('lodash'),
  async = require('async');

module.exports = function(System) {
  return {
    /*
     * Login authentication
     */
    signin: function(user, callback) {
      User.findOne({
        email: user.email,
        password: user.password
      }, function(err, verifiedUser) {
        if (err) return callback(err);
        callback(null, verifiedUser);
      });
    },
    /*
     * Add user into db
     */
    addUser: function(user, callback) {
      var newUser = new User(user);
      newUser.save(function(err) {
        if (err) return callback(err);
        callback(null, 'done');
      });
    },
    /*
    * Return all users
    */
    getUsers: function(callback) {
      User.find()
      .exec(function(err, users) {
        if(err) return callback(err);
        callback(null, users);
      });
    },
    /*
     * Generate file name by user Id
     */
    getFileName: function(user, callback) {
      User.findOne({
        _id: user._id
      }, function(err, user) {
        if (err) return callback(err);
        callback(null, user.firstname + '-' + user.lastname + '-' + user._id + '.jpg');
      })
    },
    /*
     * Update image path and url
     */
    updateUser: function(user, name, callback) {
      User.update({
          _id: user._id
        }, {
          $set: {
            'image.url': 'https://faceflipper.s3.amazonaws.com/' + name,
            'image.name': name
          }
        },
        function(err) {
          if (err) return callback(err);
          callback(null, 'done');
        });
    }
  }
}
