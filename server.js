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
  ParseServer = require('parse-server').ParseServer,
  expressValidator = require('express-validator'),
  databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI,
  bodyParser = require('body-parser');

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/bendigi',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'bendigi',
  masterKey: process.env.MASTER_KEY || '123', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'https://localhost:3000/parse', // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Signup"] // List of classes to support for query subscriptions
  }
});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

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

app.route('/getUsers')
  .get(function(req, res) {
    // Parse.Cloud.run('users', {}, {
    //   success:function(result) {
    //     res.send({
    //       users: result
    //     });
    //   },
    //   error: function(err) {
    //     return res.status(500).send(err);
    //   }
    // })

    user.getUsers(function(err, users) {
      if (err) return res.status(500).send(err);
      // var filteredUsers = _.map(users, function(user) {
      // var copied = user.toObject();
      // delete copied.password;
      // return copied;
      // });
      res.send({
        users: users
      });
    }); // users.getUsers
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

app.route('/updateUser')
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

    user.updateUser(req.body, function(err, msg) {
      if (err) return res.status(500).send(err);
      user.getUsers(function(err, users) {
        if (err) return res.status(500).send(err);
        res.send({
          users: users
        });
      })
    });
  });

app.route('/removeUser')
  .post(function(req, res) {
    user.removeUser(req.body, function(err, msg) {
      if (err) return res.status(500).send(err);
      user.getUsers(function(err, users) {
        if (err) return res.status(500).send(err);
        res.send({
          users: users
        });
      })
    });
  });

ParseServer.createLiveQueryServer(http);
