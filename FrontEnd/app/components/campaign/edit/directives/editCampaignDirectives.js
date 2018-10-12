angular.module('editCampaignModule')
    .directive('editCampaignBasic', function () {
        return {
            scope:true, // A new child scope that prototypically inherits from its parent will be created for the directive's element
            restrict: 'A',
            templateUrl: 'app/components/campaign/edit/editCampaignBasicTemplate',
            controller: 'CampaignBasicController'
        };
    })
    .directive('editCampaignStory', function () {
        return {
            scope:true,
            restrict: 'A',
            templateUrl: 'app/components/campaign/edit/editCampaignStoryTemplate',
            controller: 'CampaignStoryController'
        };
    })
    .directive('editCampaignRewards', function () {
        return {
            restrict: 'A',
            templateUrl: 'app/components/campaign/edit/editCampaignRewardsTemplate',
            controller: 'CampaignRewardsController'
        };
    })
    .directive('editCampaignUploadDocs', function () {
        return {
            restrict: 'A',
            templateUrl: 'app/components/campaign/edit/editCampaignUploadDocsTemplate',
            controller: 'CampaignUploadDocsController'
        };
    })
    .directive('docTable', function () {
        return {
            restrict: 'E',
            scope:{docs:'='},
            templateUrl: 'app/components/campaign/edit/docTableTemplate'
        };
    })
    .directive('convertToNumber', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function (val) {
                    return parseInt(val, 10);
                });
                ngModel.$formatters.push(function (val) {
                    return '' + val;
                });
            }
        };
    });
