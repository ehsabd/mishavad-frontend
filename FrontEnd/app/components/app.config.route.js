angular.module('app').config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {


    $routeProvider
        .when('/about', {
            templateUrl: 'app/components/home/aboutView',
            reloadOnSearch: false
        })
        .when('/account', {
            templateUrl: 'app/components/account/accountView',
            controller: 'AccountController',
            reloadOnSearch: false
        })
        .when('/account/email-confirmed', {
            templateUrl: 'app/components/account/emailconfirmedView'
        })
        .when('/campaigns/:campaignId/contribute', {
            templateUrl: 'app/components/campaign/contribute/contributeView',
            controller: 'ContributeController',
            resolve: {//TODO: remove this
                // I will cause a 200ms second delay
                delay: function ($q, $timeout) {
                    var delay = $q.defer();
                    $timeout(delay.resolve, 200);
                    return delay.promise;
                }
            },
            reloadOnSearch: false
        })
        .when('/create-campaign-old', {
            templateUrl: 'app/components/campaign/create/createCampaignView'//Controller is defined in template just for the form
        })
        .when('/create-campaign', {
            templateUrl: 'app/components/campaign/edit/editCampaignView',
            controller: 'EditCampaignController',
            reloadOnSearch: false
        })
        .when('/campaigns/:campaignId/edit', {
            templateUrl: 'app/components/campaign/edit/editCampaignView',
            controller: 'EditCampaignController',
            reloadOnSearch: false})
        .when('/campaigns/:campaignId', {
            // url:'/:campaignId/details-of-campaign',
            // params:{
            //     campaignId:null
            // },
            templateUrl: 'app/components/campaign/details/CampaignDetails.tpl',
            controller: 'CampaignDetailsController'
        })
        .when('/home', {
            reloadOnSearch: false,
            templateUrl: 'app/components/home/homeView',
            controller: 'HomeController',
            resolve: {
                func: ['$route', '$location', function ($route, $location) {
                    //NOTE We can not use $routeParams here!
                    /* NOTE2: It's not a good idea to redirect to campaigns page, because
                              in case of using Back navigation when someone enters another page(e.g. contribute), one 
                              can not return to slideshow page!
                    if ($route.current.params.campaignId != undefined){
                        $location.path('/campaigns/'+$route.current.params.campaignId).search({});
                    }*/
                }]
            }
        })
        .when('/', { redirectTo: '/home' });

    // use the HTML5 History API
     $locationProvider.html5Mode(true);

}]);
