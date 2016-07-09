// create the module and name it userApp
angular.module('userApp', ['ngRoute', 'ui.router', 'ngNotificationsBar', 'webcam', 'ngFileUpload'])
  .factory('User', ['$rootScope', '$http', '$q', '$timeout', '$location', 'Upload', 'notifications',
    function($rootScope, $http, $q, $timeout, $location, Upload, notifications) {

      function UserClass() {
        this.user = {};
        this.loggedin = false;
      }

      var User = new UserClass();
      UserClass.prototype.login = function(user) {
        var self = this;
        $http.post('/login', {
            email: user.email,
            password: user.password
          })
          .success(function(response) {
            if (response.user) {
              $location.url('/ipad');
              self.user = response.user;
              self.loggedin = true;
              $rootScope.$emit('loggedin', self);
              self.showNotification('showSuccess', 'logged in');
            } else {
              $rootScope.$emit('loggedin', self);
              self.showNotification('showError', 'cannot log in');
            }
          })
          .error(function(response) {
            $rootScope.$emit('loggedin', self);
            if (response.errors) {
              _.each(_.keys(response.errors), function(ky) {
                if (ky.message) self.showNotification('showError', ky.message);
              })
            } else if (_.isArray(response)) {
              _.each(response, function(error) {
                if (error.msg) self.showNotification('showError', error.msg);
              });
            } else {
              self.showNotification('showError', 'Whoopss! Sorry something went wrong!');
            }
          });
      }

      UserClass.prototype.register = function(user) {
        var self = this;
        $http.post('/addUser', {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            password: user.password
          })
          .success(function(response) {
            User.user = user;
            $rootScope.$emit('listusers', response);
            self.showNotification('showSuccess', 'Saved');
            if (!self.loggedin) $location.url('login');
          })
          .error(function(response) {
            if (response.errors) {
              _.each(_.keys(response.errors), function(ky) {
                if (ky.message) self.showNotification('showError', ky.message);
              })
            } else if (_.isArray(response)) {
              _.each(response, function(error) {
                if (error.msg) self.showNotification('showError', error.msg);
              })
            } else {
              self.showNotification('showError', 'Whoopss! Sorry something went wrong!');
            }
          });
      }

      UserClass.prototype.uploadPhoto = function(file, id) {
        var self = this;
        Upload.upload({
          url: 'file?_id=' + id,
          data: {
            file: file
          }
        }).then(function(resp) {
          var socket = io();
          socket.emit('fileupload', 'File uploaded');
          socket.on('upload', function(msg) {
            console.log('here');
            self.getUsers();
          });
          self.showNotification('showSuccess', 'File is uploaded!');
        }, function(resp) {
          self.showNotification('showError', 'Whoopss! Sorry something went wrong!');
        }, function(evt) {
          console.log(evt);
        });
      }

      UserClass.prototype.getUsers = function() {
        var self = this;
        $http.get('/getUsers')
          .success(function(response) {
            console.log('listuser')
            $rootScope.$emit('listusers', response);
          })
      }


      UserClass.prototype.logout = function() {
        this.user = {};
        this.loggedin = false;
        $rootScope.$emit('loggedin', this);
        $location.url('/login');
      };

      UserClass.prototype.showNotification = function(type, msg) {
        notifications[type]({
          message: msg,
          hideDelay: 1500, //ms
          hide: true //bool
        });
      }

      $rootScope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
          if (fn && (typeof(fn) === 'function')) {
            fn();
          }
        } else {
          this.$apply(fn);
        }
      };

      return User;
    }
  ])
  .factory('socket', function($rootScope) {
    var socket = io.connect();
    return {
      on: function(eventName, callback) {
        socket.on(eventName, function() {
          var args = arguments;
          $rootScope.$applyAsync(function() {
            callback.apply(socket, args);
          });
        });
      },
      emit: function(eventName, data, callback) {
        socket.emit(eventName, data, function() {
          var args = arguments;
          $rootScope.$applyAsync(function() {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      }
    };
  });
