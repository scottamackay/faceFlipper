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
      newUser.save(function(err, savedUser) {
        if (err) return callback(err);
        console.log(savedUser);
        callback(null, savedUser);
      });
    },
    /*
     * Return images randomly by uploaded or default
     */
    getImages: function(query, callback) {
      var images = [],
        searchObj = query.id && query.id !== 'undefined' ? {
          _id: query.id
        } : {},
        defaultImages = ['images/slider_play_smart_980x400.jpg', 'images/slider_olg_980x400.jpg', 'images/slider_winners_980x400.jpg'];

      function getMeLuckyNumber(array) {
        var randomInd = Math.floor(Math.random() * array.length);
        return [array[randomInd], randomInd];
      }
      User.findOne(searchObj)
        .exec(function(err, user) {
          if (err) return callback(err);
          if (user) {
            defaultImages.push(user.image.name);
            _.each(['top', 'middle', 'bottom'], function(item) {
              var obj = {},
                copiedArray = defaultImages.slice();
              var lucky1 = getMeLuckyNumber(copiedArray);
              copiedArray.splice(lucky1[1], 1)
              var lucky2 = getMeLuckyNumber(copiedArray);
              // delete copiedArray[lucky2[1]];
              copiedArray.splice(lucky2[1], 1)
              var lucky3 = getMeLuckyNumber(copiedArray);
              // delete copiedArray[lucky3[1]];
              copiedArray.splice(lucky3[1], 1)
              var lucky4 = getMeLuckyNumber(copiedArray);
              obj[item + '1'] = lucky1[0];
              obj[item + '2'] = lucky2[0];
              obj[item + '3'] = lucky3[0];
              obj[item + '4'] = lucky4[0];
              images.push(obj);
            });

          } else {
            defaultImages.push('images/slider_olg_980x400.jpg');
            var lastImage = null;
            _.each(['top', 'middle', 'bottom'], function(item) {
              var obj = {},
                copiedArray = defaultImages.slice();
                var lucky1 = getMeLuckyNumber(copiedArray);
                copiedArray.splice(lucky1[1], 1)
                var lucky2 = getMeLuckyNumber(copiedArray);
                // delete copiedArray[lucky2[1]];
                copiedArray.splice(lucky2[1], 1)
                var lucky3 = getMeLuckyNumber(copiedArray);
                // delete copiedArray[lucky3[1]];
                copiedArray.splice(lucky3[1], 1)
                var lucky4 = getMeLuckyNumber(copiedArray);
                if(!lastImage) lastImage = lucky4[0];
              obj[item + '1'] = lucky1[0];
              obj[item + '2'] = lucky2[0];
              obj[item + '3'] = lucky3[0];
              obj[item + '4'] = lastImage;
              images.push(obj);
            });
          }
          callback(null, images);
        });
    },
    /*
     * Generate file name by user Id
     */
    getFileName: function(_id, callback) {
      User.findOne({
        _id: _id
      }, function(err, user) {
        if (err) return callback(err);
        callback(null, user.firstname + '-' + user.lastname + '-' + user._id + '.jpg');
      })
    },
    /*
     * Update image path and url
     */
    updateUser: function(_id, path, callback) {
      var pth = path;
      if (path.indexOf('store/') !== -1) pth = path.split('store/').join('');
      User.findOneAndUpdate({
          _id: _id
        }, {
          $set: {
            // 'image.url': 'https://faceflipper.s3.amazonaws.com/' + pth,
            'image.name': pth
          }
        },
        function(err, saa) {
          console.log(err, saa);
          if (err) return callback(err);
          callback(null, 'done');
        });
    }
  }
}
