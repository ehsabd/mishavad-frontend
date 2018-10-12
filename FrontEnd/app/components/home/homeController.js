//TODO: Fix this factory isArray!
//TODO: Add time filter (createdDateUtc) to prevent problems when a new campaign is added while loading new pages
angular.module('app').factory('campaignPagesResource', ['$resource', 'constantsUtils',
    function ($resource, constantsUtils) {
        return function (url) {
            if (url == undefined) {
                url = constantsUtils.API_V1_URL + '/Campaigns';
            }
            var res = $resource(url, {},
                {
                    'get': {
                        method: 'GET'
                    }
                }
            );
            return res;
        };
    }])
    .controller('HomeController', ['$scope', '$timeout', '$location', 'campaignPagesResource',
        function ($scope, $timeout, $location, campaignPagesResource) {
            $scope.carouselInterval = 5000;
            $scope.slideShow = {};
            $scope.campaignsPages = [];

            $scope.$watch('campaignsPages.length', function () {
                $scope.campaigns = [];
                if ($scope.campaignsPages.length == 0) {
                    return;
                }
                console.log('$scope.campaignsPages.length: ' + $scope.campaignsPages.length);
                for (var i = 0; i < $scope.campaignsPages.length; i++) {
                    var page = $scope.campaignsPages[i];
                    $scope.campaigns = $scope.campaigns.concat(page.items);
                }

                var lastPage = $scope.campaignsPages[$scope.campaignsPages.length - 1];
                $scope.nextPageLink = lastPage.nextPageLink;

            });

            $scope.loadNextPage = function () {
                if ($scope.nextPageLink) {
                    var Campaign = campaignPagesResource($scope.nextPageLink);
                    var page = Campaign.get(function () {
                        $scope.campaignsPages.push(page);
                    });
                }
            };
            
            $timeout(function () {
                var Campaign = campaignPagesResource();
                var page = Campaign.get(function () {
                    $scope.campaignsPages.push(page);
                });
            }, 500);


            $scope.$on('SlideShowOpenedEvent', function () {
                $location.state("slide");
                $scope.carouselInterval = 50000000;
                $scope.isSlideShowOpen = true;
                console.log('SlideShowOpenedEvent'); 
            });

            $scope.$on('SlideShowClosedEvent', function () {
                 $location.state("noslide");
                 console.log('SlideShowClosedEvent');
                $scope.carouselInterval = 5000;
                $scope.isSlideShowOpen = false;
               
            });

        }]); 