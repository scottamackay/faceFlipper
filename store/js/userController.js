// create the module and name it userApp
angular.module('userApp')
  .controller('bodyController', function($scope, $rootScope, User) {
    var self = this;
    self.loggedin = User.loggedin;
    // self.cls = "body";
    // $rootScope.$on('loggedin', function(event, args) {
    //   self.loggedin = args.loggedin;
    //   self.cls = self.loggedin ? "" : "body";
    // });
    self.logout = function() {
      User.logout();
    }
  })
  .controller('tvController', function($scope, $rootScope, User) {
    var self = this;
    var socket = io();
    socket.on('upload', function(msg) {
      console.log('here');
      User.getUsers();
    });
    self.init = function() {
      User.getUsers();
    }
    $rootScope.$on('listusers', function(event, args) {
      self.users = args.users;
    });
  })
  .controller('loginController', function($scope, $rootScope, User) {
    var self = this;
    self.user = {
      email: null,
      password: null
    }

    self.login = function() {
      User.login(self.user);
    }
  })
  .controller('ipadController', function($scope, $rootScope, User) {
    var self = this;
    self.user = {
      email: User.user.email,
      firstname: User.user.firstname,
      lastname: User.user.lastname
    };

    self.onFileChange = function() {
      if ($scope.form.media.$valid && self.media) {
        console.log(User.user)
        User.uploadPhoto(self.media, User.user._id);
      } else {
        User.showNotification('showError', 'Invalid extension');
      }
    }
  })
  .controller('registerController', function($scope, $rootScope, User) {
    var self = this;
    self.user = {
      firstname: null,
      lastname: null,
      email: null,
      password: null
    }

    self.register = function() {
      User.register(self.user);
    }
  });
