// create the module and name it userApp
angular.module('userApp', ['ngRoute', 'ui.router', 'ngNotificationsBar', 'webcam', 'ngFileUpload'])
  .factory('User', ['$rootScope', '$http', '$q', '$timeout', '$location', 'Upload', 'notifications',
    function($rootScope, $http, $q, $timeout, $location, Upload, notifications) {

      function UserClass() {
        this.user = {};
        this.loggedin = false;
      }

      var User = new UserClass();
      // UserClass.prototype.login = function(user) {
      //   var self = this;
      //   $http.post('/login', {
      //       email: user.email,
      //       password: user.password
      //     })
      //     .success(function(response) {
      //       if (response.user) {
      //         $location.url('/ipad');
      //         self.user = response.user;
      //         self.loggedin = true;
      //         $rootScope.$emit('loggedin', self);
      //         self.showNotification('showSuccess', 'logged in');
      //       } else {
      //         $rootScope.$emit('loggedin', self);
      //         self.showNotification('showError', 'cannot log in');
      //       }
      //     })
      //     .error(function(response) {
      //       $rootScope.$emit('loggedin', self);
      //       if (response.errors) {
      //         _.each(_.keys(response.errors), function(ky) {
      //           if (ky.message) self.showNotification('showError', ky.message);
      //         })
      //       } else if (_.isArray(response)) {
      //         _.each(response, function(error) {
      //           if (error.msg) self.showNotification('showError', error.msg);
      //         });
      //       } else {
      //         self.showNotification('showError', 'Whoopss! Sorry something went wrong!');
      //       }
      //     });
      // }

      UserClass.prototype.register = function(user) {
        var self = this;
        $http.post('/addUser', {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email
          })
          .success(function(response) {
            console.log(response);
            $location.url('/ipad');
            self.user = response.user;
            self.loggedin = true;
            $rootScope.$emit('loggedin', self);
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

      // UserClass.prototype.uploadPhoto = function(file, id) {
      //   var self = this;
      //   Upload.upload({
      //     url: 'file?_id=' + id,
      //     data: {
      //       file: file
      //     }
      //   }).then(function(resp) {
      //     var socket = io();
      //     socket.emit('fileupload', 'File uploaded');
      //     socket.on('upload', function(msg) {
      //       console.log('here');
      //       self.getUsers();
      //     });
      //     self.showNotification('showSuccess', 'File is uploaded!');
      //   }, function(resp) {
      //     self.showNotification('showError', 'Whoopss! Sorry something went wrong!');
      //   }, function(evt) {
      //     console.log(evt);
      //   });
      // }

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
        $location.url('/register');
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
  })
  .directive("fineUploader", function($compile, $interpolate, socket, $timeout) {
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
                console.log('here');
                $timeout(function() {
                  socket.emit('fileupload', 'File uploaded');
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
