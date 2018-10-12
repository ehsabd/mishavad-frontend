angular.module('app')
.directive('campaignTabs',function(){
    return{
        restrict: 'AE',
        scope:{
            campaign:'=',
            campaignRewards:'=',
            active:'=',
            fixedHeight:'='
        },
        link: function (scope, element, attrs) {
            scope.$watch('campaign.story', function (i) {
                if (scope.campaign != undefined){
                    /*NOTE: story can be either a JSON string or an ordinary string*/
                   try{
                        scope.campaign.storyElements = JSON.parse(scope.campaign.story);
                   }catch (e){
                       scope.campaign.storyElements = [{type:'text', text:scope.campaign.story}];
                   }
                }
            });
        },
        templateUrl: 'app/components/campaign/details/campaignTabsTemplate'
    }
});