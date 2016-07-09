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
  bodyParser = require('body-parser'),
  AWS = require('aws-sdk'),
  fs = require('fs'),
  multer = require('multer'),
  storage = multer.diskStorage({
    destination: 'store/uploads/',
    filename: function(req, file, cb) {
      cb(null, file.originalname);
    }
  }),
  async = require('async'),
  upload = multer({
    storage: storage
  });

AWS.config.update({
  accessKeyId: process.env.AWS_KEY_ID || 'AKIAIR2XML4UTSBAPY7Q',
  secretAccessKey: process.env.AWS_SECRET_KEY || '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'
});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});


app.use(express.static(__dirname + '/store'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(expressValidator());

var server = http.listen(process.env.PORT || 3000, function() {
  console.log("Great! App is ready.");
});

var io = require('socket.io')(server);
io.on('connection', function(socket) {
  // whenever any user upload file
  socket.on('fileupload', function() {
    // sending to all clients
    io.emit('upload', 'fileuploaded');
  });
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
      res.send({
        msg: msg
      });
    });
  });

app.route('/getUsers')
  .get(function(req, res) {
    user.getUsers(function(err, users) {
      if (err) return res.status(500).send(err);
      res.send({
        users: users
      })
    })
  })

app.route('/file')
  .post(upload.single('file'), function(req, res) {
    var s3 = new AWS.S3();
    console.log(req.file)
    async.auto({
      getFileName: function(next) {
        user.getFileName(req.query, function(err, name) {
          if (err) return next(err);
          next(null, name);
        });
      },
      saveAws: ['getFileName', function(next, result) {
        fs.readFile(req.file.path, function(err, file_buffer) {
          if (err) return next(err);
          var params = {
            Bucket: 'faceflipper',
            Key: result.getFileName,
            Body: file_buffer,
            Expires: 435435344,
            ACL: 'public-read'
          };

          s3.putObject(params, function(err, data) {
            if (err) next(err);
            next(null, result.getFileName);
          });
        });
      }],
      updateUser: ['saveAws', function(next, result) {
        user.updateUser(req.query, result.saveAws, function(err, data) {
          if (err) return next(err);
          next(null, 'done');
        });
      }]
    }, function(err, resss) {
      if (err) return res.status(500).send(err);
      res.send({
        msg: 'done'
      });
    });
  });
