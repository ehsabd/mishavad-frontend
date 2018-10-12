angular.module('app.contribute')
    .controller('ContributeController',
    ['$scope', '$routeParams', '$timeout', 'rewardResource',
        function ($scope, $routeParams, $timeout, rewardResource) {
            console.log($routeParams);
            $scope.selectedIndex = 0;

            $scope.campaignId = $routeParams.campaignId;
            rewardResource().query({ campaignId: $scope.campaignId }, function (data) {
                $scope.campaignRewards = data;
            }, function () {
                console.log('failed')
            });

            $scope.selectReward = function (idx) {
                $scope.contributeOnly = (idx == 'contribute-only');
                if ($scope.contributeOnly) {
                    $scope.selectedRewardId = undefined;
                    $scope.giftFundAmount = undefined;
                }
                else {
                    $timeout(function () { //to prevent flicker of amount
                        var selectedReward = $scope.campaignRewards[idx];
                        $scope.selectedRewardId = selectedReward.id;
                        $scope.giftFundAmount = selectedReward.amount;
                    }, 0);
                }
            };

            $scope.submitPay = function () {

            };

        }]);
        