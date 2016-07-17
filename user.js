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
     * Add user into db
     */
    addUser: function(user, callback) {
      var newUser = new User(user);
      User.findOne({}, {}, {
        sort: {
          'createdAt': -1
        }
      }, function(err, user) {
        if(err) return callback(err);
        newUser.createdAt = new Date();
        if(user) newUser.winnerIndex = (user.winnerIndex + 1) % 4;
        newUser.save(function(err, savedUser) {
          if (err) return callback(err);
          callback(null, savedUser);
        });
      });
    },
    /*
     * Return images randomly by uploaded or default
     */
    getImages: function(query, callback) {
      var images = [],
        searchObj = query.id && query.id !== 'undefined' && query.id !== 'null' ? {
          _id: query.id
        } : {},
        defaultImages = ['images/slider_play_smart_980x400.jpg', 'images/slider_olg_980x400.jpg', 'images/slider_winners_980x400.jpg'];

      function getMeLuckyNumber(array) {
        var randomInd = Math.floor(Math.random() * array.length);
        return array[randomInd];
      }
      String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
      }
      User.findOne(searchObj)
        .exec(function(err, user) {
          if (err) return callback(err);
          if (user) {
            _.each(['top', 'middle', 'bottom'], function(item) {
              var obj = {};
              _.each(_.range(25), function(ind) {
                obj[item + ind] = _.random(4) > 2 ? user.image['slice' + item.capitalizeFirstLetter()] : getMeLuckyNumber(defaultImages);
              });
              obj[item + '0'] = user.image['slice' + item.capitalizeFirstLetter()];
              images.push(obj);
            });
          } else {
            _.each(['top', 'middle', 'bottom'], function(item) {
              var obj = {};
              _.each(_.range(24), function() {
                obj[item + ind] = getMeLuckyNumber(defaultImages);
              });
              obj[item + '24'] = obj[item + '0'];
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
    updateUser: function(_id, path, result, callback) {
      var pth = path,
        top, middle, bottom;
      pth = path.split('store/').join('');
      top = result.cutImage.getTopSlice.split('store/').join('');
      middle = result.cutImage.getMiddleSlice.split('store/').join('');
      bottom = result.cutImage.getBottomSlice.split('store/').join('');
      User.findOneAndUpdate({
          _id: _id
        }, {
          $set: {
            // 'image.url': 'https://faceflipper.s3.amazonaws.com/' + pth,
            'image.name': pth,
            'image.sliceTop': top,
            'image.sliceMiddle': middle,
            'image.sliceBottom': bottom
          }
        },
        function(err, saa) {
          if (err) return callback(err);
          callback(null, 'done');
        });
    }
  }
}
