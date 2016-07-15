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
        searchObj = query.id && query.id !== 'undefined' ? { _id: query.id } : {},
        defaultImages = ['images/slide_play_start_978x-381.jpg', 'images/slide_slots_casinos_978x381.jpg', 'images/slide_winners_circle_978x381.jpg'];

      function getMeLuckyNumber(first, last, unwanted, cb) {
        var luckyNumber = _.random(first, last - 1),
          newList = _.uniq(unwanted);
        if(unwanted.indexOf(luckyNumber) !== -1) {
          newList.push(luckyNumber);
          getMeLuckyNumber(first, last, newList);
        } else {
          console.log(luckyNumber);
          return luckyNumber;
        }
      }
      User.findOne(searchObj)
        .exec(function(err, user) {
          console.log(err, searchObj, query.id)
          if (err) return callback(err);
          if (user) {
            defaultImages.push(user.image.name);
            _.each(['top', 'middle', 'bottom'], function(item) {
              var obj = {},
                lucky1 = getMeLuckyNumber(0, defaultImages.length, []),
                lucky2 = getMeLuckyNumber(0, defaultImages.length, [lucky1]),
                lucky3 = getMeLuckyNumber(0, defaultImages.length, [lucky1, lucky2]),
                lucky4 = getMeLuckyNumber(0, defaultImages.length, [lucky1, lucky2, lucky3]);
                console.log(lucky1, lucky2, lucky3, lucky4);
              obj[item + '1'] = defaultImages[lucky1];
              obj[item + '2'] = defaultImages[lucky2];
              obj[item + '3'] = defaultImages[lucky3];
              obj[item + '4'] = defaultImages[lucky4];
              images.push(obj);
            });

          } else {
            defaultImages.push('images/slide_play_start_978x-381.jpg');
            _.each(['top', 'middle', 'bottom'], function(item) {
              var obj = {},
                lucky1 = getMeLuckyNumber(0, defaultImages.length, []),
                lucky2 = getMeLuckyNumber(0, defaultImages.length, [lucky1]),
                lucky3 = getMeLuckyNumber(0, defaultImages.length, [lucky1, lucky2]),
                lucky4 = getMeLuckyNumber(0, defaultImages.length, [lucky1, lucky2, lucky3]);

              obj[item + '1'] = defaultImages[0];
              obj[item + '2'] = defaultImages[1];
              obj[item + '3'] = defaultImages[2];
              obj[item + '4'] = defaultImages[3];
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
