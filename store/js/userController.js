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
  .controller('tvController', function($scope, $rootScope, User, $state, socket, $timeout) {
    var self = this;
    $scope.updateText = 'Not yet';
    $scope.image0 = '';
    $scope.image1 = '';
    $scope.image2 = '';
    $scope.image3 = '';
    $scope.image4 = '';
    socket.on('upload', function(msg) {
      User.getUsers();
      $timeout(function () {
        $state.reload();
      }, 5000);
    });
    // self.init = function() {
      User.getUsers();
    // }
    $rootScope.$on('listusers', function(event, args) {
      console.log('updateText: not yet');
      console.log('listed', args.users);
      _.each(args.users, function(user, id) {
        if(user.image && user.image.url) $scope['image' + id] = user.image.url;
      })
      // _.each(args.users, function(user) {
      //   if(user.image && user.image.url) $scope.images.push(user.image.url);
      // });
      $scope.users = args.users;
      $scope.updateText = 'Not yet';
      $timeout(function() {
        $scope.$apply();
        $rootScope.$applyAsync(function() {
          $scope.users = args.users;
          $scope.updateText = 'Not YETTT';
          _.each(args.users, function(user, id) {
            if(user.image && user.image.url) $scope['image' + id] = user.image.url;
          })
          // $scope.images = []
          // _.each(args.users, function(user) {
          //   if(user.image && user.image.url) $scope.images.push(user.image.url);
          // });
        });
        $rootScope.safeApply();
      }, 10000);
      $scope.$applyAsync(function() {
        $scope.users = args.users;
        _.each(args.users, function(user, id) {
          if(user.image && user.image.url) $scope['image' + id] = user.image.url;
        });
        // $scope.images = []
        // _.each(args.users, function(user) {
        //   if(user.image && user.image.url) $scope.images.push(user.image.url);
        // });
        $scope.updateText = 'Updated';
        console.log('updateText: yes');
      });
      $scope.safeApply();
      // $timeout(function() {
      //   $scope.$applyAsync(function() {
      //     console.log(args.users)
      //     $scope.users = args.users;
      //   });
      //   $rootScope.safeApply(function() {
      //     $scope.users = args.users;
      //   });
      // }, 2000);
      // $scope.$digest();
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
      _id: User.user._id,
      email: User.user.email,
      firstname: User.user.firstname,
      lastname: User.user.lastname
    };

    // self.onFileChange = function() {
    //   if ($scope.form.media.$valid && self.media) {
    //     console.log(User.user)
    //     User.uploadPhoto(self.media, User.user._id);
    //   } else {
    //     User.showNotification('showError', 'Invalid extension');
    //   }
    // }
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
