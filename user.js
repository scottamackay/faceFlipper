'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  _ = require('lodash'),
  Client = require('hubspot'),
  MCapi = require('mailchimp-api'),
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
     * Return all users from db
     */
    getUsers: function(callback) {
      User.find()
        .exec(function(err, users) {
          if (err) return callback(err);
          callback(null, users);
        });
    },
    /*
     * Add user into db and hubspot
     */
    addUser: function(user, callback) {
      /**
       * First process : saving db
       * Then saving mailchimp and hubspot plus sending email processes simultaneeously
       **/
      async.auto({
        //save user into database
        save_db: function(next) {
          var newUser = new User(user);
          newUser.save(function(err) {
            if (err) return next(err);
            next(null, 'done');
          });
        },
        // save user hubspot api
        save_hubspot: ['save_db', function(next) {
          var client = new Client();
          client.useKey(process.env.HUBSPOT_TOKEN || 'aa5b14ea-90c7-4a29-a508-2f1d3675ea2b')
            // var api = hubspot({
            //   token: process.env.HUBSPOT_TOKEN || 'aa5b14ea-90c7-4a29-a508-2f1d3675ea2b',
            //   version: 'v3'
            // });

          var properties = [];
          _.each(_.keys(user), function(ky) {
            if (ky !== 'password' && ky !== '_id') {
              var obj = {
                property: ky,
                value: user[ky]
              };
              properties.push(obj);
            }
          });
          client.contacts.create({
            properties: properties
          }, function(err, data) {
            if (err) return next(err);
            next(null, 'data');
          });
        }],
        //save user mailchimp api
        save_mailchimp: ['save_db', function(next) {
          var apiKey = process.env.MAILCHIMP_TOKEN || '163518857e642594b46fa6dfd8101ed1-us13';
          var listID = '088ea63b4b';
          var mc = new MCapi.Mailchimp(apiKey);
          var mcReq = {
            id: listID,
            email: {
              email: user.email
            },
            merge_vars: {
              EMAIL: user.email,
              FNAME: user.firstname,
              LNAME: user.lastname
            }
          };

          // submit subscription request to mail chimp
          mc.lists.subscribe(mcReq, function(data) {
            next(null, 'data');
          }, function(err) {
            next(err);
          });
        }],
        send_email: ['save_db', function(next) {
          var mailgunKey = process.env.MAILGUN_API_KEY || 'key-837e8268dd4cebc2ecf1ff9a74ae9436';
          var domainName = process.env.MAILGUN_DOMAIN || 'mg.prorithm.com';
          var Mailgun = require('mailgun-js');
          var mailgun = new Mailgun({
            apiKey: mailgunKey,
            domain: domainName
          });

          var data = {
            from: process.env.EMAIL || 'SEMIH <postmaster@mg.prorithm.com>',
            to: user.email,
            subject: 'Registration',
            html: 'Congratilations! You have registered the system!'
          }

          //Invokes the method to send emails given the above data with the helper library
          mailgun.messages().send(data, function(err, body) {
            //If there is an error, render the error page
            if (err) {
              return next(err);
            } else {
              next(null, 'sent');
            }
          });
          // Parse.Cloud.httpRequest({
          //   method: "POST",
          //   url: "https://api:" + mailgunKey + "@api.mailgun.net/v2/" + domainName + "/messages",
          //   body: {
          //     to: user.email,
          //     from: process.env.EMAIL || 'SEMIH <postmaster@sandboxf083666a930841d1be2e5fbc9156ef89.mailgun.org>',
          //     subject: "Registration",
          //     text: "Congratilations! You are registered the system!"
          //   }
          // }).then(function(httpResponse) {
          //   console.log(httpResponse);
          //   next(null, 'Email is sent.')
          // }, function(httpResponse) {
          //   console.log(httpResponse);
          //   next('Email could not be sent');
          // });
        }]
      }, function(err, results) {
        if (err) return callback(err);
        callback(null);
      });
    },
    /*
     * Update user in db and hubspot api
     */
    updateUser: function(user, callback) {
      User.update({
        _id: user._id
      }, {
        $set: user
      }, function(err) {
        if (err) return callback(err);
        callback(null, 'updated');
      });
    },
    /*
     * Remove user from db and hubspot api
     */
    removeUser: function(user, callback) {
      User.remove({
        _id: user._id
      }, function(err) {
        if (err) return callback(err);
        callback(null, 'removed');
      });
    }
  }
}
