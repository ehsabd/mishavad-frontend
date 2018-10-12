
angular.module('app')
    .service('loginService', ['$http', 'ConstantsUtils', function ($http, ConstantsUtils) {
        this.getToken = function (user, pass, successCallbackFunc, errorCallbackFunc) {
            $http({
                method: 'POST',
                url: ConstantsUtils.SERVER_URL + '/Token',
                data: 'grant_type=password&username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass)
                ,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).then(function successCallback(response) {
                successCallbackFunc(response)
                // this callback will be called asynchronously
                // when the response is available
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                errorCallbackFunc(response)
            });
        };
    }])
    .controller('LoginController', ['$scope', '$timeout', 'loginService', '$uibModalInstance', function ($scope, $timeout, loginService, $uibModalInstance) {

        $scope.submitLogin = function () {
            //console.log($scope.loginEmail);
            //console.log($scope.loginPassword);
            $scope.isWaiting = true;
            $scope.showAlert = false;
            $timeout(function () {
                loginService.getToken($scope.loginEmail, $scope.loginPassword,
                    function (tokenData) {
                        $uibModalInstance.close(tokenData);
                    },
                    function (data) {
                        $scope.isWaiting = false;
                        $scope.showAlert = true;
                        if (data.status == 400) {
                            $scope.alertMessage = '_ui_key_LoginError';
                        } else {
                            $scope.alertMessage = '_ui_key_ConnectionError';
                        }
                    }
                );
            }, 500);
        };
    }]);