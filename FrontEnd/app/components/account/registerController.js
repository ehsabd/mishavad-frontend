
angular.module('app').controller('RegisterController', ['$scope', '$timeout', '$http', '$location', '$uibModalInstance', 'constantsUtils', 'redirectUrl', function ($scope, $timeout, $http, $location, $uibModalInstance, constantsUtils, redirectUrl) {

    $scope.alerts = [];

    $scope.submitRegister = function () {
        //console.log($scope.loginEmail);
        //console.log($scope.loginPassword);
        if ($scope.registerModel == undefined) {
            $scope.showAlert = true;
            $scope.alertMessage = 'لطفا اطلاعات بالا را وارد کنید';
            return;
        }
        $scope.isWaiting = true;
        $scope.alerts = [];
        $scope.registerModel.redirectUrl = redirectUrl;
        console.log($scope.registerModel);
        $timeout(function () {
            $http({
                method: 'POST',
                url: (constantsUtils.API_V1_URL + '/Account/Register'),
                headers: { 'Content-Type': 'application/json' },
                data: $scope.registerModel
            })
                .then(
                function (tokenData) {

                    $scope.isWaiting = false;
                    $scope.alerts.push({
                        type: 'success'
                        , msg: 'ثبت نام شما انجام شد. به زودی ایمیلی حاوی لینک تأیید ایمیل برای شما فرستاده خواهد شد. ایمیل خود را چک کنید.'
                    });
                    // $uibModalInstance.close();
                },
                function (data) {
                    $scope.isWaiting = false;
                    var ms = data.data.modelState;
                    console.log(ms);
                    if (ms) {
                        angular.forEach(ms, function (errors, key) {
                            angular.forEach(errors, function (errorMessage) {
                                $scope.alerts.push({
                                    type: 'danger'
                                    , msg: errorMessage
                                });
                            })
                        });

                    } else {
                        var message = data.data.message;
                        if (message) {
						    errors = message.split('|');
                            angular.forEach(errors, function (errorMessage) {
                                $scope.alerts.push({
                                    type: 'danger'
                                    , msg: errorMessage
                                });
                            })
                        }
                    }
                    console.log(data);
                    // $scope.alertMessage = 
                    //TODO: Add specific errors
                }
                );
        }, 500);
    };

    $scope.$on('$locationChangeStart', function (event) {
        if ($location.state() != 'register') {
            $uibModalInstance.dismiss();
        }
    });
}]);