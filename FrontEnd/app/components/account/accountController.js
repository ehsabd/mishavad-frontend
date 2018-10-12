angular.module('app')
    .controller('AccountController', ['$scope', 'userinfoFactory', 'campaignResource', function ($scope, userinfoFactory, campaignResource) {

        $scope.getUserData = function(){
            if ($scope.isLoggedIn) {
                var Userinfo = userinfoFactory($scope.access_token);
                $scope.userinfo = Userinfo.get();
                
                $scope.userCampaigns = campaignResource($scope.access_token).query_user_campaigns(function(){
                   // console.log($scope.userCampaigns);
                   for (var i=0;i<$scope.userCampaigns.length;i++){
                       var c = $scope.userCampaigns[i];
                       c.isApproved = ~c.status.indexOf('Approved');
                       c.status = c.status.replace(/\s/g,'').split(',');
                   }
                });
                
            }
        };
        $scope.getUserData();
        $scope.$watch('isLoggedIn', function () {
            $scope.getUserData();
        });
        $scope.removeCampaign = function(ind){
            $scope.userCampaigns[ind].$soft_delete(function(){
               $scope.userCampaigns.splice(ind,1); 
            },
            function(){

            })
        };


    }])
    .factory('userinfoFactory', ['$resource','constantsUtils', function ($resource,constantsUtils) {

        return function (access_token) {
            var Res = $resource(constantsUtils.API_V1_URL + '/Account/UserInfo', { Id: "@Id" },
                {
                    'get': {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + access_token
                        }
                    }
                });
            return Res;
        };

    }]);