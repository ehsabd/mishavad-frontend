angular.module('campaignDetailsModule', ['ngResource', 'campaignResourceModule'])
    .controller('CampaignDetailsController',
    ['$scope', '$location', '$routeParams', '$timeout', 'campaignResource', 'rewardResource',
        function ($scope, $location, $routeParams, $timeout, campaignResource, rewardResource) {

            $scope.campaignId = $routeParams.campaignId;


            $scope.campaign = campaignResource($scope.access_token).get({ id: $scope.campaignId }, function (data) {
                if (data.hasAccess) {
                    if (~data.status.indexOf("Approved")) {
                        rewardResource($scope.campaignId).query(function (data) {
                            $scope.campaignRewards = data;
                        }, function () {
                            console.log('failed getting rewards');
                        });
                    } else {
                        console.log(data.status);
                        //replace method used to change url without adding it to history (fixes Back button problem)
                        $location.path(['/campaigns/', data.id, '/edit'].join('')).replace();
                    }
                }
            }, function () {
                console.log('failed getting campaign');
            });

            $scope.getProgressStyle = function (p) {
                if (p >= 99) {
                    return { background: 'orange' };
                } else {
                    return { background: 'linear-gradient(135deg,orange,orange ' + (p / 2) + '%,white ' + (p / 2 + 1) + '%, white ' + (100 - p / 2) + '%, orange ' + (100 - p / 2+1) + '%' };
                }
            };
        }]);