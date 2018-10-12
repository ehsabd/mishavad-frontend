angular.module('editCampaignModule')
    .controller('CampaignRewardsController', ['$scope', 'rewardResource', '$element', '$uibModal',
        function ($scope, rewardResource, $element, $uibModal) {

            $scope.$watch('pageProps.uidataLoaded && isLoggedIn && pageProps.campaignId', function (newValue, oldValue) {
                console.log(newValue);
                if (!newValue) { return; }

                $scope.RewardRes = rewardResource($scope.pageProps.campaignId, $scope.access_token);
                //Load rewards
                $scope.rewardQueryInstance = $scope.RewardRes.query(
                    function () { },
                    function () {
                        $scope.alerts.push({
                            type: 'danger'
                            , msg: 'اتصال برای بارگذاری پاداش ها برقرار نشد لطفا دوباره تلاش کنید.'
                        });
                    }
                );
            });

            //ind=undefined for adding a reward
            $scope.addOrEditReward = function (ind) {
                var parentElem = angular.element($element);
                if (ind == undefined) {
                    ind = $scope.rewardQueryInstance.push(new $scope.RewardRes({})) - 1;
                }
                var thisRewardInstance = $scope.rewardQueryInstance[ind];
                var modalInstance = $uibModal.open({
                    templateUrl: 'app/components/campaign/reward/editRewardTemplate',
                    controller: 'EditRewardModalController',
                    appendTo: parentElem,
                    resolve: {
                        reward: function () {
                            return thisRewardInstance;
                        }
                    }
                });
                var oldReward = angular.copy(thisRewardInstance);
                console.log(oldReward);
                modalInstance.result.then(function () {
                    // the reward instance $save method is called in modal controller so no need to do anything here
                }, function () {
                    console.log("dismissed");
                    //undo changes if dismissed
                    if ($scope.rewardQueryInstance[ind].id) { //dismiss edits
                        $scope.rewardQueryInstance[ind] = oldReward;
                    } else {
                        $scope.rewardQueryInstance.splice(ind, 1); //remove dismissed addition
                    }
                });

            };

            $scope.removeReward = function (ind) {
                $scope.rewardQueryInstance[ind].$soft_delete(function () {
                    $scope.rewardQueryInstance.splice(ind, 1);
                },
                    function () {

                    })
            }
        }])
    .controller('EditRewardModalController', ['$scope', 'reward', '$uibModalInstance', function ($scope, reward, $uibModalInstance) {
        $scope.reward = reward;
        $scope.submitReward = function () {
            reward.$save(function () {
                $uibModalInstance.close();
            },
                function () {
                    //add alert for errors
                });

        };
        $scope.dismissModal = function () {
            $uibModalInstance.dismiss();
        }
        $scope.$on('$locationChangeStart', function (event) {
            event.preventDefault();
            $scope.dismissModal();
        });

        $scope.fileInputLoaded = function (imageData) {
            $scope.reward.newImage = imageData;
        };
    }]);
