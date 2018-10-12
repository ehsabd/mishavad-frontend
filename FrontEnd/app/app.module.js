//Just to catch IE and Edge for css (sorry for pure js!)
var doc = document.documentElement;
doc.setAttribute('data-useragent', navigator.userAgent);

// AngularJS App

angular.module('app', [
    "app.templates",
    "editCampaignModule",
    "campaignDetailsModule",
    "campaignResourceModule",
    "app.contribute",
    "ngResource", "ngCookies", "ngRoute", "ngAnimate", "ngSanitize", "ngTouch","ngMessages",
    "ui.bootstrap",  //angular ui
    'dynamicNumber', //other angular plugins
    'readableTimeFa',//
    'iPersian' //user defined modules
])
    .config(['dynamicNumberStrategyProvider', function (dynamicNumberStrategyProvider) {
        dynamicNumberStrategyProvider.addStrategy('price', {
            numInt: 12,
            numFract: 0,
            numSep: '.',
            numPos: true,
            numNeg: false,
            numRound: 'round',
            numThousand: true,
            numThousandSep: ','
        });
    }])
    .directive('mshScrollyAfter', ['$window', function ($window) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                angular.element($window).bind('scroll', function () {
                    var y = $window.scrollY - element[0].clientHeight;
                    if (y > 0 || document.documentElement.clientWidth <= 768) {
                        scope.$apply(function () {
                            scope.scrollyAfter = true;
                        });
                    } else {
                        scope.$apply(function () {
                            scope.scrollyAfter = false;
                        });
                    }
                });
            }
        }
    }])
    .directive('mshClientWidth', ['$timeout', '$window', function ($timeout, $window) {
        return {
            restrict: 'A',
            scope: {
                'ngClientWidth': '='
            },
            link: {
                post: function (scope, elm) {
                    
                    scope.$watch(function () {
                        return elm[0].clientWidth;
                    }, function (newValue) {
                        $timeout(function () {
                            scope.$apply(function (scope) {
                                scope.ngClientWidth = newValue;
                            })
                        })

                    });
                }
            }
        };
    }])
    .directive('mshShowLoadedImg', [function () {
        return {
            restrict: 'A',
            link: function (scope, elm) {
                var img = elm;
                img.css({ opacity: 0 });
                img.bind('load', function () {
                    img.css({ opacity: 1 });
                    console.log('img is loaded');
                });
            }
        };
    }])
    .directive('mshLogo', [function () {
        return {
            templateUrl: 'app/components/shared/logoTemplate'
        }
    }])
    .directive('mshFooter', [function () {
        return {
            templateUrl: 'app/components/shared/footerTemplate'
        }
    }])
    .directive('mshNavigation', [function () {
        return {
            templateUrl: 'app/components/shared/navTemplate'
        }
    }])
    .controller('MainController', ['$scope', '$route', '$routeParams', '$location', '$uibModal', '$cookies', '$http', '$interval', 'constantsUtils', function ($scope, $route, $routeParams, $location, $uibModal, $cookies, $http, $interval, constantsUtils) {

        $scope.$route = $route;
        $scope.$location = $location;
        $scope.$routeParams = $routeParams;

        $scope.currentClass = function () {
            var loc = $scope.$location.path();
            return 'view ' + loc.substr(1).replace(/\//g, '-');
        };

        /*
        Function to check cookies when needed
        NOTE that we don't need to check cookies in time intervals
        only when the user wants to do sth*/
        $scope.checkCookies = function () {
            $scope.isLoggedIn = false
            var token = $cookies.getObject('tokenData');
            if (token == null) {
                return;
            }
            if ((Date.parse(token[".expires"]) - (new Date()).getTime()) < 600000) // i.e. < 10 minutes
            {
                $cookies.remove('tokenData');
                return;
            };
            /* We trust our token!
               It rarely happens when our token is wrong
               Of course we should take care of malicious users changing cookies!*/

            $scope.isLoggedIn = true;
            $scope.access_token = token['access_token'];

            $http({
                method: 'GET',
                url: constantsUtils.API_V1_URL + "/account/Fullname",
                headers: { 'Authorization': ('Bearer ' + token['access_token']) },
                responseType: 'text'
            }).then(
                function (response) {
                    $scope.fullname = response["data"];
                    console.log($scope.fullname);
                },
                function (response) {
                    //This rarely happens
                    //It happens if 
                    //1) Sever is down
                    //2) Token '.expires' prop is wrong (malicious user)
                    console.log(response);
                    $scope.logout();
                });
        }

        $scope.$watch('isLoggedIn', function () {
            if ($scope.isLoggedIn) {

            } else {

            }

        });

        $scope.$on('TitleUpdatedEvent', function (newTitle) {
            $scope.pageTitle = newTitle;
        });

        $scope.$on('AuthFailedEvent', function () {
            $route.reload();
        });


        //openLogin function for login modal
        $scope.openLogin = function () {
            if ($scope.isLoggedIn) { return; }
            //this variable is defined to fix bootstrap problem by removing scrollbar before modal appears
            $scope.beforeModalOpen = true;
            $location.state('login');
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'app/components/account/loginView',
                controller: 'LoginController',

            });
            modalInstance.result.then(function (tokenData) {
                $scope.beforeModalOpen = false; //This is to fix problem of shifting due to scrollbar
                $cookies.putObject('tokenData', tokenData["data"]);

                console.log($cookies.getObject('tokenData'));
                $scope.checkCookies();
                $location.state(null);
            }, function () {
                $scope.beforeModalOpen = false;
                $location.state(null);
            });
        };

        //function to open Register Modal
        $scope.openRegister = function () {

            //this variable is defined to fix bootstrap problem by removing scrollbar before modal appears
            $scope.beforeModalOpen = true;
            $location.state('register');
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'app/components/account/registerView',
                controller: 'RegisterController',
                resolve: {
                    redirectUrl: function () {
                        return $location.protocol() + '://' + $location.host() + '/#/account/email-confirmed';
                    }
                }
            });

            modalInstance.result.then(function () {
                $scope.beforeModalOpen = false; //This is to fix problem of shifting due to scrollbar
                //TODO: Add anything that should be done after registration.
                $location.state(null);
            }, function () {
                // $log.info('Modal dismissed at: ' + new Date());
                $scope.beforeModalOpen = false;
                $location.state(null);
            });

        };

        $scope.logout = function () {
            $cookies.remove('tokenData');
            $scope.isLoggedIn = false;
            delete $scope.token;
            delete $scope.access_token;
            delete $scope.fullname;
        };

        $scope.$on('SlideShowOpenedEvent', function () {
            $scope.isSlideShowOpen = true;
        });

        $scope.$on('SlideShowClosedEvent', function () {
            $scope.isSlideShowOpen = false;
        });

        //Do some initializations!
        $scope.checkCookies(); //For last session


    }]);








