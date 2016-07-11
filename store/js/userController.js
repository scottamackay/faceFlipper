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
    $scope.users = [];
    // $scope.uploaderId = null;
    self.urlFirst = '';
    self.urlSecond = '';
    self.urlThird = '';
    socket.on('upload', function(userId) {
      $timeout(function() {
        $scope.uploaderId = userId;
        $state.reload();
      }, 5000);
    });

    $scope.generateLink = function(link) {
      var d = new Date().getTime();
      return link + '?breakcache=' + d;
    }
    self.init = function() {
      User.getUsers();
    }
    $rootScope.$on('listusers', function(event, args) {
      // $scope.users = args.users;
      $scope.images = [];
      _.each(args.users, function(user) {
        if (user.image && user.image.url) $scope.images.push({
          url: user.image.url,
          id: user._id
        });
      }); // each
      if($scope.images.length > 0) {
        if ($scope.uploaderId) {
          console.log(_.findIndex($scope.images, function(img) {
            return img.id === $scope.uploaderId;
          }), $scope.images);
          self.urlFirst = $scope.images[_.findIndex($scope.images, function(img) {
            return img.id === $scope.uploaderId;
          })]['url'];
          self.urlSecond = self.urlFirst;
          self.urlThird = self.urlFirst;
          // self.urlSecond = self.urlThird = self.urlFirst;
        } else {
          self.urlFirst = $scope.images[_.random(0, $scope.images.length - 1)]['url'];
          self.urlSecond = $scope.images[_.random(0, $scope.images.length - 1)]['url'];
          self.urlThird = $scope.images[_.random(0, $scope.images.length - 1)]['url'];
        }
      }
    }); // listusers

    socket.on('playgame', function(userId) {
      var luckyInd = _.random(2);
      _.each([self.urlFirst, self.urlSecond, self.urlThird], function(url, ind) {
        if (luckyInd === ind) {
          url = $scope.images[_.findIndex($scope.images, function(img) {
            return img.id === userId;
          })]['url'];
        } else {
          url = $scope.images[_.random(0, $scope.images.length - 1)]['url'];
        }
      });
      self.urlFirst = $scope.images[_.random(0, $scope.images.length - 1)]['url'];
      self.urlSecond = $scope.images[_.random(0, $scope.images.length - 1)]['url'];
      self.urlThird = $scope.images[_.random(0, $scope.images.length - 1)]['url'];
    });
  })
  .controller('ipadController', function($scope, $rootScope, User, socket) {
    var self = this;
    self.user = {
      _id: User.user._id,
      email: User.user.email,
      firstname: User.user.firstname,
      lastname: User.user.lastname
    };

    self.play = function() {
      socket.emit('play', User.user._id);
    }

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
      email: null
    }

    self.register = function() {
      User.register(self.user);
    }
  });
