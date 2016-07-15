// create the module and name it userApp
angular.module('userApp', ['ngRoute', 'ui.router', 'ngNotificationsBar', 'webcam', 'ngFileUpload'])
  .factory('User', ['$rootScope', '$http', '$q', '$timeout', '$location', 'Upload', 'notifications', 'socket',
    function($rootScope, $http, $q, $timeout, $location, Upload, notifications, socket) {

      function UserClass() {
        this.user = {};
        this.loggedin = false;
      }

      var User = new UserClass();

      UserClass.prototype.register = function(user) {
        var self = this;
        $http.post('/addUser', {
            firstname: user.firstname,
            lastname: user.lastname,
            date: user.date,
            postal: user.postal,
            email: user.email
          })
          .success(function(response) {
            self.user = response.user;
            self.loggedin = true;
            console.log(socket, response);
            socket.emit('signup', 'Success');
            $rootScope.$emit('loggedin', self);
            $location.url('/addphoto');
            // self.showNotification('showSuccess', 'Saved');
          })
          .error(function(response) {
            console.log(response)
            if (response.errors) {
              _.each(_.keys(response.errors), function(ky) {
                console.log(ky);
                if (response.errors[ky].message) self.showNotification('showError', response.errors[ky].message);
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

      UserClass.prototype.getImages = function() {
        var self = this;
        $http.get('/getImages?id=' + self.uploaderId)
          .success(function(response) {
            $rootScope.$emit('listimages', response);
          })
      }


      UserClass.prototype.logout = function() {
        this.user = {};
        this.loggedin = false;
        $rootScope.$emit('loggedin', this);
        $location.url('/register');
      };

      UserClass.prototype.win = function() {
        $location.url('/win');
      }

      UserClass.prototype.lose = function() {
        console.log('wondasd')
        $location.url('/lose');
      }

      UserClass.prototype.goodluck = function() {
        console.log('wondasd')
        $location.url('/goodluck');
      }

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
  })
  .directive("fineUploader", function($compile, $interpolate, socket, $timeout, User, $location) {
    return {
      restrict: "A",
      replace: true,

      link: function($scope, element, attrs) {
        var endpoint = attrs.uploadServer,
          notAvailablePlaceholderPath = attrs.notAvailablePlaceholder,
          waitingPlaceholderPath = attrs.waitingPlaceholder,
          acceptFiles = attrs.allowedMimes,
          sizeLimit = attrs.maxFileSize,
          largePreviewSize = parseInt(attrs.largePreviewSize),
          allowedExtensions = JSON.parse(attrs.allowedExtensions),
          previewDialog = document.querySelector('.large-preview'),
          uploader = new qq.FineUploader({
            debug: true,
            element: element[0],
            request: {
              endpoint: endpoint
            },
            validation: {
              acceptFiles: acceptFiles,
              allowedExtensions: allowedExtensions,
              sizeLimit: sizeLimit
            },
            deleteFile: {
              endpoint: endpoint,
              enabled: true
            },
            thumbnails: {
              placeholders: {
                notAvailablePath: notAvailablePlaceholderPath,
                waitingPath: waitingPlaceholderPath
              }
            },
            display: {
              prependFiles: true
            },

            failedUploadTextDisplay: {
              mode: "custom"
            },

            retry: {
              enableAuto: true
            },

            chunking: {
              enabled: true
            },

            resume: {
              enabled: true
            },

            callbacks: {
              onSubmitted: function(id, name) {
                var fileEl = this.getItemByFileId(id),
                  thumbnailEl = fileEl.querySelector('.thumbnail-button');

                  // $timeout(function() {
                  //   socket.emit('fileupload', 'File uploaded');
                  // }, 2000);
                thumbnailEl.addEventListener('click', function() {
                  openLargerPreview($scope, uploader, previewDialog, largePreviewSize, id);
                });
              },
              onAllComplete: function() {
                $timeout(function() {
                  $location.url('/spin');
                  socket.emit('fileupload', User.user._id);
                }, 2000);
              }
            }
          });

        dialogPolyfill.registerDialog(previewDialog);
        $scope.closePreview = closePreview.bind(this, previewDialog);
        bindToRenderedTemplate($compile, $scope, $interpolate, element);
      }
    }
  });

function isTouchDevice() {
  return "ontouchstart" in window || navigator.msMaxTouchPoints > 0;
}

function initButtonText($scope) {
  var input = document.createElement("input");

  input.setAttribute("multiple", "true");

  if (input.multiple === true && !qq.android()) {
    $scope.uploadButtonText = "Select Files";
  } else {
    $scope.uploadButtonText = "Select a File";
  }
}

function initDropZoneText($scope, $interpolate) {
  if (qq.supportedFeatures.folderDrop && !isTouchDevice()) {
    $scope.dropZoneText = "Drop Files or Folders Here";
  } else if (qq.supportedFeatures.fileDrop && !isTouchDevice()) {
    $scope.dropZoneText = "Drop Files Here";
  } else {
    $scope.dropZoneText = $scope.$eval($interpolate("Press '{{uploadButtonText}}'"));
  }
}

function bindToRenderedTemplate($compile, $scope, $interpolate, element) {
  $compile(element.contents())($scope);

  initButtonText($scope);
  initDropZoneText($scope, $interpolate);
}

function openLargerPreview($scope, uploader, modal, size, fileId) {
  uploader.drawThumbnail(fileId, new Image(), size).then(function(image) {
    $scope.largePreviewUri = image.src;
    $scope.$apply();
    modal.showModal();
  });
}

function closePreview(modal) {
  modal.close();
}
