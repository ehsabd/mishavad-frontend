//Just to catch IE and Edge for css (sorry for pure js!)
var doc = document.documentElement;
doc.setAttribute('data-useragent', navigator.userAgent);

// AngularJS App

angular.module('app', [
    'app.templates',
    'app.blog',
    'ngResource', 'ngCookies', 'ngRoute', 'ngAnimate', 'ngSanitize', 'ngTouch',
    'ui.bootstrap'  //angular ui
])
    .directive('mshShowLoadedImg', [function () {
        return {
            restrict: 'A',
            link: {
                post: function (scope, elm) {
                    var img = elm;
                    img.css({ opacity: 0 });
                    img.bind('load', function () {
                        img.css({ opacity: 1 });
                        console.log('img is loaded');
                    });
                }
            }
        };
    }])
    .controller('MainController', ['$scope', '$route', '$routeParams', '$location',
        '$uibModal', '$cookies', '$http', '$interval','$timeout', 'ConstantsUtils',
        function ($scope, $route, $routeParams, $location,
            $uibModal, $cookies, $http, $interval,$timeout, ConstantsUtils) {

            $scope.preventLargeSel = function () {
                if ($location.path().indexOf('addedit')!=-1) return;
                if (document.selection) {
                    document.selection.empty();
                } else if (window.getSelection) {

                    var sel = window.getSelection();
                    var selStr = sel.toString();
                  //  console.log('selection:' + selStr.length)
                    if (selStr.length > 1000) {
                        sel.removeAllRanges();
                        $scope.copyPop=true;
                        $timeout(function(){$scope.copyPop=false;},5000);
                    }
                }
            }

            document.addEventListener("selectionchange", $scope.preventLargeSel, false);

            $scope.currentYear = new Date().getFullYear();
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
                    url: ConstantsUtils.API_V1_URL + "/account/Fullname",
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
                        //2) Token '.expires' prop is wrong
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


            $scope.openLoginIfNotLoggedIn = function () {
                if ($scope.isLoggedIn) { return; }
                $scope.openLogin();
            };


            //openLogin function for login modal
            $scope.openLogin = function () {
                if ($scope.isLoggedIn) { return; }
                //this variable is defined to fix bootstrap problem by removing scrollbar before modal appears
                $scope.beforeModalOpen = true;
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'app/components/blogaccount/loginView',
                    controller: 'LoginController',
                    resolve: {
                        translation: function () {
                            return $scope.translation;
                        }
                    }
                });

                modalInstance.result.then(function (tokenData) {
                    $scope.beforeModalOpen = false; //This is to fix problem of shifting due to scrollbar
                    $cookies.putObject('tokenData', tokenData["data"]);

                    console.log($cookies.getObject('tokenData'));
                    $scope.checkCookies();


                }, function () {
                    // $log.info('Modal dismissed at: ' + new Date());
                    $scope.beforeModalOpen = false;
                });
            };

            //function to open Register Modal
            $scope.openRegister = function () {

                //this variable is defined to fix bootstrap problem by removing scrollbar before modal appears
                $scope.beforeModalOpen = true;
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'app/components/blogaccount/registerView',
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

                }, function () {
                    // $log.info('Modal dismissed at: ' + new Date());
                    $scope.beforeModalOpen = false;
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








