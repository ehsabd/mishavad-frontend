
angular.module('app').factory('campaignFactory', ['$resource', function ($resource) {
    return function (access_token) {
        return $resource(GLOBAL_serverUri + '/api/Campaigns', null, {
            'save': {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + access_token,
                    'Content-type': 'application/json'
                }
            }
        });
    }
}])
.controller('CreateCampaignController', ['$scope', '$timeout', 'campaignFactory', function ($scope, $timeout, campaignFactory) {

    $scope.createCampaign = function () {
        
        if ($scope.campaign == undefined) {
            console.log($scope.campaign);
            $scope.showAlert = true;
            $scope.alertMessage = 'لطفا اطلاعات بالا را وارد کنید';
            return;
        }
        $scope.isWaiting = true;
        var CampaignResource = campaignFactory($scope.access_token);    
        var newcampaign = new CampaignResource.save($scope.campaign);
        newcampaign.$promise.then(
            function (response) {
                console.log('response:');
                console.log(response);
                $scope.showAlert = true;
                $scope.success = true;
                $scope.isWaiting = false;
                $scope.alertMessage = 'کمپین شما ایجاد شد. جزئیات آن را در صفحه بعدی ویرایش کنید';
                //success
            },
            function (response) {
                console.log(response);
                $scope.isWaiting = false;
                $scope.showAlert = true;
                $scope.alertMessage = 'مشکلی هنگام ایجاد کمپین به وجود آمده';
               
            }
        );


    };
}]); 