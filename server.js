'use strict';

/**
 * Module dependencies.
 */
var express = require('express'),
  app = express(),
  http = require('http').createServer(app),
  path = require('path'),
  db = require('./db'),
  _ = require('lodash'),
  mongoose = require('mongoose'),
  expressValidator = require('express-validator'),
  bodyParser = require('body-parser');

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});


app.use(express.static(__dirname + '/store'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(expressValidator());

http.listen(process.env.PORT || 3000, function() {
  console.log("Great! App is ready.");
});

var user;
mongoose.connection.on('connected', function() {
  user = require('./user')(app);
});

app.route('/login')
  .post(function(req, res) {
    req.assert('email', 'You must enter a valid email address').isEmail();
    req.assert('password', 'Password must be between 8-20 characters long').len(8, 20);

    var errors = req.validationErrors();
    if (errors) {
      return res.status(400).send(errors);
    }
    user.signin(req.body, function(err, usr) {
      if (err) return res.status(500).send(err);
      // var copied = usr.toObject();
      // delete copied.password;
      res.send({
        user: usr
      })
    })
  });

app.route('/addUser')
  .post(function(req, res) {
    // entiries validations
    req.assert('firstname', 'You must enter a firstname').notEmpty();
    req.assert('lastname', 'You must enter a lastname').notEmpty();
    req.assert('email', 'You must enter a valid email address').isEmail();
    req.assert('password', 'Password must be between 8-20 characters long').len(8, 20);

    var errors = req.validationErrors();
    if (errors) {
      return res.status(400).send(errors);
    }

    user.addUser(req.body, function(err, msg) {
      if (err) return res.status(500).send(err);
      user.getUsers(function(err, users) {
        if (err) return res.status(500).send(err);
        res.send({
          users: users
        });
      })
    });
  });
