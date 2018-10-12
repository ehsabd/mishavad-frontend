angular.module('app').directive('rewardTemplate',function(){
    return{
        restrict: 'AE',
        scope:{
            reward:'=',
            hideRewardImage:"=?",
            hideNClaimed:"=?"
        },
        templateUrl: 'app/components/campaign/reward/campaignRewardTemplate'
    }
})