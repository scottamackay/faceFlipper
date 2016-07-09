// create the module and name it userApp
angular.module('userApp')
  .controller('bodyController', function($scope, $rootScope, User) {
    var self = this;
    self.loggedin = User.loggedin;
    self.cls = "body";
    $rootScope.$on('loggedin', function(event, args) {
      self.loggedin = args.loggedin;
      self.cls = self.loggedin ? "" : "body";
    });
    self.logout = function() {
      User.logout();
    }
  })
  .controller('userController', function($scope, User, $rootScope, ParseServer) {
    var self = this;
    $scope.selected = [];

    $scope.query = {
      order: 'firstname',
      limit: 5,
      page: 1
    };

    $scope.user = {
      _id: null,
      firstname: null,
      lastname: null,
      password: null,
      email: null
    };

    self.headerText = 'Add User';
    self.btnText = 'Save';

    $scope.selectedItem = function(user) {
      $scope.user = user;
      self.headerText = 'Update User';
      self.btnText = 'Update';
    }

    $scope.deselectedItem = function() {
      $scope.user = {
        _id: null,
        firstname: null,
        lastname: null,
        password: null,
        email: null
      };
      self.headerText = 'Add User';
      self.btnText = 'Save';
    }

    self.init = function() {
      User.getUsers();
      // ParseServer.setCallback(function(users) {
      //   console.log(users);
      // });
      // ParseServer.GET('/users');
    }

    self.addUser = function() {
      console.log($scope.user._id);
      if($scope.user._id) {
        User.update($scope.user);
      } else {
        User.register($scope.user);
      }
    }

    self.removeUser = function(user) {
      User.removeUser(user);
      $scope.user = {
        _id: null,
        firstname: null,
        lastname: null,
        password: null,
        email: null
      };
    }

    $rootScope.$on('listusers', function(event, args) {
      $scope.users = args.users;
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
  .controller('homeController', function($scope, $rootScope, User) {
    var self = this;
    self.user = {
      email: User.user.email,
      firstname: User.user.firstname,
      lastname: User.user.lastname
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
