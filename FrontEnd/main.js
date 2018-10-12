;(function(angular) {
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









angular.module('app.templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('app/components/account/accountView','<div class="well" ng-if="!isLoggedIn"><p>\u0627\u06CC\u0646 \u0635\u0641\u062D\u0647 \u0627\u0639\u0636\u0627\u0621 \u0627\u0633\u062A \u0634\u0645\u0627 \u0647\u0646\u0648\u0632 \u0639\u0636\u0648 \u0646\u0634\u062F\u0647 \u0627\u06CC\u062F</p><a ng-click="">\u0647\u0645\u06CC\u0646 \u062D\u0627\u0644\u0627 \u062F\u0631 \u0645\u06CC \u0634\u0648\u062F \u0639\u0636\u0648 \u0634\u0648\u06CC\u062F</a></div><div ng-if="isLoggedIn" class="container"><div class="row user-name"><h2>{{userinfo.firstName + \' \' + userinfo.lastName}}</h2></div><uib-tabset><uib-tab index="0" heading="\u06A9\u0645\u067E\u06CC\u0646 \u0647\u0627"><h3>\u06A9\u0645\u067E\u06CC\u0646 \u0647\u0627\u06CC \u0627\u06CC\u062C\u0627\u062F \u0634\u062F\u0647 \u062A\u0648\u0633\u0637 \u0645\u0646</h3><div class="row user-campaign" ng-repeat="camp in userCampaigns"><div class="col-sm-4"><h4><a href="{{\'/campaigns/\' + camp.id+\'/edit\'}}" ng-bind="camp.title"></a></h4><a><div class="user-camp-img"><img class="img-responsive" ng-src="{{camp.thumbnail || \'/FrontEnd/assets/img/default-thumbnail.png\'}}"></div></a></div><div class="col-sm-4">{{camp.tagline}}</div><div class="col-sm-4 controls"><span ng-repeat="s in camp.status" class="label label-default status" ng-class="s.toLowerCase()" ng-bind="(\'_ui_key_Status\'+s) | xlat"></span><div ng-if="!camp.isApproved"><a class="btn btn-danger btn-remove" ng-click="showRemoveBox=true">\u062D\u0630\u0641 \u06A9\u0645\u067E\u06CC\u0646 <i class="fa fa-trash" aria-hidden="true"></i></a><div class="remove-box" ng-show="showRemoveBox"><p>\u0622\u06CC\u0627 \u0628\u0631\u0627\u06CC \u062D\u0630\u0641 \u06A9\u0645\u067E\u06CC\u0646 <strong>\'{{camp.title}}\'</strong> \u0645\u0637\u0645\u0626\u0646 \u0647\u0633\u062A\u06CC\u062F</p><a class="btn btn-danger" ng-click="removeCampaign($index)">\u0628\u0644\u06CC</a> <a class="btn btn-default" ng-click="showRemoveBox=false">\u062E\u06CC\u0631</a></div></div></div></div></uib-tab></uib-tabset></div>');
$templateCache.put('app/components/account/emailconfirmedView','<div class="well"><p>\u0627\u06CC\u0645\u06CC\u0644 \u0634\u0645\u0627 \u0645\u0648\u0631\u062F \u062A\u0623\u06CC\u06CC\u062F \u0642\u0631\u0627\u0631 \u06AF\u0631\u0641\u062A</p><p ng-show="!isLoggedIn">\u0628\u0631\u0627\u06CC \u0648\u0627\u0631\u062F \u0634\u062F\u0646 \u0628\u0647 \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062E\u0648\u062F <a ng-click="openLogin();">\u0627\u06CC\u0646\u062C\u0627 \u06A9\u0644\u06CC\u06A9 \u06A9\u0646\u06CC\u062F</a></p></div>');
$templateCache.put('app/components/account/loginView','<form><div class="modal-header"><h3 class="modal-title">\u0648\u0631\u0648\u062F \u0628\u0647 \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC</h3></div><div class="modal-body"><div class="login-wrapper container-fluid"><div class="form-group"><label>{{\'_ui_key_Email\' | xlat}}</label><div class="right-inner-addon"><i class="fa fa-envelope" aria-hidden="true"></i> <input type="text" class="form-control" ng-model="loginEmail" placeholder="Email" value=""></div></div><div class="form-group"><label>{{\'_ui_key_Password\' | xlat}}</label> <input type="password" class="form-control" ng-model="loginPassword" placeholder="Password"></div><div uib-alert="" class="alert-danger" ng-bind="alertMessage | xlat" ng-if="showAlert"></div></div></div><div class="modal-footer"><button class="login-btn btn btn-default btn-bez btn-bez-md" type="submit" ng-class="{\'waiting\': isWaiting}" ng-click="submitLogin()">{{\'_ui_key_LogIn\' | xlat}}</button></div></form>');
$templateCache.put('app/components/account/registerView','<form><div class="modal-header"><h3 class="modal-title" ng-bind-html="\'_ui_key_RegisterTitle\' | xlat"></h3></div><div class="modal-body"><div class="register-wrapper container-fluid"><div class="register-input-form" ng-show="!showSuccess"><div class="row"><div class="col-md-6 form-group"><label>{{\'_ui_key_FirstName\' | xlat}}</label> <input type="text" class="form-control" ng-model="registerModel.firstName"></div><div class="col-md-6 form-group"><label>{{\'_ui_key_LastName\' | xlat}}</label> <input type="text" class="form-control" ng-model="registerModel.lastName"></div></div><div class="form-group"><label>{{\'_ui_key_Email\' | xlat}}</label><div class="right-inner-addon"><i class="fa fa-envelope" aria-hidden="true"></i> <input type="text" class="form-control" ng-model="registerModel.email" placeholder="Email" value=""></div></div><div class="form-group"><label>{{\'_ui_key_Password\' | xlat}}</label> <input type="password" class="form-control" ng-model="registerModel.password" placeholder="Password"></div><div class="form-group"><label>{{\'_ui_key_ConfirmPassword\' | xlat}}</label> <input type="password" class="form-control" ng-model="registerModel.confirmPassword" placeholder="Password"></div></div><div uib-alert="" ng-repeat="alert in alerts" ng-class="\'alert-\' + alert.type" close="closeAlert($index)" ng-bind-html="alert.msg | xlat"></div></div></div><div class="modal-footer"><button class="register-btn btn btn-default btn-bez btn-bez-sm" type="submit" ng-show="!showSuccess" ng-class="{\'waiting\': isWaiting}" ng-click="submitRegister()">{{\'_ui_key_Register\' | xlat}}</button></div></form>');
$templateCache.put('app/components/home/aboutView','<div id="about-page" class="container"><p></p><h2>\u0645\u06CC \u0634\u0648\u062F \u0686\u0647 \u06A9\u0627\u0631 \u0645\u06CC \u06A9\u0646\u062F\u061F</h2><p>\u0645\u06CC \u0634\u0648\u062F \u06CC\u06A9 \u0633\u0627\u0645\u0627\u0646\u0647 <strong>\u062D\u0645\u0627\u06CC\u062A \u0645\u0627\u0644\u06CC \u062C\u0645\u0639\u06CC</strong> \u06CC\u0627 \u06A9\u0631\u0627\u0648\u062F\u0641\u0627\u0646\u062F\u06CC\u0646\u06AF (Crowdfunding) \u0627\u0633\u062A \u06A9\u0647 \u0628\u0631 \u0627\u0641\u0632\u0627\u06CC\u0634 \u0631\u0648\u062D\u06CC\u0647 \u06A9\u0627\u0631\u0622\u0641\u0631\u06CC\u0646\u06CC \u0648 \u0627\u0645\u06CC\u062F \u062F\u0631 \u0645\u0628\u062A\u06A9\u0631\u06CC\u0646 \u0627\u06CC\u0631\u0627\u0646\u06CC \u062A\u0623\u06A9\u06CC\u062F \u062F\u0627\u0631\u062F. \u0645\u06CC \u0634\u0648\u062F \u0641\u0631\u0635\u062A\u06CC \u0631\u0627 \u0641\u0631\u0627\u0647\u0645 \u0645\u06CC \u0622\u0648\u0631\u062F \u062A\u0627 \u06A9\u0627\u0631\u0628\u0631\u0627\u0646\u0634 \u0628\u0627 \u0645\u0631\u0648\u0631 \u067E\u0631\u0648\u0698\u0647 \u0647\u0627\u06CC \u0645\u062E\u062A\u0644\u0641\u06CC \u06A9\u0647 \u067E\u0631\u0648\u0698\u0647 \u0622\u0641\u0631\u06CC\u0646\u0627\u0646 \u062F\u0631 \u0622\u0646 \u0627\u0631\u0627\u0626\u0647 \u0645\u06CC \u06A9\u0646\u0646\u062F\u060C \u0627\u0632 \u067E\u0631\u0648\u0698\u0647 \u0647\u0627\u06CC\u06CC \u06A9\u0647 \u0641\u06A9\u0631 \u0645\u06CC \u06A9\u0646\u0646\u062F \u0645\u06CC \u062A\u0648\u0627\u0646\u0646\u062F \u0628\u0631\u0627\u06CC \u06A9\u0633\u0628 \u0648 \u06A9\u0627\u0631 \u0627\u06CC\u0631\u0627\u0646\u06CC \u0645\u0641\u06CC\u062F \u0628\u0627\u0634\u0646\u062F \u062D\u0645\u0627\u06CC\u062A \u06A9\u0646\u0646\u062F</p><h2>\u0646\u0642\u0634 \u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u0645\u06CC \u0634\u0648\u062F \u0686\u06CC\u0633\u062A\u061F</h2><p>\u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u0645\u06CC \u0634\u0648\u062F \u062A\u0646\u0647\u0627 \u0646\u0642\u0634 \u062D\u0645\u0627\u06CC\u062A \u0645\u0627\u0644\u06CC \u0627\u0632 \u067E\u0631\u0648\u0698\u0647 \u0647\u0627\u06CC \u067E\u0633\u062A \u0634\u062F\u0647 \u062F\u0631 \u0648\u0628\u0633\u0627\u06CC\u062A \u0631\u0627 \u0646\u062F\u0627\u0631\u0646\u062F. \u0622\u0646 \u0647\u0627 \u0628\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u067E\u0631\u0648\u0698\u0647 \u0647\u0627\u06CC\u06CC \u06A9\u0647 \u0628\u0647 \u0646\u0638\u0631 \u0622\u0646 \u0647\u0627 \u0645\u0641\u06CC\u062F\u060C \u06A9\u0627\u0631\u0628\u0631\u062F\u06CC\u060C \u0642\u0627\u0628\u0644 \u0627\u062C\u0631\u0627\u060C \u06CC\u0627 \u062C\u0630\u0627\u0628 \u0647\u0633\u062A\u0646\u062F \u0646\u0648\u0639\u06CC \u062F\u0645\u0648\u06A9\u0631\u0627\u0633\u06CC \u06A9\u0633\u0628 \u0648 \u06A9\u0627\u0631 \u0628\u0647 \u0648\u062C\u0648\u062F \u0645\u06CC \u0622\u0648\u0631\u0646\u062F. \u0648 \u0642\u0628\u0644 \u0627\u0632 \u0627\u06CC\u0646\u06A9\u0647 \u0645\u062C\u0631\u06CC\u0627\u0646 \u067E\u0631\u0648\u0698\u0647 \u0647\u0627 \u0628\u0647 \u0627\u062C\u0631\u0627\u06CC \u06A9\u0627\u0631\u0647\u0627\u06CC \u062E\u0648\u062F \u0628\u067E\u0631\u062F\u0627\u0632\u0646\u062F \u0641\u0631\u0635\u062A\u06CC \u0631\u0627 \u0628\u0631\u0627\u06CC \u0622\u0646 \u0647\u0627 \u0641\u0631\u0627\u0647\u0645 \u0645\u06CC \u0622\u0648\u0631\u0646\u062F \u06A9\u0647 \u0645\u0631\u062F\u0645 \u0627\u0632 \u0686\u0647 \u0686\u06CC\u0632\u0647\u0627\u06CC\u06CC \u062E\u0648\u0634\u0634\u0627\u0646 \u0645\u06CC \u0622\u06CC\u062F \u0648 \u0622\u0646 \u0647\u0627 \u0686\u0647 \u0686\u06CC\u0632\u0647\u0627\u06CC\u06CC \u0631\u0627 \u062C\u0630\u0627\u0628 \u0645\u06CC \u062F\u0627\u0646\u0646\u062F. \u0648 \u0627\u06CC\u0646 \u06CC\u06A9 \u0646\u0648\u0639 \u0622\u0645\u0627\u06CC\u0634 \u0628\u0627\u0632\u0627\u0631 \u0642\u0628\u0644 \u0627\u0632 \u0627\u0642\u062F\u0627\u0645 \u0628\u0647 \u062A\u0648\u0644\u06CC\u062F \u0627\u0633\u062A.</p><p></p></div>');
$templateCache.put('app/components/home/carouselView','<script type="text/ng-template" id="customTemplate.html"><div class="carousel-inner" ng-transclude></div> <a role="button" href class="left carousel-control" ng-click="prev()" ng-class="{ disabled: isPrevDisabled() }" ng-show="slides.length > 1"> <i class="fa fa-chevron-circle-left" aria-hidden="true"></i> <span class="sr-only">previous</span> </a> <a role="button" href class="right carousel-control" ng-click="next()" ng-class="{ disabled: isNextDisabled() }" ng-show="slides.length > 1"> <i class="fa fa-chevron-circle-right" aria-hidden="true"></i> <span class="sr-only">next</span> </a> <ol class="carousel-indicators" ng-show="slides.length > 1"> <li ng-repeat="slide in slides | orderBy:indexOfSlide track by $index" ng-class="{ active: isActive(slide) }" ng-click="select(slide)"> <span class="sr-only">slide {{ $index + 1 }} of {{ slides.length }}<span ng-if="isActive(slide)">, currently active</span></span> </li> </ol></script><div style="height: 305px; overflow: hidden;"><div uib-carousel="" active="1" interval="interval" no-wrap="" template-url="customTemplate.html"><div uib-slide="" ng-repeat="slide in slides track by slide.id" index="slide.id"><img ng-src="{{slide.image}}" style="margin:auto"><div class="carousel-caption"><div ng-bind-html="slide.html | xlat" ng-style="{\'color\': slide.textColor, \'background\': slide.backColor}"></div></div></div></div></div>');
$templateCache.put('app/components/home/gridGalleryView','<div id="grid-gallery" class="row grid-gallery" ng-class="{\'slideshow-open\' : slideShow.open}"><section class="grid-wrap"><ul class="grid"><li class="grid-sizer"></li><li ng-repeat="camp in campaigns" class="campaign-tile"><figure ng-click="openSlideShow($index)"><div ng-if="camp.thumbnail" style="height:200px; overflow:hidden;"><img msh-show-loaded-img="" class="img-responsive" ng-src="{{camp.thumbnail}}" alt="Campaign Thumbnail Image"></div><figcaption><div id="campaign_{{camp.id}}"><div class="primary"><h2 class="campaign-title row">{{camp.title}}</h2><div class="tagline"><p>{{camp.tagline}}</p></div><div class="campaign-tags row" style="padding-bottom:5px"><span class="col-xs-6 category text-center">{{camp.category}}</span> <span class="col-xs-6 stage text-center">{{camp.projectStage}}</span></div><div class="progress-container"><div class="row"><div class="collected-wrap col-xs-6"><div class="collected-fund"><p ng-bind-html="\'_ui_key_CollectedFundOnly\'|xlat:({\'collectedFund\':(camp.collectedFund | awnum:\'price\')})"></p></div></div><div class="progress-wrap"><uib-progressbar class="active" value="camp.collectedFundPercent">{{camp.collectedFundPercent}}%</uib-progressbar></div></div><div class="row"><div class="time-left"><i class="fa" ng-class="getHourglass(camp)" aria-hidden="true"></i> <span ng-bind-html="\'_ui_key_TimeLeft\' | xlat:({\'readableTimeLeft\':(camp.totalSecondsLeft | readableTimeFa)})"></span></div></div></div></div></div></figcaption></figure></li></ul></section><section class="slideshow" ng-swipe-right="prevSlide()" ng-swipe-left="nextSlide()"><ul class="animatable"><li cbp-grid-gallery-repeat="" ng-repeat="camp in campaigns" id="slide_{{$index}}" ng-class="{\'current show\':slideShow.currentIndex==$index, \'show\': ($index==slideShow.currentIndex-1) || ($index==slideShow.currentIndex+1)}"><figure><h3 class="camp-title">{{camp.title}} <a href="/campaigns/{{camp.id}}" class="btn btn-camp-page">\u0635\u0641\u062D\u0647 \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u06A9\u0645\u067E\u06CC\u0646</a> <a href="/campaigns/{{camp.id}}/contribute" class="btn-msh btn" ng-bind="\'_ui_key_Contribute\'|xlat"></a></h3><div ng-show="camp.thumbnail" class="camp-img-wrapper"><img class="img-responsive camp-img" ng-src="{{camp.thumbnail}}" alt="{{camp.title}}"></div><div campaign="camp" campaign-tabs="" fixed-height="true" campaign-rewards="currentCampaignRewards" active="slideShow.activeTabIndex"></div></figure></li></ul><nav><span class="icon nav-prev" ng-click="prevSlide()" ng-show="slideShow.currentIndex > 0"></span> <span class="icon nav-next" ng-click="nextSlide()" ng-show="slideShow.currentIndex < campaigns.length - 1"></span> <span class="icon nav-close" ng-click="closeSlideShow()"></span></nav></section></div>');
$templateCache.put('app/components/home/homeView','<div ng-class="{\'slideshow-open\':isSlideShowOpen}"><div class="first-section create-camp-landing container-fluid"><div class="row"><div class="col-xs-12 create-camp-wrap"><ul class="fa-ul"><li>\u0627\u0647\u0644 \u0646\u0648\u0622\u0648\u0631\u06CC \u0648 \u062E\u0644\u0627\u0642\u06CC\u062A \u0647\u0633\u062A\u06CC\u0646\u061F<i class="fa fa-square"></i></li><li>\u0645\u06CC \u062E\u0648\u0627\u06CC\u0646 \u06CC\u0647 \u0645\u062D\u0635\u0648\u0644 \u062C\u0627\u0644\u0628 \u062A\u0648\u0644\u06CC\u062F \u06A9\u0646\u06CC\u0646\u061F<i class="fa fa-square"></i></li><li>\u0628\u0631\u0627\u06CC \u062D\u0645\u0627\u06CC\u062A \u0627\u0632 \u0645\u062D\u06CC\u0637 \u0632\u06CC\u0633\u062A \u0627\u06CC\u062F\u0647 \u062F\u0627\u0631\u06CC\u0646\u061F<i class="fa fa-square"></i></li><li>\u0641\u06A9\u0631\u06CC \u062F\u0627\u0631\u06CC\u062F \u06A9\u0647 \u0645\u06CC \u062A\u0648\u0646\u0647 \u0628\u0647 \u0633\u0644\u0627\u0645\u062A \u062C\u0627\u0645\u0639\u0647 \u06A9\u0645\u06A9 \u06A9\u0646\u0647 \u06CC\u0627 \u062F\u0631\u062F \u0628\u06CC\u0645\u0627\u0631\u0627\u0646 \u0631\u0648 \u06A9\u0645 \u06A9\u0646\u0647\u061F<i class="fa fa-square"></i></li><li>\u0645\u06CC \u062E\u0648\u0627\u06CC\u0646 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646 \u06CC\u0627 \u0648\u0628\u0633\u0627\u06CC\u062A \u0628\u0633\u0627\u0632\u06CC\u062F \u0627\u0645\u0627 \u0633\u0631\u0645\u0627\u06CC\u0647 \u0646\u062F\u0627\u0631\u06CC\u0646\u061F<i class="fa fa-square"></i></li></ul><div class="text-center"><a href="/create-campaign" class="btn btn-default create-campaign" ng-bind-html="\'_ui_key_CreateCampaignBanner\' | xlat"></a><p ng-bind="\'_ui_key_BavarKonidMishavad\' | xlat"></p></div></div></div></div><div id="campaigns" class="second-section"><div id="active-campaigns"><div cbp-grid-gallery="" campaigns="campaigns" on-close="$emit(\'SlideShowClosedEvent\')" on-open="$emit(\'SlideShowOpenedEvent\')"></div><button class="btn btn-inverse" ng-if="nextPageLink" ng-click="loadNextPage()">\u0646\u0645\u0627\u06CC\u0634 \u0628\u06CC\u0634\u062A\u0631 ...</button></div></div><div class="third-section text-center"><p>\u0633\u0627\u06CC\u062A \u06CC\u0627 \u0648\u0628\u0644\u0627\u06AF \u062F\u0627\u0631\u06CC\u062F\u061F \u0645\u06CC \u062E\u0648\u0627\u06CC\u062F \u067E\u06CC\u0627\u0645 \u0645\u06CC \u0634\u0648\u062F \u0631\u0648 \u0628\u0647 \u062F\u06CC\u06AF\u0631\u0627\u0646 \u0628\u0631\u0633\u0648\u0646\u06CC\u062F\u061F</p></div></div>');
$templateCache.put('app/components/shared/footerTemplate','<div class="footer-right"><div class="logo footer-logo"></div><p class="footer-links"><a href="/home">\u062E\u0627\u0646\u0647</a> \xB7 <a href="/">\u0628\u0644\u0627\u06AF \u0645\u06CC \u0634\u0648\u062F</a> \xB7 <a href="/about">\u062F\u0631\u0628\u0627\u0631\u0647 \u0645\u0627</a> \xB7 <a href="/">\u067E\u0631\u0633\u0634 \u0648 \u067E\u0627\u0633\u062E</a> \xB7 <a href="/">\u062A\u0645\u0627\u0633 \u0628\u0627 \u0645\u0627</a></p><p class="footer-company-name">\u0645\u06CC \u0634\u0648\u062F &copy; 2015</p></div><div class="footer-center"><div><i class="fa fa-map-marker"></i><p><span>\u062E\u06CC\u0627\u0628\u0627\u0646 \u0631\u0648\u06CC\u0627\u0647\u0627\u060C \u06A9\u0648\u0686\u0647 \u062A\u0644\u0627\u0634\u060C \u067E\u0644\u0627\u06A9 \u0645\u0648\u0641\u0642\u06CC\u062A</span> \u06CC\u06A9 \u0646\u0642\u0637\u0647 \u0627\u0632 \u0627\u06CC\u0631\u0627\u0646</p></div><div><i class="fa fa-phone"></i><p>+9800000000000</p></div><div><i class="fa fa-envelope"></i><p><a href="mailto:support@company.com">support@mishavad.ir</a></p></div></div><div class="footer-left"><p class="footer-company-about"><span>\u0686\u0631\u0627 \u0646\u0634\u0647\u061F \u0645\u06CC\u0634\u0647 \u062E\u0648\u0628\u0645 \u0645\u06CC\u0634\u0647!</span> \u0645\u06CC \u0634\u0648\u062F \u06CC\u06A9 \u067E\u0644\u062A\u0641\u0631\u0645 \u06A9\u0631\u0627\u0648\u062F\u0641\u0627\u0646\u062F\u06CC\u0646\u06AF\u0647 \u06A9\u0647 \u062E\u06CC\u0644\u06CC \u0633\u0627\u062F\u0647 \u0645\u06CC \u062E\u0648\u0627\u062F \u0628\u06AF\u0647 \u0645\u06CC \u0634\u0648\u062F</p><div class="footer-icons"><a href="/"><i class="fa fa-facebook"></i></a> <a href="/"><i class="fa fa-twitter"></i></a> <a href="/"><i class="fa fa-linkedin"></i></a> <a href="/"><i class="fa fa-github"></i></a></div></div>');
$templateCache.put('app/components/shared/logoTemplate','<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" id="svg2" height="200" width="350"><path id="path3760" d="m 283.13284,83.53728 c -17.295,5e-5 -26.19,10.216 -26.686,30.65 -0.16526,7.0502 -0.46758,10.852 -0.90821,11.402 -1.4321,1.6524 -6.3619,2.4785 -14.789,2.4785 l -40.197,0 -12.68,14.871 c 9.8592,0 15.615,0.0828 17.268,0.24804 9.088,0.71603 13.633,2.6706 13.633,5.8652 -8e-5,5.2325 -1.818,9.3651 -5.4531,12.395 -3.415,2.809 -7.7671,4.2129 -13.055,4.2129 l -19.084,0 c -7.2705,-2e-5 -13.192,-1.8448 -17.764,-5.5352 -4.9572,-4.0208 -7.4356,-9.5842 -7.4356,-16.689 l 0,-32.305 -14.871,18 0,8.6035 c -1e-5,12.062 3.0561,22.032 9.1699,29.908 6.7197,8.5924 15.946,12.889 27.678,12.889 l 22.887,0 c 8.7576,-4e-5 16.329,-2.8366 22.719,-8.5098 6.5544,-5.8935 9.8319,-13.163 9.832,-21.811 l -0.74414,-7.2715 8.0976,0 5.7012,0 0,-0.22461 c 8.9852,-0.48299 15.51,-1.5863 19.498,-3.3281 4.847,3.7454 10.437,5.6191 16.771,5.6191 8.317,0 14.789,-3.0022 19.416,-9.0059 4.2411,-5.4529 6.3613,-12.449 6.3613,-20.986 -6e-5,-8.5924 -2.0105,-15.779 -6.0312,-21.562 -4.6267,-6.6095 -11.072,-9.914 -19.334,-9.9141 z m -0.41211,14.541 c 8.5373,4e-5 12.807,5.3689 12.807,16.109 -6e-5,10.685 -4.2694,16.029 -12.807,16.029 -8.7026,2e-5 -13.055,-5.1513 -13.055,-15.451 -3e-5,-11.126 4.3521,-16.687 13.055,-16.688 z" inkscape:connector-curvature="0"></path><path id="path4711" d="m 221.82284,23.717278 c -8e-5,2.6439 -0.93643,4.8195 -2.809,6.5269 -1.8728,1.7076 -4.1035,2.5613 -6.6922,2.5612 -2.754,8e-5 -5.15,-0.82611 -7.1879,-2.4786 -2.2032,-1.7625 -3.3048,-3.9656 -3.3048,-6.6095 -6e-5,-5.3426 3.167,-8.014 9.5012,-8.0141 6.995,1e-4 10.493,2.6714 10.493,8.0141 z" inkscape:connector-curvature="0"></path><path id="path4709" d="m 236.36284,44.707278 c -9e-5,2.6439 -0.92267,4.8333 -2.7677,6.568202 -1.8452,1.7351 -4.0897,2.6026 -6.7335,2.6025 -2.754,6e-5 -5.1776,-0.85367 -7.2705,-2.5612 -2.0931,-1.707402 -3.1396,-3.910602 -3.1395,-6.609502 -7e-5,-5.2876 3.1119,-7.9314 9.336,-7.9314 7.0501,8e-5 10.575,2.6439 10.575,7.9314 z" inkscape:connector-curvature="0"></path><path id="path4707" d="m 207.61284,44.707278 c -6e-5,2.5337 -0.92264,4.6956 -2.7677,6.485602 -1.8452,1.7901 -4.0346,2.6852 -6.5682,2.6851 -2.8091,6e-5 -5.2326,-0.85367 -7.2705,-2.5612 -2.038,-1.707402 -3.057,-3.910602 -3.0569,-6.609502 -4e-5,-5.2876 3.167,-7.9314 9.5012,-7.9314 6.7747,8e-5 10.162,2.6439 10.162,7.9314 z" inkscape:connector-curvature="0"></path><path d="m 115.54675,51.39478 c -8.2621,0 -14.12766,1.48674 -17.597657,4.46094 -6.0037,5.012 -9.005869,13.7434 -9.005859,26.1914 0,11.402 3.772459,19.30454 11.318356,23.71094 5.783,3.3599 14.81661,5.04102 27.09961,5.04102 -0.2754,6.9946 -2.75385,12.52957 -7.43554,16.60547 -4.682,4.0758 -10.54756,6.11328 -17.59766,6.11328 l -2.753907,0 -13.935547,14.87109 19.167974,0 c 10.961,0 20.08861,-3.53949 27.38671,-10.61719 7.29658,-7.07672 10.94589,-16.06541 10.94727,-26.96875 l 17.21484,0 c 6.389,0 12.91743,-3.47015 19.58203,-10.41015 6.334,7.8214 13.08179,11.73242 20.24219,11.73242 6.334,0 12.36545,-3.30457 18.09375,-9.91407 5.784,6.7202 12.61383,10.08008 20.49023,10.08008 6.8849,0 12.17093,-2.58812 15.86133,-7.76562 3.3047,-4.572 4.95692,-10.43726 4.95703,-17.59766 l 0,-22.80469 -14.54101,10 0,14.70313 c 0,6.169 -3.47026,9.25393 -10.41016,9.25391 -3.5802,0 -6.60939,-1.12842 -9.08789,-3.38672 -2.4787,-2.2582 -3.71883,-5.15068 -3.71875,-8.67578 l 0,-21.89454 -14.45703,10 0,14.70313 c 0,6.169 -3.49914,9.25393 -10.49414,9.25391 -3.5802,0 -6.58246,-1.11501 -9.00586,-3.34571 -2.4235,-2.2307 -3.6348,-5.13659 -3.63477,-8.71679 l 0,-21.89454 -14.62304,8.08399 0,12.90234 c 0,7.2153 -3.44323,10.82229 -10.32813,10.82227 l -6.30859,0 0,-0.004 -9.83203,0 c -0.2204,-14.156 -1.48553,-24.09787 -3.79883,-29.82617 -4.021,-9.8039 -11.95292,-14.70698 -23.79492,-14.70703 z m 0,14.70508 c 3.9657,10e-5 7.07763,1.68121 9.33593,5.04101 1.98281,2.9744 2.97455,6.52731 2.97461,10.65821 l 0,14.12695 c -7.71089,1e-4 -12.97224,-0.49684 -15.78124,-1.48828 -5.2326,-1.762 -7.84769,-5.78145 -7.84766,-12.06055 0,-5.3426 0.57768,-9.17097 1.73438,-11.48437 1.6523,-3.1946 4.84708,-4.79293 9.58398,-4.79297 z" id="path3764" inkscape:connector-curvature="0"></path><path id="path3766" d="m 89.122843,71.38728 c -8e-5,5.9486 -2.2308,10.74 -6.6922,14.376 -4.131,3.3598 -9.2259,5.0398 -15.285,5.0398 l -46.102,0 9.9345,-14.871 35.176,0 c 5.5079,0 8.2619,-1.9278 8.2619,-5.7833 -6e-5,-1.9828 -0.74364,-3.7729 -2.2307,-5.3702 l -25.461,-27.609002 1.9969,-18.08 33.461,35.444002 c 4.6266,4.9021 6.9399,10.52 6.94,16.854 z" inkscape:connector-curvature="0"></path></svg>');
$templateCache.put('app/components/shared/navTemplate','<div class="container-fluid"><div class="row"><div class="col-sm-2 logo-wrap"><button type="button" class="navbar-toggle" ng-click="isNavCollapsed = !isNavCollapsed"><span class="sr-only">Toggle navigation</span> <span class="icon-bar"></span> <span class="icon-bar"></span> <span class="icon-bar"></span></button><div msh-logo="" class="header-logo" ng-class="{\'nav-open\':!isNavCollapsed}"></div></div><div class="col-sm-10 nav-wrap collapse navbar-collapse" uib-collapse="isNavCollapsed" ng-click="isNavCollapsed = true"><div class="row"><div class="col-md-5 nav-account-wrap"><ul class="nav navbar-nav navbar-left" ng-cloak=""><li ng-hide="isLoggedIn"><a href="" ng-click="openRegister()">\u062B\u0628\u062A \u0646\u0627\u0645 <i class="fa fa-user-plus"></i></a></li><li ng-hide="isLoggedIn"><a href="" ng-click="openLogin();">\u0648\u0631\u0648\u062F \u0628\u0647 \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC</a></li><li ng-show="isLoggedIn"><a href="/account" class="hello-user" ng-bind-template="\u0633\u0644\u0627\u0645 {{fullname}}!"></a></li><li ng-show="isLoggedIn"><a href="" ng-click="logout();">\u062E\u0631\u0648\u062C</a></li></ul></div><div class="col-md-7"><ul class="nav navbar-nav navbar-left"><li><a href="/home">\u062E\u0627\u0646\u0647</a></li><li><a href="/about">\u062F\u0631\u0628\u0627\u0631\u0647 \u0645\u06CC \u0634\u0648\u062F</a></li><li><a href="/contact">\u062A\u0645\u0627\u0633 \u0628\u0627 \u0645\u0627</a></li><li><a href="/create-campaign" class="btn btn-success create-campaign" ng-bind-html="\'_ui_key_CreateCampaignBanner\' | xlat"></a></li></ul></div></div></div></div></div>');
$templateCache.put('app/components/campaign/contribute/contributeView','<div id="contribute-page" class="container" ng-show="campaignRewards"><div class="row page-header"><h2>\u062D\u0645\u0627\u06CC\u062A \u0627\u0632 \u06A9\u0645\u067E\u06CC\u0646</h2><p ng-bind-html="\'_ui_key_ContributeStepsNote\' | xlat"></p></div><div class="steps-container"><div class="row step"><span class="stepnumber"></span> <span class="dummy"></span><h3>\u062F\u0648\u0633\u062A \u062F\u0627\u0631\u06CC\u062F \u067E\u0631\u0648\u0698\u0647 \u0622\u0641\u0631\u06CC\u0646 \u0686\u06AF\u0648\u0646\u0647 \u0627\u0632 \u0634\u0645\u0627 \u062A\u0634\u06A9\u0631 \u06A9\u0646\u062F\u061F</h3><div class="rewards-container"><div class="reward-wrap col-sm-3 col-xs-6"><div class="no-reward" ng-click="selectReward(\'contribute-only\')" ng-class="{\'reward-selected\':contributeOnly}"><p>\u0641\u0642\u0637 \u0645\u06CC \u062E\u0648\u0627\u0647\u0645 \u062D\u0645\u0627\u06CC\u062A \u06A9\u0646\u0645</p><div class="row"><div class="form-group col-sm-10 amount" ng-show="contributeOnly"><label class="ng-binding">\u0645\u06CC\u0632\u0627\u0646 \u062D\u0645\u0627\u06CC\u062A</label> <input class="form-control" ng-model="giftFundAmount" placeholder="\u0645\u0628\u0644\u063A \u0628\u0631 \u062D\u0633\u0628 \u062A\u0648\u0645\u0627\u0646" num-int="11" num-fract="0" num-thousand="true" awnum=""></div></div></div></div><div class="reward-wrap col-sm-3 col-xs-6" ng-click="selectReward($index)" ng-repeat="campaignReward in campaignRewards"><div ng-class="{\'reward-selected\': campaignReward.id==selectedRewardId}" class="reward" reward="campaignReward" reward-template="" show-reward-image="false"></div></div></div></div><div class="row step"><span class="stepnumber"></span> <span class="dummy"></span><h3>\u0627\u06AF\u0631 \u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0641\u0642 \u0646\u0634\u062F\u061F!</h3><p class="condensed">\u062F\u0631 \u0635\u0648\u0631\u062A\u06CC \u06A9\u0647 \u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0641\u0642 \u0646\u0634\u062F \u0645\u0627 \u06A9\u0645\u06A9 \u0634\u0645\u0627 \u0631\u0627 \u0628\u0647 \u062D\u0633\u0627\u0628 \u0634\u0645\u0627 \u062F\u0631 \u0645\u06CC \u0634\u0648\u062F \u0628\u0627\u0632 \u0645\u06CC \u06AF\u0631\u062F\u0627\u0646\u06CC\u0645. \u0628\u0631\u0627\u06CC \u0627\u06CC\u0646 \u06A9\u0627\u0631 \u0644\u0627\u0632\u0645 \u0627\u0633\u062A <strong>\u0627\u06CC\u0645\u06CC\u0644</strong> \u0634\u0645\u0627 \u0631\u0627 \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u06CC\u0645</p><div class="row"><div class="form-group col-lg-3 col-md-4 col-sm-6"><label>{{\'_ui_key_Email\' | xlat}}</label><div class="right-inner-addon"><i class="fa fa-envelope" aria-hidden="true"></i> <input type="text" class="form-control" ng-model="email" placeholder="Email" value=""></div></div></div><div class="form-group"><p>\u062F\u0631 \u0635\u0648\u0631\u062A\u06CC \u06A9\u0647 \u062A\u0645\u0627\u06CC\u0644 \u0628\u0647 \u0628\u0627\u0632\u06AF\u0634\u062A \u067E\u0648\u0644 \u062E\u0648\u062F \u0646\u062F\u0627\u0631\u06CC\u062F \u0648 \u0646\u0645\u06CC \u062E\u0648\u0627\u0647\u06CC\u062F \u0627\u06CC\u0645\u06CC\u0644 \u062E\u0648\u062F \u0631\u0627 \u062F\u0631 \u0627\u062E\u062A\u06CC\u0627\u0631 \u0642\u0631\u0627\u0631 \u062F\u0647\u06CC\u062F \u0627\u06CC\u0645\u06CC\u0644 anon@mishavad.ir \u0631\u0627 \u062F\u0631 \u0627\u06CC\u0645\u06CC\u0644 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F. \u0634\u0645\u0627 \u0628\u0627 \u0648\u0627\u0631\u062F \u06A9\u0631\u062F\u0646 \u0627\u06CC\u0646 \u0627\u06CC\u0645\u06CC\u0644 \u0634\u0631\u0627\u06CC\u0637 \u0645\u0631\u0628\u0648\u0637 \u0628\u0647 <strong>\u06A9\u0645\u06A9 \u06A9\u0627\u0645\u0644\u0627 \u06AF\u0645\u0646\u0627\u0645</strong> \u0631\u0627 \u0645\u06CC \u067E\u0630\u06CC\u0631\u06CC\u062F</p></div></div><div class="row step"><span class="stepnumber"></span> <span class="dummy"></span><h3>\u062F\u0648\u0633\u062A \u062F\u0627\u0631\u06CC\u062F \u0646\u0627\u0645 \u0634\u0645\u0627 \u0628\u0647 \u0639\u0646\u0648\u0627\u0646 \u062D\u0627\u0645\u06CC \u062B\u0628\u062A \u0634\u0648\u062F\u061F</h3><div credit-buttons="" class="btn-group btn-group-justified hidden-xs"></div><div credit-buttons="" class="btn-group-vertical visible-xs"></div><div class="contributer-name" ng-class="{\'expanded\': creditType==\'realname\' || creditType==\'nickname\'}"><div class="row realname" ng-if="creditType==\'realname\'"><div class="col-sm-4 col-xs-6 form-group"><label>{{\'_ui_key_FirstName\' | xlat}}</label> <input type="text" class="form-control" ng-model="firstName"></div><div class="col-sm-4 col-xs-6 form-group"><label>{{\'_ui_key_LastName\' | xlat}}</label> <input type="text" class="form-control" ng-model="lastName"></div></div><div class="row nickname" ng-if="creditType==\'nickname\'"><div class="form-group col-sm-4"><label>{{\'_ui_key_NickName\' | xlat}}</label><div class="right-inner-addon"><i class="fa fa-asterisk" aria-hidden="true"></i> <input type="text" class="form-control" ng-model="nickName" placeholder="" value=""></div></div></div></div></div><div class="row step payment"><span class="stepnumber"></span> <span class="dummy"></span><h3>\u067E\u0631\u062F\u0627\u062E\u062A</h3><p>\u0634\u06CC\u0648\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F:</p><div payment-buttons="" class="btn-group btn-group-justified hidden-xs"></div><div payment-buttons="" class="btn-group-vertical visible-xs"></div><div class="col-sm-2 div-fade" ng-show="payMethod"><p class="visible-xs"></p><button class="pay-btn btn btn-submit" type="submit" ng-class="{\'waiting\': isWaiting}" ng-click="submitPay()">{{\'_ui_key_Payment\' | xlat}}</button></div></div></div></div>');
$templateCache.put('app/components/campaign/create/createCampaignView-OLD','<div class="create-camp-login well" ng-if="isLoggedIn==false"><p ng-bind-html="\'_ui_key_CreateCampaignRegisterNotice\' | xlat"></p><p>\u0647\u0645\u06CC\u0646 \u062D\u0627\u0644\u0627 \u062F\u0631 \u0633\u0627\u06CC\u062A <a ng-click="openRegister();">\u0639\u0636\u0648 \u0634\u0648\u06CC\u062F</a> \u0648 \u0627\u06AF\u0631 \u0642\u0628\u0644\u0627 \u0639\u0636\u0648 \u0634\u062F\u0647 \u0627\u06CC\u062F \u0628\u0647 \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062E\u0648\u062F <a ng-click="openLogin();">\u0648\u0627\u0631\u062F \u0634\u0648\u06CC\u062F</a></p></div><div ng-if="isLoggedIn" class="container" ng-controller="CreateCampaignController"><form ng-show="!success" class="create-campaign"><div class="row page-header"><h2>\u06A9\u0645\u067E\u06CC\u0646 \u062E\u0648\u062F \u0631\u0627 \u0634\u0631\u0648\u0639 \u06A9\u0646\u06CC\u062F</h2><p>\u062E\u0644\u0627\u0642\u06CC\u062A \u0648 \u06A9\u0627\u0631\u0622\u0641\u0631\u06CC\u0646\u06CC \u0631\u0627 \u0628\u0627 \u06CC\u06A9 \u06A9\u0645\u067E\u06CC\u0646 \u0634\u0631\u0648\u0639 \u06A9\u0646\u06CC\u062F.</p></div><div class="row"><div class="form-group col-sm-4"><label ng-bind="\'_ui_key_CampaignTitle\' | xlat"></label> <input class="form-control" ng-model="campaign.title"></div><div class="col-sm-4 hint"><p>\u0639\u0646\u0648\u0627\u0646 \u06A9\u0645\u067E\u06CC\u0646 \u0627\u0648\u0644\u06CC\u0646 \u0686\u06CC\u0632\u06CC \u0627\u0633\u062A \u06A9\u0647 \u0628\u0647 \u0686\u0634\u0645 \u0645\u06CC \u0622\u06CC\u062F. \u062F\u0631 \u0646\u06AF\u0627\u0647 \u0627\u0648\u0644 \u0646\u0638\u0631 \u0645\u062E\u0627\u0637\u0628\u0627\u0646 \u0631\u0627 \u062C\u0644\u0628 \u06A9\u0646\u06CC\u062F!</p></div></div><div class="row"><div class="form-group col-sm-4"><label ng-bind="\'_ui_key_TargetFund\' | xlat"></label> <input class="form-control" ng-model="campaign.targetFund" placeholder="\u0645\u0628\u0644\u063A \u0628\u0631 \u062D\u0633\u0628 \u062A\u0648\u0645\u0627\u0646" num-int="11" num-fract="0" num-thousand="true" awnum=""></div><div class="col-sm-4 hint"><p>\u0647\u0632\u06CC\u0646\u0647 \u0645\u0648\u0631\u062F \u0646\u06CC\u0627\u0632 \u06A9\u0645\u067E\u06CC\u0646 \u062E\u0648\u062F \u0631\u0627 \u0627\u06CC\u0646\u062C\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F. \u0646\u06AF\u0631\u0627\u0646 \u0646\u0628\u0627\u0634\u06CC\u062F \u0645\u06CC \u062A\u0648\u0627\u0646\u06CC\u062F \u0628\u0639\u062F\u0627 \u0627\u06CC\u0646 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0631\u0627 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0646\u06CC\u062F</p></div></div><div class="row"><div class="form-group col-sm-4"><label ng-bind="\'_ui_key_Tagline\' | xlat"></label> <textarea class="form-control" ng-model="campaign.tagline"></textarea></div><div class="col-sm-4 hint"><br><p>\u0627\u06CC\u0646 \u062C\u0645\u0644\u0647 \u062F\u0631 \u0635\u0641\u062D\u0647 \u0627\u0648\u0644 *\u0645\u06CC \u0634\u0648\u062F* \u0645\u06CC \u0622\u06CC\u062F. \u0686\u06CC\u0632\u06CC \u0631\u0627 \u062F\u0631\u062C \u06A9\u0646\u06CC\u062F \u06A9\u0647 \u0634\u0627\u06CC\u0633\u062A\u0647 \u0635\u0641\u062D\u0647 \u0627\u0648\u0644 \u0628\u0627\u0634\u062F</p></div></div><div class="row"><div class="form-group col-sm-4"><button class="btn btn-success btn-bez btn-bez-sm" ng-class="{\'waiting\': isWaiting}" ng-click="createCampaign()" ng-bind-html="\'_ui_key_CreateCampaign\' | xlat"></button></div></div></form><div class="row"><div class="col-sm-4"><div uib-alert="" class="alert" ng-class="\'alert-\'.concat((success)?\'success\':\'danger\')" ng-show="showAlert">{{alertMessage}}</div></div></div></div>');
$templateCache.put('app/components/campaign/details/CampaignDetails.tpl','<div id="camp-details" class="container" ng-show="campaign.id"><div class="row campaign-title"><h1>{{campaign.title}}</h1></div><div class="row campaign-loc-cat"><div class="col-sm-6"><div class="campaignHeaderBasics-location-name"><i class="fa fa-map-marker" aria-hidden="true"></i> {{campaign.city}}</div></div><div class="col-sm-6"><p class="campaignHeaderBasics-category-name">{{campaign.category}}</p></div></div><div class="row campaign-basics"><div class="col-sm-8"><img msh-show-loaded-img="" class="center-block img-responsive" ng-src="{{campaign.thumbnail}}" alt="Campaign Thumbnail Image"></div><div class="col-sm-4 campaign-stats"><div class="row collected-fund"><div class="progress-square" ng-style="getProgressStyle(campaign.collectedFundPercent)"><span class="text-center">{{campaign.collectedFundPercent}}%</span></div></div><div class="row"><div class="col-xs-6 collected-fund"><div><p ng-bind-html="\'_ui_key_PeopleBackedCampaign\'|xlat:({\'nBacked\':campaign.nBacked})"></p></div></div><div class="col-xs-6 text-center"><div ng-bind-html="\'_ui_key_CollectedFund2\'|xlat:({\'collectedFund\':(campaign.collectedFund | awnum:\'price\')})"></div></div></div><div class="row" style="padding:0px"><div class="text-center"><div class="target-fund" ng-bind-html="\'_ui_key_TargetFund2\'| xlat:({\'targetFund\':(campaign.targetFund | awnum:\'price\')})"></div></div></div></div></div><div class="row campaign-body"><div class="col-sm-8"><div campaign-tabs="" campaign="campaign" active="0" fixed-height="false" campaign-rewards="undefined" class="campaign-tabs"></div></div><div class="col-sm-4"><div class="row reward-wrap" ng-repeat="reward in campaignRewards"><div reward-template="" reward="reward" show-reward-image="true"></div></div></div></div></div>');
$templateCache.put('app/components/campaign/details/campaignTabsTemplate','<uib-tabset active="active"><uib-tab heading="{{\'tabs_item_description_fa\'|xlat}}"><div class="story" ng-class="{\'scroll-container\':fixedHeight}"><div ng-class="{\'scroll-content\':fixedHeight}"><div style="direction:rtl"><div ng-repeat="stElm in campaign.storyElements" ng-bind-html="stElm.text"></div></div><div style="height:3em"></div></div><div ng-if="fixedHeight && !Modernizr.touch" class="scroll-mask"></div></div></uib-tab><uib-tab heading="{{\'tabs_item_update_fa\'| xlat}}"><p>details2</p></uib-tab><uib-tab heading="{{\'tabs_item_backers_fa\'|xlat}}"><p>details3</p></uib-tab><uib-tab ng-if="campaignRewards"><uib-tab-heading><div ng-bind-html="\'_ui_key_RewardsTab\'|xlat"></div></uib-tab-heading><div class="rewards-container scroll-container"><div class="scroll-content"><div class="reward-wrap col-xs-6" ng-repeat="campaignReward in campaignRewards"><div class="reward" reward="campaignReward" reward-template="" hide-reward-image="true"></div></div><div style="height:3em"></div></div><div ng-if="!Modernizr.touch" class="scroll-mask"></div></div></uib-tab></uib-tabset>');
$templateCache.put('app/components/campaign/edit/docTableTemplate','<table class="table table-bordered table-hover"><thead><th>#</th><th>\u062A\u0648\u0636\u06CC\u062D\u0627\u062A</th></thead><tbody><tr ng-repeat="doc in docs"><th>{{$index+1}}</th><td>{{doc.description}}</td></tr></tbody></table>');
$templateCache.put('app/components/campaign/edit/editCampaignBasicTemplate','<form name="basicForm"><div id="new-camp-header" class="row" ng-if="newCampaign"><p ng-show="pageProps.campaignId">\u06A9\u0645\u067E\u06CC\u0646 \'{{campaignResInstance.title}}\' \u0627\u06CC\u062C\u0627\u062F \u0634\u062F. \u0634\u0645\u0627 \u0645\u06CC \u062A\u0648\u0627\u0646\u06CC\u062F \u0627\u0644\u0622\u0646 \u06CC\u0627 \u0628\u0639\u062F\u0627 \u0645\u0634\u062E\u0635\u0627\u062A \u0622\u0646 \u0631\u0627 \u06A9\u0627\u0645\u0644 \u06A9\u0646\u06CC\u062F.</p><h2>\u06A9\u0645\u067E\u06CC\u0646 \u062E\u0648\u062F \u0631\u0627 <span ng-hide="pageProps.campaignId">\u0634\u0631\u0648\u0639 \u06A9\u0646\u06CC\u062F</span> <span class="mishavad" ng-show="pageProps.campaignId">\u06A9\u0627\u0645\u0644 \u06A9\u0646\u06CC\u062F</span></h2><p ng-hide="pageProps.campaignId">\u062E\u0644\u0627\u0642\u06CC\u062A \u0648 \u06A9\u0627\u0631\u0622\u0641\u0631\u06CC\u0646\u06CC \u0631\u0627 \u0628\u0627 \u06CC\u06A9 \u06A9\u0645\u067E\u06CC\u0646 \u0634\u0631\u0648\u0639 \u06A9\u0646\u06CC\u062F.</p></div><div class="very-basic-details"><div class="row field-row"><div class="form-group col-md-6 col-sm-6"><label>\u0639\u0646\u0648\u0627\u0646 \u06A9\u0645\u067E\u06CC\u0646</label> <input type="text" class="form-control" ng-model="campaignResInstance.title"></div></div><div class="row field-row"><div class="form-group col-md-6 col-sm-6"><label>\u0645\u0628\u0644\u063A\u06CC \u06A9\u0647 \u0645\u06CC \u062E\u0648\u0627\u0647\u06CC\u062F \u062A\u0623\u0645\u06CC\u0646 \u0634\u0648\u062F</label> <input class="form-control" ng-model="campaignResInstance.targetFund" placeholder="\u0645\u0628\u0644\u063A \u0628\u0631 \u062D\u0633\u0628 \u062A\u0648\u0645\u0627\u0646" num-int="11" num-fract="0" num-thousand="true" awnum=""></div></div><div class="row field-row"><div class="form-group col-md-4 col-sm-5 col-xs-8" id="rowTagline" ng-class="{\'has-error shake\' : submitted && form.Tagline.$invalid}"><label>\u06CC\u06A9 \u062C\u0645\u0644\u0647 \u0632\u06CC\u0628\u0627 \u0628\u0631\u0627\u06CC \u06A9\u0645\u067E\u06CC\u0646 \u0634\u0645\u0627 \u062F\u0631 \u0635\u0641\u062D\u0647 \u0627\u0648\u0644 \u0645\u06CC \u0634\u0648\u062F</label> <textarea ng-required="" rows="4" id="Tagline" maxlength="100" required="" class="form-control" ng-model="campaignResInstance.tagline"></textarea></div><div class="col-md-4 col-sm-4 col-xs-4">\u062A\u0639\u062F\u0627\u062F \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0628\u0627\u0642\u06CC\u0645\u0627\u0646\u062F\u0647: {{100-campaignResInstance.tagline.length}}</div></div></div><div class="row btn-create-wrap" ng-show="newCampaign && !pageProps.campaignId"><div class="form-group col-sm-4"><button class="btn btn-success btn-bez btn-bez-sm" ng-class="{\'waiting\': campBasicWaiting}" ng-click="updateCampBasic()" ng-bind-html="\'_ui_key_CreateCampaign\' | xlat"></button></div></div><div class="basic-details" ng-if="pageProps.campaignId"><div class="row field-row"><div class="form-group image-editor-container col-sm-6" ng-class="{\'edit-mode\': campaignResInstance.thumbCropMode==true}"><label>\u062A\u0635\u0648\u06CC\u0631 \u06A9\u0645\u067E\u06CC\u0646 <span class="fa fa-question-circle fa-lg"></span></label><div img-crop="" class="img-crop" area-min-size="{width:285, height:200}" image="campaignResInstance.newThumbnail || campaignResInstance.thumbnail" result-image-format="image/jpeg" result-image-ratio="1" result-image-quality=".8" result-image="campaignResInstance.base64Thumbnail"></div><label class="btn btn-primary btn-image-input">\u062A\u063A\u06CC\u06CC\u0631 \u062A\u0635\u0648\u06CC\u0631 <input type="file" class="file-input" img-file-input="" file-input-loaded="fileInputLoaded(imageData)"></label></div></div><div class="row field-row"><div class="form-group col-md-6 col-sm-6"><label>\u0646\u0648\u0639 \u06A9\u0645\u067E\u06CC\u0646:</label><select class="form-control" ng-model="campaignResInstance.categoryId" convert-to-number=""><option ng-repeat="option in campaignType.availableOptions" value="{{option.id}}">{{option.name}}</option></select></div></div><div class="row field-row"><div class="form-group col-md-6 col-sm-6"><label>\u0645\u0631\u062D\u0644\u0647 \u06A9\u0645\u067E\u06CC\u0646:</label><select class="form-control" ng-model="campaignResInstance.projectStageId" convert-to-number=""><option ng-repeat="option in campaignLevel.availableOptions" value="{{option.id}}">{{option.name}}</option></select></div></div><div class="row field-row"><div class="form-group col-md-12 col-sm-12"><label>\u062A\u0627\u0645\u06CC\u0646 \u0628\u0648\u062F\u062C\u0647 \u06A9\u0645\u067E\u06CC\u0646 \u0686\u0646\u062F \u0631\u0648\u0632 \u0645\u0647\u0644\u062A \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F\u061F</label><div class="btn-group"><label class="btn btn-primary" ng-model="campaignResInstance.totalDays" uib-btn-radio="90">\u06F9\u06F0 \u0631\u0648\u0632</label> <label class="btn btn-primary" ng-model="campaignResInstance.totalDays" uib-btn-radio="60">\u06F6\u06F0 \u0631\u0648\u0632</label> <label class="btn btn-primary" ng-model="campaignResInstance.totalDays" uib-btn-radio="30">\u06F3\u06F0 \u0631\u0648\u0632</label></div></div></div><div class="row field-row"><div class="form-group col-md-6 col-sm-6"><label>\u062A\u06AF \u0647\u0627 <span class="fa fa-question-circle fa-lg"></span></label><input type="text" ng-change="populateTags()" ng-model="campaignResInstance._newTag" ng-keypress="$event.which === 13 && addNewTag()" class="form-control new-tag"> <a ng-click="addNewTag()">\u0627\u0636\u0627\u0641\u0647 \u06A9\u0631\u062F\u0646</a><div class="tags-container"><div class="camp-tag" ng-repeat="data in campaignResInstance.tags track by $index">{{data}}<span class="fa fa-times-circle" ng-click="removeTag($index)"></span></div></div></div></div><div class="row field-row"><div class="form-group col-md-6 col-sm-6"><div class="row"><div class="col-xs-12"><label>\u0622\u06CC\u0627 \u0627\u06CC\u0646 \u06A9\u0645\u067E\u06CC\u0646 \u062A\u0648\u0633\u0637 \u0633\u0627\u0632\u0645\u0627\u0646 \u062E\u0627\u0635\u06CC \u062A\u0623\u06CC\u06CC\u062F \u0634\u062F\u0647 \u0627\u0633\u062A\u061F</label><div class="btn-group"><label class="btn btn-success" ng-model="campaignResInstance.verifiedByOrg" uib-btn-radio="true">\u0628\u0644\u0647</label> <label class="btn btn-danger" ng-model="campaignResInstance.verifiedByOrg" uib-btn-radio="false">\u062E\u06CC\u0631</label></div></div><div class="col-xs-12"><label>\u062A\u0648\u0636\u06CC\u062D\u0627\u062A \u062F\u0631 \u0645\u0648\u0631\u062F \u062A\u0627\u06CC\u06CC\u062F\u0647 \u0633\u0627\u0632\u0645\u0627\u0646</label><div><textarea class="form-control" ng-model="campaignResInstance.verificationDescription"></textarea></div></div></div></div></div><div class="row field-row"><div class="form-group col-lg-3 col-md-4 col-sm-6"><label>\u0634\u0645\u0627 \u062F\u0631 \u06A9\u062F\u0627\u0645 \u0627\u0633\u062A\u0627\u0646 \u0645\u0633\u062A\u0642\u0631 \u0647\u0633\u062A\u06CC\u062F\u061F</label><div><select class="form-control" ng-model="campaignResInstance.province"><option ng-repeat="(option,value) in (campaignProvince.availableOptions | groupBy:\'provinceName\')" ng-selected="option==\'campaignResInstance.cityId\'" value="{{option}}">{{option}}{{alert(0)}}</option></select></div></div><div class="form-group col-lg-3 col-md-4 col-sm-6"><label>\u06A9\u062F\u0627\u0645 \u0634\u0647\u0631 \u0645\u0633\u062A\u0642\u0631 \u0647\u0633\u062A\u06CC\u062F\u061F</label><div><select class="form-control" ng-model="campaignResInstance.cityId" convert-to-number=""><option ng-repeat="option in campaignCity.availableOptions" ng-if="option != null" value="{{option.id}}">{{option.name}}</option></select></div></div></div><div class="form-group"><a class="btn btn-success btn-large btn-bez btn-bez-lg" ng-class="{\'waiting\': campBasicWaiting}" ng-click="updateCampBasic()">\u0630\u062E\u06CC\u0631\u0647 \u0648 \u0631\u0641\u062A\u0646 \u0628\u0647 \u062A\u0648\u0636\u06CC\u062D\u0627\u062A \u06A9\u0645\u067E\u06CC\u0646</a></div></div></form>');
$templateCache.put('app/components/campaign/edit/editCampaignRewardsTemplate','<div class="row"><div class="col-md-3 col-sm-4 reward-wrap" ng-repeat="reward in rewardQueryInstance"><a class="btn btn-primary btn-edit" ng-click="addOrEditReward($index)">\u0648\u06CC\u0631\u0627\u06CC\u0634</a> <a class="btn btn-primary btn-remove" ng-click="showRemoveBox=true">\u062D\u0630\u0641</a><div class="reward-inner" reward-template="" reward="reward" hide-n-claimed="true"></div><div class="remove-box" ng-show="showRemoveBox"><p>\u0622\u06CC\u0627 \u0628\u0631\u0627\u06CC \u062D\u0630\u0641 \u0645\u0637\u0645\u0626\u0646 \u0647\u0633\u062A\u06CC\u062F</p><a class="btn btn-danger" ng-click="removeReward($index)">\u0628\u0644\u06CC</a> <a class="btn btn-default" ng-click="showRemoveBox=false">\u062E\u06CC\u0631</a></div></div><div class="col-md-3 col-sm-4 reward-wrap"><a class="btn btn-primary" ng-click="addOrEditReward()">\u0627\u0636\u0627\u0641\u0647 \u06A9\u0631\u062F\u0646 \u067E\u0627\u062F\u0627\u0634</a></div></div>');
$templateCache.put('app/components/campaign/edit/editCampaignStoryTemplate','<div class="row"><div class="form-group col-md-6 col-sm-6"><label>\u0648\u06CC\u062F\u0626\u0648\u06CC \u06A9\u0645\u067E\u06CC\u0646</label><div class="msh-break-word">\u0628\u0631\u0627\u06CC \u062A\u0628\u062F\u06CC\u0644 \u0648\u06CC\u062F\u0626\u0648 \u0628\u0647 \u0641\u0631\u0645\u062A MP4 \u0648 \u06A9\u0648\u0686\u06A9 \u06A9\u0631\u062F\u0646 \u062D\u062C\u0645 \u0622\u0646 \u0645\u06CC \u062A\u0648\u0627\u0646\u06CC\u062F \u0627\u0632 \u0644\u06CC\u0646\u06A9 \u0632\u06CC\u0631 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u06A9\u0646\u06CC\u062F: <a href="http://www.freemake.com/free_video_converter/" target="_blank">http://www.freemake.com/free_video_converter/</a></div></div></div><div class="row"><div class="story-elements-wrap col-xs-10 col-xs-offset-1"><div id="elm{{$id}}" ng-repeat="stElm in campaignStoryElements" class="row story-element" ng-class="{\'edit-mode\': stElm.editMode,\'view-mode\':!stElm.editMode}"><div class="editor" ng-if="(stElm.type == \'text\')"><ng-wig ng-model="stElm.editorText" on-paste="onPaste($event, pasteContent)" buttons="formats, bold, italic, list1, list2, link"></ng-wig><div class="edit-buttons"><a class="btn btn-success" ng-click="saveTextElm($index)">\u0630\u062E\u06CC\u0631\u0647</a> <a class="btn btn-danger" ng-click="cancelTextEdit($index)">\u0627\u0646\u0635\u0631\u0627\u0641</a></div></div><div class="text-viewer-wrap" ng-if="(stElm.type == \'text\')"><div ng-bind-html="stElm.text" class="text-viewer"></div></div><div class="" ng-if="stElm.type == \'image\'"><div class="form-group image-editor-container" ng-class="{\'edit-mode\': stElm.editMode==true}"><div ng-if="stElm.editMode"><div img-crop="" class="img-crop" area-min-size="{width:285, height:200}" image="stElm.newImage || getImageByIndex($index)" result-image-format="image/jpeg" result-image-ratio="1" result-image-quality=".75" result-image="stElm.imageModel"></div><div ng-show="stElm.imageModel"><label class="btn btn-primary btn-image-input">\u0627\u0646\u062A\u062E\u0627\u0628 \u062A\u0635\u0648\u06CC\u0631 <input ng-disabled="stElm.saveWaiting" type="file" class="file-input" trigger-click="{{stElm.triggerClick}}" img-file-input="" file-input-loaded="fileInputLoaded($index,imageData)"></label> <button type="button" class="btn btn-success btn-bez btn-bez-xs" ng-class="{waiting:stElm.saveWaiting}" ng-click="saveImageEdit($index)">\u0630\u062E\u06CC\u0631\u0647</button> <a class="cancel btn btn-danger" ng-disabled="stElm.saveWaiting" ng-click="cancelImageEdit($index)">\u0627\u0646\u0635\u0631\u0627\u0641</a></div></div><img ng-src="{{getImageByIndex($index)}}" ng-show="!stElm.editMode" class="center-block img-responsive"></div></div><div class="initialized-story-controls" ng-show="stElm.type"><button type="button" class="btn btn-primary btn-edit" ng-show="stElm.editMode!=true" ng-click="enterEditMode($index)">{{\'_ui_key_Edit\' | xlat}} <i class="fa fa-edit" aria-hidden="true"></i></button> <button type="button" class="btn btn-primary btn-remove" ng-show="stElm.editMode!=true" ng-click="showRemoveBox=true">\u062D\u0630\u0641 <i class="fa fa-trash" aria-hidden="true"></i></button><div class="remove-box" ng-show="showRemoveBox"><p>\u0622\u06CC\u0627 \u0628\u0631\u0627\u06CC \u062D\u0630\u0641 \u0645\u0637\u0645\u0626\u0646 \u0647\u0633\u062A\u06CC\u062F</p><a class="btn btn-danger" ng-click="removeStoryElement($index)">\u0628\u0644\u06CC</a> <a class="btn btn-default" ng-click="showRemoveBox=false">\u062E\u06CC\u0631</a></div><div class="move-buttons"><a class="btn btn-default btn-move-up" ng-hide="isFirstInitializedSt($index)" ng-click="listElmUp($index, $id)"><i class="fa fa-arrow-up" aria-hidden="true"></i></a> <a class="btn btn-default btn-move-down" ng-hide="isLastInitializedSt($index)" ng-click="listElmDown($index, $id)"><i class="fa fa-arrow-down" aria-hidden="true"></i></a></div></div><div class="row empty-story-controls" ng-if="!stElm.type"><label class="btn col-sm-6" ng-click="initializeStElm($index,\'text\')"><i class="fa fa-plus" area-hidden="true"></i> \u0627\u0636\u0627\u0641\u0647 \u06A9\u0631\u062F\u0646 \u0645\u062A\u0646</label> <label class="btn col-sm-6"><i class="fa fa-plus" area-hidden="true"></i> \u0627\u0636\u0627\u0641\u0647 \u06A9\u0631\u062F\u0646 \u062A\u0635\u0648\u06CC\u0631 <input type="file" class="file-input" trigger-click="{{stElm.triggerClick}}" img-file-input="" file-input-loaded="initializeStElm($index,\'image\',imageData)"></label></div></div></div></div>');
$templateCache.put('app/components/campaign/edit/editCampaignUploadDocsTemplate','<div class="row"><div class="col-md-6"><h2>\u0645\u062F\u0627\u0631\u06A9 \u0647\u0648\u06CC\u062A\u06CC \u067E\u0631\u0648\u0698\u0647 \u0622\u0641\u0631\u06CC\u0646 (\u062A\u0635\u0648\u06CC\u0631)</h2><doc-table docs="userDocQueryInstance"></doc-table><form name="uploadUserDocForm" ng-submit="uploadDoc(\'userDoc\')"><div img-crop="" class="img-crop" image="newUserDocument._src" result-image-format="image/jpeg" result-image-ratio="1" result-image-quality=".8" result-image="newUserDocument.base64Image"></div><label class="btn btn-primary btn-image-input">\u0627\u0646\u062A\u062E\u0627\u0628 \u062A\u0635\u0648\u06CC\u0631 <input type="file" class="file-input" img-file-input="" file-input-loaded="newUserDocument._src = imageData"></label><div class="row"><div class="form-group" <label="">\u062A\u0648\u0636\u06CC\u062D\u0627\u062A \u0645\u062F\u0631\u06A9<div><textarea class="form-control" name="description" required="" ng-model="newUserDocument.description"></textarea></div></div></div><div uib-alert="" class="alert-warning" ng-messages="uploadUserDocForm.description.$error" role="alert"><div ng-message="required">\u0644\u0637\u0641\u0627 \u062A\u0648\u0636\u06CC\u062D\u0627\u062A \u0645\u0631\u0628\u0648\u0637 \u0628\u0647 \u0645\u062F\u0631\u06A9 \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F</div></div><button type="submit" class="btn btn-bez btn-bez-sm btn-primary" ng-class="{\'waiting\':newUserDocument._isWaiting}">\u0622\u067E\u0644\u0648\u062F</button></form></div></div><div class="row"><div class="col-md-6"><div class="row"><h2>\u0645\u062F\u0627\u0631\u06A9 \u06A9\u0645\u067E\u06CC\u0646 (\u062A\u0635\u0648\u06CC\u0631)</h2><doc-table docs="campaignDocQueryInstance"></doc-table><div img-crop="" class="img-crop" image="newCampaignDocument._src" result-image-format="image/jpeg" result-image-ratio="1" result-image-quality=".8" result-image="newCampaignDocument.base64Image"></div><label class="btn btn-primary btn-image-input">\u0627\u0646\u062A\u062E\u0627\u0628 \u062A\u0635\u0648\u06CC\u0631 <input type="file" class="file-input" img-file-input="" file-input-loaded="newCampaignDocument._src = imageData"></label></div><div class="row"><label>\u062A\u0648\u0636\u06CC\u062D\u0627\u062A \u0645\u062F\u0631\u06A9</label><div><textarea class="form-control" name="description" required="" ng-model="newCampaignDocument.description"></textarea></div></div><div class="row"><label class="btn btn-bez btn-bez-sm btn-primary" ng-class="{\'waiting\':newCampaignDocument._isWaiting}" ng-click="uploadDoc(\'campaignDoc\')">\u0622\u067E\u0644\u0648\u062F</label></div></div></div>');
$templateCache.put('app/components/campaign/edit/editCampaignView','<div id="edit-camp-page" class=""><div class="well" ng-if="isLoggedIn==false"><p ng-bind-html="\'_ui_key_EditCampaignLoginNotice\' | xlat"></p><p>\u0644\u0637\u0641\u0627 \u0628\u0631\u0627\u06CC <span ng-show="pageProps.campaignId">\u0648\u06CC\u0631\u0627\u06CC\u0634</span> <span ng-hide="pageProps.campaignId">\u0627\u06CC\u062C\u0627\u062F</span> \u06A9\u0645\u067E\u06CC\u0646 \u0628\u0647 \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062E\u0648\u062F <a ng-click="openLogin();">\u0648\u0627\u0631\u062F \u0634\u0648\u06CC\u062F</a></p></div><div ng-if="isLoggedIn"><div class="box-alert"><div uib-alert="" ng-repeat="alert in alerts" ng-class="\'alert-\' + alert.type" close="closeAlert($index)">{{alert.msg}} <a ng-if="alert.promiseFunc" class="btn btn-link" ng-click="tryAgain($index, alert.promiseFunc())">\u062F\u0648\u0628\u0627\u0631\u0647 \u0622\u067E\u062F\u06CC\u062A \u06A9\u0646</a></div></div><div class="corner-alert"><div uib-alert="" ng-if="v.isDirty && v.isDeselected" ng-repeat="(k,v) in dirtyForms" ng-class="\'alert-\' + v.type" close="closeCornerAlert(k)">{{v.msg}}</div></div><uib-tabset active="pageProps.activeTab" ng-class="{ \'has-alerts\': alerts.length, \'new-campaign\':newCampaign, \'has-camp-id\':pageProps.campaignId}"><uib-tab index="0" heading="{{ \'_ui_key_BasicTabHeading\' | xlat}}" select="tabSelected($event, \'basic\')" deselect="tabDeselected($event, \'basic\')"><div edit-campaign-basic="" class="camp-basic container-fluid"></div></uib-tab><uib-tab index="1" heading="{{ \'_ui_key_StoryTabHeading\' | xlat}}" select="tabSelected($event, \'story\')" deselect="tabDeselected($event, \'story\')"><div edit-campaign-story="" class="container-fluid"></div></uib-tab><uib-tab index="2" heading="{{ \'_ui_key_RewardsTabHeading\' | xlat}}"><div edit-campaign-rewards="" class="edit-camp-rewards container-fluid"></div></uib-tab><uib-tab index="3" heading="{{ \'_ui_key_DocumentsTabHeading\' | xlat}}"><div edit-campaign-upload-docs="" class="container-fluid"></div></uib-tab><uib-tab index="4" heading="{{ \'_ui_key_ReviewTabHeading\' | xlat}}" classes="edit-camp-review"><div edit-campaign-review="" class="container-fluid"></div></uib-tab></uib-tabset></div></div>');
$templateCache.put('app/components/campaign/reward/campaignRewardTemplate','<div ng-if="!hideRewardImage" class="row reward-img"><div class="col-md-12"><img class="img-responsive rewards" ng-src="{{reward.base64Image || reward.imagePath}}"></div></div><div class="h3 amount">{{reward.amount| seprate}} <label ng-bind="\'_ui_key_Toman\'|xlat"></label></div><h3 class="">{{reward.title}}</h3><p class="">{{reward.description}}</p><p class=""><label ng-bind="\'reward_accept_time_fa\'|xlat"></label> {{reward.estimatedDeliveryDateUtc | pDate}}</p><p class="" ng-if="!hideNClaimed"><span class="label label-info">{{reward.nClaimed}}</span> <label ng-bind="\'reward_accept_count_fa\'|xlat"></label></p><p class=""><label ng-bind="\'reward_Stock_fa\'|xlat"></label>{{reward.nAvailable}} <label ng-bind="\'reward_Stock_count_unit_fa\'|xlat"></label></p>');
$templateCache.put('app/components/campaign/reward/editRewardTemplate','<div class="modal-header"><h3 class="modal-title">\u0648\u06CC\u0631\u0627\u06CC\u0634 \u067E\u0627\u062F\u0627\u0634</h3><a class="fa fa-times fa-2x close" ng-click="dismissModal()"></a></div><div class="modal-body"><div class="edit-reward-wrapper container-fluid"><div class="row"><div class="col-md-6 form-group"><label>{{\'_ui_key_RewardName\' | xlat}}</label> <input type="text" class="form-control" ng-model="reward.title" placeholder="\u0646\u0627\u0645" value=""></div><div class="col-md-6 form-group"><label>{{\'_ui_key_GiftAmount\' | xlat}}</label> <input type="text" class="form-control" ng-model="reward.amount" placeholder="\u062A\u0648\u0645\u0627\u0646"></div></div><div class="row"><div class="form-group image-editor-container col-md-6" ng-class="{\'edit-mode\': imageEditMode==true}"><label>\u062A\u0635\u0648\u06CC\u0631 \u067E\u0627\u062F\u0627\u0634 <span class="fa fa-question-circle fa-lg"></span></label><div img-crop="" class="img-crop" area-min-size="{width:285, height:200}" image="reward.newImage || reward.imagePath" result-image-format="image/jpeg" result-image-ratio="1" result-image-quality=".8" result-image="reward.base64Image"></div><label class="btn btn-primary btn-image-input">\u062A\u063A\u06CC\u06CC\u0631 \u062A\u0635\u0648\u06CC\u0631 <input type="file" class="file-input" img-file-input="" file-input-loaded="fileInputLoaded(imageData)"></label> <button type="button" class="btn btn-primary btn-edit-img" ng-click="$broadcast(\'EnterCropEditModeEvent\', imageEditMode=true )">\u0648\u06CC\u0631\u0627\u06CC\u0634</button></div><div class="form-group col-md-6"><label>{{\'_ui_key_RewardDesc\' | xlat}}</label> <textarea ng-required="" rows="4" maxlength="100" required="" class="form-control" ng-model="reward.description"></textarea><div class="description-length">\u062A\u0639\u062F\u0627\u062F \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 {{100-reward.Description.length}}</div></div></div><div class="row"><div class="form-group"><label>{{\'_ui_key_RewardDeliveryDays\' | xlat}}</label> <input type="text" class="form-control" ng-model="reward.deliveryDays" placeholder="\u0631\u0648\u0632"></div></div><div class="row"><div class="form-group"><label>{{\'_ui_key_RewardNAvailable\' | xlat}}</label> <input type="text" class="form-control" ng-model="reward.nAvailable" placeholder="\u0639\u062F\u062F"></div></div></div><div uib-alert="" class="alert-danger" ng-bind="alertMessage | xlat" ng-show="showAlert"></div></div><div class="modal-footer"><button class="btn btn-default btn-bez btn-bez-md" type="submit" ng-class="{\'waiting\': isWaiting}" ng-click="submitReward()">{{\'_ui_key_Save\' | xlat}}</button></div>');
$templateCache.put('app/components/campaign/edit/directives/cropimgTemplate','<label class="btn btn-primary btn-image-input">\u0627\u0646\u062A\u062E\u0627\u0628 \u062A\u0635\u0648\u06CC\u0631 <input type="file" class="cropit-image-input" style="visibility: hidden;width:50px;height:0px"></label> <button type="button" class="save btn btn-success btn-bez btn-bez-xs" ng-class="{waiting:isWaiting}">\u0630\u062E\u06CC\u0631\u0647</button> <a class="cancel btn btn-danger" ng-click="cancel()">\u0627\u0646\u0635\u0631\u0627\u0641</a><div class="image-toolbar"><div class="image-zoom row text-right" style="direction: ltr; width: 300px;"><div class="col-xs-4" style="padding: 0; white-space: nowrap;"><label class="image-zoom-label" style="direction:rtl; display: block">\u0628\u0632\u0631\u06AF \u0646\u0645\u0627\u06CC\u06CC (Zoom):</label></div><div class="col-xs-8"><span class="fa fa-image" style="vertical-align: middle;"></span> <input type="range" value="0" class="cropit-image-zoom-input" style="vertical-align: middle;display: inline-block;width: 110px;margin: 3px;"> <span class="fa fa-image fa-2x" style="vertical-align: middle;"></span></div></div><div class="image-size"><label class="image-size-label" style="direction: rtl">\u0627\u0646\u062F\u0627\u0632\u0647 \u062A\u0635\u0648\u06CC\u0631:</label> <a class="btn btn-primary" ng-click="$broadcast(\'CropChangeSizeEvent\',{width:320,height:240})">\u06A9\u0648\u0686\u06A9</a> <a class="btn btn-primary" ng-click="$broadcast(\'CropChangeSizeEvent\',{width:460,height:308})">\u0645\u062A\u0648\u0633\u0637</a> <a class="btn btn-primary" ng-click="$broadcast(\'CropChangeSizeEvent\',{width:800,height:600})">\u0628\u0632\u0631\u06AF</a></div></div><div class="cropit-preview"></div>');}]);

angular.module('app')
  .config(['dynamicNumberStrategyProvider', function (dynamicNumberStrategyProvider) {
    dynamicNumberStrategyProvider.addStrategy('price', {
      numInt: 6,
      numFract: 4,
      numSep: '.',
      numPos: true,
      numNeg: false,
      numRound: 'round',
      numThousand: true,
      numThousandSep: ','
    });
  }])
  .config(['$animateProvider', function ($animateProvider) {
    $animateProvider.classNameFilter(/^(?:(?!ng-animate-disabled).)*$/);
  }])
  .factory('removeUnderscorePrefixedInterceptor', ['$q', function ($q) {
    return {
      request: function (config) {
        //console.log('config.data');
        //console.log(config.data);
        if (angular.isObject(config.data)) {
          angular.forEach(config.data, function (value, key) {
            if (key.indexOf('_') === 0) {
              delete config.data[key]
            }
          });
        };
        return config;
      }
    };
  }])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('removeUnderscorePrefixedInterceptor');
  }])
  .run(['$rootScope', '$anchorScroll', function ($rootScope, $anchorScroll) {
    $rootScope.$on("$locationChangeStart", function (event, newUrl, oldUrl, newState, oldState) {

      console.dir('location change start oldUrl:' + oldUrl + ',newUrl:' + newUrl);
      if (newUrl == oldUrl) {//only state changed
        return;
      }
      $anchorScroll();

    });
  }]);


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
                delay: ["$q", "$timeout", function ($q, $timeout) {
                    var delay = $q.defer();
                    $timeout(delay.resolve, 200);
                    return delay.promise;
                }]
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

angular.module('app').constant('constantsUtils',{
    "API_V1_URL": "http://mishavad.ir/api",
    "SERVER_URL": "http://mishavad.ir",
    softDeleteTransform:function(){return angular.toJson({removedFlag:true});}
});
/*
angular.module('app').constant('constantsUtils',{
    "API_V1_URL": "http://localhost:58000/api", 
    "SERVER_URL": "http://localhost:58000"   
});*/



angular.module('app')
.filter('xlat', ['XlatService', function (XlatService) {
    return function (label, parameters) {
        return XlatService.xlat(label, parameters);
    }
}]);

'use strict';
angular.module('app').constant('translateProvider', {
    "fa": {
        "tabs_item_description_fa": "توضیحات",
        "tabs_item_description_inner_target_fa": "هدف",
        "_ui_key_Person": "نفر",
        "tabs_item_update_fa": "به روز رسانی",
        "tabs_item_backers_fa": "حامیان کمپین",
        "_ui_key_GalleryTabHeading": "گالری تصاویر",
        "reward_accept_count_fa": "نفر این پاداش را دریافت کرده اند",
        "reward_accept_time_fa": "زمان تقریبی دریافت: ",
        "reward_accept_time_daily_count_fa": "روز ",
        "reward_Stock_fa": "موجودی : ",
        "reward_Stock_count_unit_fa": "عدد",
        "_ui_key_Browse": "فایل را انتخاب کنید",
        "_ui_key_BasicTabHeading":"مشخصات کمپین",
        "_ui_key_BavarKonidMishavad":" باور کنید می شود ;)",
        "_ui_key_BrowseCampaignBanner":"کمپین های می شود را ببینید",
        "_ui_key_CampaignCategory": "زمینه فعالیت",
        "_ui_key_CampaignTitle": "عنوان کمپین",
        "_ui_key_CompleteCreateCampaignMessage": "کمپین شما با عنوان {0} ایجاد شد. لطفا مشخصات آن را تکمیل کنید.",
        "_ui_key_CompleteCreateCampaignTitle": "تکمیل مشخصات کمپین",
        "_ui_key_ConfirmPassword": "تأیید رمز عبور",
        "_ui_key_ConnectionError": "خطا در اتصال به سرور. لطفا کمی بعدتر دوباره تلاش کنید",
        "_ui_key_CollectedFundOnly": "{{param_collectedFund}}" + '<span class="toman">{{"_ui_key_Toman"|xlat}}</span>',
        "_ui_key_CollectedFund2":"{{param_collectedFund}}" + '<span class="toman">{{"_ui_key_Toman"|xlat}}</span>'+'جمع شده',
        "_ui_key_Contribute": "می خواهم حمایت کنم",
        "_ui_key_ContributeStepsNote": "چند قدم تا رساندن پیام *می شود* به بانیان کمپین",
        "_ui_key_ContributeLong": "کمپین های فعال *می شود* را ببینید و به آن ها کمک کنید .",
        "_ui_key_CreateCampaign": " ایجاد کمپین <i class='fa fa-rocket fa-lg'></i>",
        "_ui_key_CreateCampaignBanner": " یک کمپین ایجاد کنید! <i class='fa fa-rocket fa-lg'></i>",
        "_ui_key_CreateCampaignRegisterNotice": "برای ایجاد کمپین باید در *می شود* عضو باشید.",
        "_ui_key_CreateCampaignLong": "یک کمپین ایجاد کنید و برای به ثمر رسیدن ایده تان از دیگران کمک بخواهید",
        "_ui_key_DocumentsTabHeading":"آپلود مدارک",
        "_ui_key_Edit":"ویرایش",
        "_ui_key_EditCampaign": "ویرایش مشخصات کمپین",
        "_ui_key_EditCampaignLoginNotice": "شما به این بخش دسترسی ندارید",
        "_ui_key_Email": "ایمیل",
        "_ui_key_EndDate": "تاریخ پایان کمپین",
        "_ui_key_FileAddress": "آدرس فایل",
        "_ui_key_FirstName": "نام",
        "_ui_key_GiftAmount": "میزان حمایت",
        "_ui_key_GiftFundDate": "تاریخ کمک",
        "_ui_key_Head": "*می شود*",
        "_ui_key_Hi": "سلام {0} !",
        "_ui_key_LastName": "نام خانوادگی",
        "_ui_key_LogIn": "ورود به حساب کاربری",
        "_ui_key_LogOff": "خروج از حساب کاربری",
        "_ui_key_LoginError": "نام کاربری یا رمز عبور اشتباه است!",
        "_ui_key_Mobile": "موبایل",
        "_ui_key_NickName": "نام مستعار",
        "_ui_key_NoUserCampaigns": "شما تا کنون کمپینی ایجاد نکرده اید.",
        "_ui_key_NoUserGiftFunds": "شما تا کنون به کمپینی کمک نکرده اید.",
        "_ui_key_Password": "رمز عبور",
        "_ui_key_Payment": "پرداخت",
        "_ui_key_PayMishavad": "پرداخت از طریق حساب *می شود*",
        "_ui_key_PayShetab": " پرداخت بانکی <span class='small'>(از طریق کارت های شتاب)</span>",
        "_ui_key_PeopleBackedCampaign": "{{param_nBacked}}" + '<span class="person">{{"_ui_key_Person"|xlat}}</span>' +  " حمایت کردند",
        "_ui_key_ProjectStage": "مرحله پروژه",
        "_ui_key_Register": "ثبت نام",
        "_ui_key_RegisterAsaNewUser": "اگر عضو نیستید می توانید همین حالا ثبت نام کنید!",
        "_ui_key_RegisterTitle": "به خانواده *می شود* بپیوندید",
        "_ui_key_Remember me?": "من را به خاطر داشته باش",
        "_ui_key_ReviewTabHeading":"مرور و درخواست بررسی",
        "_ui_key_RewardName":"نام پاداش",
        "_ui_key_RewardDesc":"توضیحات پاداش",
        "_ui_key_RewardDeliveryDays":"ارسال پاداش چند روز (از پایان کمپین) طول می کشد؟",
        "_ui_key_RewardNAvailable":"تعداد موجود پاداش",
        "_ui_key_RewardsTab": "<i class='fa fa-lg fa-gift'></i> پاداش ها",
        "_ui_key_RewardsTabHeading": "پاداش ها",
        "_ui_key_Save": "ذخیره",
        "_ui_key_StartDate": "تاریخ شروع",
        "_ui_key_StatusPreliminaryRegistered":"ثبت اولیه",
        "_ui_key_StatusApproved":"تأیید شده",
        "_ui_key_StatusReadOnly":"ReadOnly",
        "_ui_key_StatusWaiting":"در انتظار بررسی",
        "_ui_key_StoryTabHeading": "داستان کمپین شما",
        "_ui_key_Tagline": "یک جمله زیبا برای کمپین شما",
        "_ui_key_TargetFund": "هزینه مورد نیاز پروژه",
        "_ui_key_TargetFund2": 'هدف:'+'{{param_targetFund}}' + '<span class="toman">{{"_ui_key_Toman"|xlat}}</span>',
        "_ui_key_TargetFundRangeError1": "حداقل میزان کمک 10000 تومان است. ",
        "_ui_key_Thumbnail": "تصویر کمپین",
        "_ui_key_TimeLeft": '{{param_readableTimeLeft}}' + " باقیمانده",
        "_ui_key_Toman": "تومان",
        "_ui_key_Upload": "آپلود",
        "_ui_key_UploadCampaignThumbnail": "آپلود تصویر کمپین",
        "_ui_key_UserCampaigns": "کمپین های ایجاد شده",
        "_ui_key_UserGiftFunds": "کمک های انجام شده",
        "_ui_key_UserProfile": "حساب کاربری",
        "_ui_key_VerificationDescription": "توضیح",
        "_ui_key_VerifiedByOrg": "آیا طرح یا پروژه مورد نظر این کمپین دارای تأییدیه از سازمان یا مرکزی می باشد؟",
        "_ui_key_WelcomeMessage1": " می شود جایی است که شما به محقق شدن ایده های هم وطنانتان کمک می کنید و به آن ها می گویید " + "&rdquo;" + "*می شود*" + "&ldquo;",
        "_ui_key_MustContainAtLeastChars": "{0} باید حداقل شامل {2} کاراکتر باشد.",
        "PasswordValidation_InvalidChars": "کاراکترهای رمز عبور معتبر نیستند. آیا کیبورد فارسی است؟",
        "PasswordValidation_ShortLength": "رمز عبور باید حداقل {{param_0}} کاراکتر باشد",
        "PasswordValidation_NotMatch": "رمز عبور و تأیید آن با هم همخوانی ندارند.",
        "PasswordValidation_SmallCapitalLetters":"رمز عبور باید حداقل یک حرف  کوچک و یک حرف بزرگ داشته باشد",
        "PasswordValidation_NoNumbers":"رمز عبور باید حداقل یک عدد داشته باشد",
        "PasswordValidation_ConsecutivelyRepeatedChars":"رمز عبور نباید از کاراکترهای تکراری پشت سر هم تشکیل شده باشد",
        "PasswordValidation_ShamsiDate":"رمز عبور نباید تاریخ باشد"
        
    },
    "en": {}
});
angular.module('app').factory('XlatService', ['$interpolate', 'translateProvider', function ($interpolate, translateProvider) {
   var countryCode = countryCode || "IR";
   var currentLanguage = 'en';
   if ( countryCode=='IR'){
        currentLanguage='fa';
   }
    return {
        setCurrentLanguage: function () {
            currentLanguage = newCurrentLanguage;
        },
        getCurrentLanguage: function () {
            return currentLanguage;
        },
        xlat: function (label, parameters) {
            /*NOTE: parameters could be supplied xlat:(object) syntax or as comma seperated values 
            in the label*/
            if (~label.indexOf(',')){
                label = label.split(',')
                parameters = label.slice(1);
                label=label[0];
            }
            var transText = translateProvider[currentLanguage][label];
              if (transText == undefined){
                transText = label;
              }else{
                transText = transText.replace(new RegExp('\\*می شود\\*', 'g'), '<span class="mishavad">می&zwnj;شود</span>');
              }
            //  console.log(parameters);
            if (parameters == null || parameters.length ==0) {
                return transText;
            }
            else {
                angular.forEach(parameters, function(value, key) {  
                    parameters['param_'+key] = '<span class="param-'+key+'">'+ value+'</span>';
                    
                });
                return $interpolate(transText)(parameters);
            }
        }

    }
}]);

angular.module('app')
    .controller('AccountController', ['$scope', 'userinfoFactory', 'campaignResource', function ($scope, userinfoFactory, campaignResource) {

        $scope.getUserData = function(){
            if ($scope.isLoggedIn) {
                var Userinfo = userinfoFactory($scope.access_token);
                $scope.userinfo = Userinfo.get();
                
                $scope.userCampaigns = campaignResource($scope.access_token).query_user_campaigns(function(){
                   // console.log($scope.userCampaigns);
                   for (var i=0;i<$scope.userCampaigns.length;i++){
                       var c = $scope.userCampaigns[i];
                       c.isApproved = ~c.status.indexOf('Approved');
                       c.status = c.status.replace(/\s/g,'').split(',');
                   }
                });
                
            }
        };
        $scope.getUserData();
        $scope.$watch('isLoggedIn', function () {
            $scope.getUserData();
        });
        $scope.removeCampaign = function(ind){
            $scope.userCampaigns[ind].$soft_delete(function(){
               $scope.userCampaigns.splice(ind,1); 
            },
            function(){

            })
        };


    }])
    .factory('userinfoFactory', ['$resource','constantsUtils', function ($resource,constantsUtils) {

        return function (access_token) {
            var Res = $resource(constantsUtils.API_V1_URL + '/Account/UserInfo', { Id: "@Id" },
                {
                    'get': {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + access_token
                        }
                    }
                });
            return Res;
        };

    }]);

angular.module('app')
    .service('loginService', ['$http', 'constantsUtils', function ($http, constantsUtils) {
        this.getToken = function (user, pass, successCallbackFunc, errorCallbackFunc) {
            $http({
                method: 'POST',
                url: constantsUtils.SERVER_URL + '/Token',
                data: 'grant_type=password&username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass)
                ,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).then(function successCallback(response) {
                successCallbackFunc(response)
                // this callback will be called asynchronously
                // when the response is available
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                errorCallbackFunc(response)
            });
        };
    }])
    .controller('LoginController', ['$scope', '$timeout', 'loginService', '$uibModalInstance','$location', function ($scope, $timeout, loginService, $uibModalInstance,$location) {

        $scope.submitLogin = function () {
            //console.log($scope.loginEmail);
            //console.log($scope.loginPassword);
            $scope.isWaiting = true;
            $scope.showAlert = false;
            $timeout(function () {
                loginService.getToken($scope.loginEmail, $scope.loginPassword,
                    function (tokenData) {
                        $uibModalInstance.close(tokenData);
                    },
                    function (data) {
                        $scope.isWaiting = false;
                        $scope.showAlert = true;
                        if (data.status == 400) {
                            $scope.alertMessage = '_ui_key_LoginError';
                        } else {
                            $scope.alertMessage = '_ui_key_ConnectionError';
                        }
                    }
                );
            }, 500);
        };

        $scope.$on('$locationChangeStart', function (event) {
            if ($location.state()!='login'){
                $uibModalInstance.dismiss();
            }
        });
    }]);

angular.module('app').controller('RegisterController', ['$scope', '$timeout', '$http', '$location', '$uibModalInstance', 'constantsUtils', 'redirectUrl', function ($scope, $timeout, $http, $location, $uibModalInstance, constantsUtils, redirectUrl) {

    $scope.alerts = [];

    $scope.submitRegister = function () {
        //console.log($scope.loginEmail);
        //console.log($scope.loginPassword);
        if ($scope.registerModel == undefined) {
            $scope.showAlert = true;
            $scope.alertMessage = 'لطفا اطلاعات بالا را وارد کنید';
            return;
        }
        $scope.isWaiting = true;
        $scope.alerts = [];
        $scope.registerModel.redirectUrl = redirectUrl;
        console.log($scope.registerModel);
        $timeout(function () {
            $http({
                method: 'POST',
                url: (constantsUtils.API_V1_URL + '/Account/Register'),
                headers: { 'Content-Type': 'application/json' },
                data: $scope.registerModel
            })
                .then(
                function (tokenData) {

                    $scope.isWaiting = false;
                    $scope.alerts.push({
                        type: 'success'
                        , msg: 'ثبت نام شما انجام شد. به زودی ایمیلی حاوی لینک تأیید ایمیل برای شما فرستاده خواهد شد. ایمیل خود را چک کنید.'
                    });
                    // $uibModalInstance.close();
                },
                function (data) {
                    $scope.isWaiting = false;
                    var ms = data.data.modelState;
                    console.log(ms);
                    if (ms) {
                        angular.forEach(ms, function (errors, key) {
                            angular.forEach(errors, function (errorMessage) {
                                $scope.alerts.push({
                                    type: 'danger'
                                    , msg: errorMessage
                                });
                            })
                        });

                    } else {
                        var message = data.data.message;
                        if (message) {
						    errors = message.split('|');
                            angular.forEach(errors, function (errorMessage) {
                                $scope.alerts.push({
                                    type: 'danger'
                                    , msg: errorMessage
                                });
                            })
                        }
                    }
                    console.log(data);
                    // $scope.alertMessage = 
                    //TODO: Add specific errors
                }
                );
        }, 500);
    };

    $scope.$on('$locationChangeStart', function (event) {
        if ($location.state() != 'register') {
            $uibModalInstance.dismiss();
        }
    });
}]);
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
angular.module('app')
    .directive('cbpGridGallery', [function () {
        'use strict';
        return {
            scope: {
                campaigns: '=',
                'triggerCloseEvent': '&onClose',
                'triggerOpenEvent': '&onOpen',
            },
            link: function (scope, element, attrs) {

                var docElem = window.document.documentElement,
                    transEndEventNames = {
                        'WebkitTransition': 'webkitTransitionEnd',
                        'MozTransition': 'transitionend',
                        'OTransition': 'oTransitionEnd',
                        'msTransition': 'MSTransitionEnd',
                        'transition': 'transitionend'
                    },
                    transEndEventName = transEndEventNames[Modernizr.prefixed('transition')],
                    support = {
                        transitions: Modernizr.csstransitions,
                        support3d: Modernizr.csstransforms3d
                    };

                scope.setTransform = function (el, transformStr) {
                    el.style.WebkitTransform = transformStr;
                    el.style.msTransform = transformStr;
                    el.style.transform = transformStr;
                };

                scope.getViewportW = function () {
                    var client = docElem['clientWidth'],
                        inner = window['innerWidth'];

                    if (client < inner)
                        return inner;
                    else
                        return client;
                };

                scope.slideShow = { currentIndex: -99 };

                scope.setSlidesTransform = function () {
                    var i = scope.slideShow.currentIndex;
                    if (scope.campaigns == undefined || i < 0) {
                        return;
                    }

                    var slideWidth = document.getElementById("slide_" + i).offsetWidth;

                    for (var j = 0; j < scope.campaigns.length; j++) {

                        scope.setTransform(document.getElementById("slide_" + i), "");
                        var translateLeftVal = Number(-1 * (scope.getViewportW() / 2 + slideWidth / 2));
                        var translateRightVal = Number(scope.getViewportW() / 2 + slideWidth / 2);
                        if (i == j) {
                            scope.campaigns[j].transform = "";//support.support3d ? 'translate3d(0px, 0, 0px)' : 'translate(0px)';
                        }
                        else if (j == i - 1) {
                            scope.setTransform(document.getElementById("slide_" + j), support.support3d ? 'translate3d(' + translateLeftVal + 'px, 0, -150px)' : 'translate(' + translateLeftVal + 'px)');
                        } else if (j == i + 1) {
                            scope.setTransform(document.getElementById("slide_" + j), support.support3d ? 'translate3d(' + translateRightVal + 'px, 0, -150px)' : 'translate(' + translateRightVal + 'px)');
                        } else if (j < i) {
                            scope.setTransform(document.getElementById("slide_" + j), support.support3d ? 'translate3d(' + 2 * translateLeftVal + 'px, 0, -150px)' : 'translate(' + 2 * translateLeftVal + 'px)');
                        } else if (j > i) {
                            scope.setTransform(document.getElementById("slide_" + j), support.support3d ? 'translate3d(' + 2 * translateRightVal + 'px, 0, -150px)' : 'translate(' + 2 * translateRightVal + 'px)');
                        };
                    }

                };
                scope.$watch('slideShow.currentIndex', function (i) {
                    scope.setSlidesTransform();
                });


                //Watch text length (changes in campaigns)
                scope.$watch(function () {
                    var whole_p_length = 0;
                    var ps = element.find('p');
                    for (var i = 0; i < ps.length; i++) {
                        if (ps[i].innerHTML == undefined) {
                            continue
                        }
                        whole_p_length += ps[i].innerHTML.length;
                    }
                    // NOTE: The above method is faster than: whole_p_length = element[0].innerHTML.length;
                    //console.log(whole_p_length);
                    return whole_p_length;
                }, function (value) {
                    scope.setSlidesTransform();

                    scope.grid = document.querySelector('section.grid-wrap > ul.grid');//Supports IE8+ (with document)

                    if (scope.masonry != undefined) {
                        if (scope.grid.children.length != scope.masonry.oldNumberOfChildren) {
                            console.log('new items added to masonry');
                            for (var i = scope.masonry.oldNumberOfChildren; i < scope.grid.children.length; i++) {
                                scope.masonry.appended(scope.grid.children[i]);
                            }
                        }
                        scope.masonry.layout();
                    } else {
                        scope.masonry = new Masonry(scope.grid, {
                            itemSelector: 'li',
                            columnWidth: '.grid-sizer'
                        });
                    }

                    scope.masonry.oldNumberOfChildren = scope.grid.children.length
                    //    console.log(element.find('section.grid-wrap > ul.grid'));
                    //    console.log(scope.grid.children.length);





                });


            },
            templateUrl: 'app/components/home/gridGalleryView',
            controller: ['$scope', 'rewardResource', '$timeout', '$location', function ($scope, rewardResource, $timeout, $location) {
                $scope.openSlideShow = function (index) {
                    $scope.triggerOpenEvent();
                    $scope.slideShow.open = true;
                    if (index != undefined) {
                        $scope.setCurrentIndex(index);
                    }
                }
                $scope.setCurrentIndex = function (i) {

                    $scope.slideShow.currentIndex = i;
                    $scope.slideShow.activeTabIndex = 0;
                    $scope.currentCampaignRewards = [];
                    $scope.currentCampaign = $scope.campaigns[i];
                    if ($scope.getRewardsInstance != undefined) {
                        $scope.getRewardsInstance.$cancelRequest();
                    }
                    //wait till animation is done for a better user experience
                    $timeout(function () {
                        $scope.getRewardsInstance = rewardResource().query({ campaignId: $scope.currentCampaign.id }, function (data) {
                            $scope.currentCampaignRewards = data;
                        }, function () {
                            console.log('failed loading rewards in slideshow')
                        });
                    }, 1500);
                };

                $scope.nextSlide = function () {
                    if ($scope.slideShow.currentIndex < $scope.campaigns.length - 1) {
                        $scope.setCurrentIndex($scope.slideShow.currentIndex + 1);
                    };
                };
                $scope.prevSlide = function () {
                    if ($scope.slideShow.currentIndex > 0) {
                        $scope.setCurrentIndex($scope.slideShow.currentIndex - 1);
                    };
                };
                $scope.closeSlideShow = function () {
                    $scope.triggerCloseEvent();
                    $scope.slideShow.open = false;
                };

                /*NOTE: Listening to the event here has two functions: one to close slideshow whenever
                location change to another page and another to handle Back and Forward appropriately
                in the browser, especially the mobile phone*/
                $scope.$on("$locationChangeStart", function (event, newUrl, oldUrl, newState, oldState) {
                    
                    if (newUrl == oldUrl)  //Only state change
                    {
                        console.dir('newState:' + newState);
                        if (newState == 'noslide') {
                            $scope.closeSlideShow();
                        }
                        if (newState == 'slide') {
                            $scope.openSlideShow();
                        }
                    } else { //Url change (link) 
                        $scope.closeSlideShow();
                    }
                });

                $scope.getHourglass = function (camp) {
                    if (camp.totalSecondsLeft == 0) {
                        return 'fa-hourglass-end';
                    }
                    var ratio = camp.totalSecondsLeft / 86400 / camp.totalDays;
                    switch (true) {
                        case (ratio < .2):
                            return 'fa-hourglass-start';
                        case (ratio >= .2):
                            return 'fa-hourglass-half';
                    }
                };
            }]
        };

    }])
    .directive('homeCarousel', [function () {
        'use strict';
        return {
            scope: {
                interval: '='
            },
            templateUrl: 'app/components/home/carouselView',
            controller: ['$scope', function ($scope) {
                $scope.slides = [
                    {
                        id: 0,
                        image: '/FrontEnd/assets/img/ezatabad-jungle2.jpg',
                        textColor: 'white',
                        backColor: 'rgba(0,150,100,.5)',
                        html: '_ui_key_WelcomeMessage1'
                    },
                    {
                        id: 1,
                        image: '/FrontEnd/assets/img/paper-boats2.jpg',
                        textColor: 'white',
                        backColor: 'rgba(243,150,33,.5)',
                        html: 'ایده هایتان را از کاغذ به عمل تبدیل کنید!'
                    },
                    {
                        id: 2,
                        image: '/FrontEnd/assets/img/bafgh-shen-ravan.jpg',
                        textColor: 'white',
                        backColor: 'rgba(33,150,243,.5)',
                        html: 'می شود تنها یک پلت فرم کراودفاندینگ نیست. هدف می شود تزریق روحیه امید در مبتکرین ایرانی است'
                    }
                ];

            }]
        };
    }]);
angular.module("uidataModule", ["ngResource"])
    .factory('uidataResource', ['$resource', 'constantsUtils',
        function ($resource, constantsUtils) {
            return $resource(constantsUtils.API_V1_URL + '/UiData/:pageName',
                { pageName: '@pageName' });
        }]);
angular.module('app.contribute', ['ngResource', 'campaignResourceModule']);

angular.module('app').factory('campaignFactory', ['$resource', function ($resource) {
    return function (access_token) {
        return $resource(GLOBAL_serverUri + '/api/Campaigns', null, {
            'save': {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + access_token,
                    'Content-type': 'application/json'
                }
            }
        });
    }
}])
.controller('CreateCampaignController', ['$scope', '$timeout', 'campaignFactory', function ($scope, $timeout, campaignFactory) {

    $scope.createCampaign = function () {
        
        if ($scope.campaign == undefined) {
            console.log($scope.campaign);
            $scope.showAlert = true;
            $scope.alertMessage = 'لطفا اطلاعات بالا را وارد کنید';
            return;
        }
        $scope.isWaiting = true;
        var CampaignResource = campaignFactory($scope.access_token);    
        var newcampaign = new CampaignResource.save($scope.campaign);
        newcampaign.$promise.then(
            function (response) {
                console.log('response:');
                console.log(response);
                $scope.showAlert = true;
                $scope.success = true;
                $scope.isWaiting = false;
                $scope.alertMessage = 'کمپین شما ایجاد شد. جزئیات آن را در صفحه بعدی ویرایش کنید';
                //success
            },
            function (response) {
                console.log(response);
                $scope.isWaiting = false;
                $scope.showAlert = true;
                $scope.alertMessage = 'مشکلی هنگام ایجاد کمپین به وجود آمده';
               
            }
        );


    };
}]); 
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
angular.module('editCampaignModule', ['campaignResourceModule', 'uidataModule', 'ngWig', 'ngSanitize', 'ngImgCrop'])
angular.module('campaignResourceModule', ['ngResource'])
    .factory('campaignResource', ['$resource', 'constantsUtils', function ($resource, constantsUtils) {
        return function (token) {
            var actions;
            var headers = {
                'Authorization': 'Bearer ' + token
            };
            if (token != undefined) {
                actions = {
                    get: {
                        method: 'GET'
                        , headers: headers
                    },
                    save: {
                        method: 'POST'
                        , headers: headers
                    },
                    query_user_campaigns: {
                        method: 'GET'
                        , headers: headers
                        , params: { user_campaigns: true }
                        , isArray: true
                    },
                    soft_delete: {
                        method: 'POST'
                        , headers: headers
                        , params: { soft_delete: true }
                        , transformRequest: constantsUtils.softDeleteTransform
                    }

                };
            }
            return $resource(constantsUtils.API_V1_URL + '/campaigns/:id', { id: '@id' }, actions);
        };
    }])
    .factory('rewardResource', ['$resource', 'constantsUtils', function ($resource, constantsUtils) {
        return function (campaignId, token) {
            return $resource(constantsUtils.API_V1_URL + '/campaigns/:campaignId/rewards/:rewardId', { campaignId: campaignId, rewardId: '@id' }, {
                save: {
                    method: 'POST'
                    , headers: {
                        'Authorization': 'Bearer ' + token
                    }
                },
                soft_delete: {
                    method: 'POST'
                    , headers: {
                        'Authorization': 'Bearer ' + token
                    }
                    , params: { soft_delete: true }
                    , transformRequest: constantsUtils.softDeleteTransform
                }
            }, { cancellable: true }
            );
        }
    }])
    .factory('campaignImageResource', ['$resource', 'constantsUtils', function ($resource, constantsUtils) {
    return function (campaignId, token) {
        return $resource(constantsUtils.API_V1_URL + '/campaigns/:campaignId/images/:imageId', { 'campaignId': campaignId, 'imageId': '@imageId' }, {
            save: {
                method: 'POST'
                , headers: {
                    'Authorization': 'Bearer ' + token
                }
            },
            update: {
                method: 'POST'
                , headers: {
                    'Authorization': 'Bearer ' + token
                }
            }
        }
        );
    }
}])
.factory('campaignDocumentResource', ['$resource','constantsUtils', function($resource, constantsUtils){
    return function(campaignId, token){
         return $resource(constantsUtils.API_V1_URL + '/documents/campaign/:campaignId/:id', { 'campaignId': campaignId, 'id': '@id' }, {
            save: {
                method: 'POST'
                , headers: {
                    'Authorization': 'Bearer ' + token
                }
            },
            update: {
                method: 'POST'
                , headers: {
                    'Authorization': 'Bearer ' + token
                }
            },
            query: {
                method: 'GET'
                , headers: {
                    'Authorization': 'Bearer ' + token
                },isArray:true
            }
        }
        );
    }
}])
.factory('userDocumentResource', ['$resource','constantsUtils', function($resource, constantsUtils){
    return function(userId, token){
         return $resource(constantsUtils.API_V1_URL + '/documents/user/:userId/:id', { 'userId': userId, 'id': '@id' }, {
            save: {
                method: 'POST'
                , headers: {
                    'Authorization': 'Bearer ' + token
                }
            },
            update: {
                method: 'POST'
                , headers: {
                    'Authorization': 'Bearer ' + token
                }
            },
            query: {
                method: 'GET'
                , headers: {
                    'Authorization': 'Bearer ' + token
                },isArray:true
            },
        }
        );
    }
}]);
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
angular.module('app.contribute')
    .directive('paymentButtons', function () {
        return {
            template: '<label class="btn btn-default" ng-model="payMethod" uib-btn-radio="\'shetab\'"' +
            ' ng-bind-html="\'_ui_key_PayShetab\' | xlat"></label>' +
            '<label class="btn btn-default" ng-click="openLogin();" ng-model="payMethod" uib-btn-radio="\'mishavad\'"' +
            'ng-bind-html="\'_ui_key_PayMishavad\' | xlat"></label>'
        }
    })
    .directive('creditButtons', function () {
        return {
            template: '<label class="btn btn-success" ng-model="creditType" uib-btn-radio="\'َanonymous\'" uncheckable>' +
            'دوست دارم' +
            '<strong>' +
            'بدون نام' +
            '</strong>(Anonymous)' +
            'کمک کنم</label>' +
            '<label class="btn btn-success" ng-model="creditType" uib-btn-radio="\'realname\'" uncheckable>' +
            '<strong>' +
            ' نام واقعی ام' +
            '</strong>' +
            'نمایش داده شود</label>' +
            '<label class="btn btn-success" ng-model="creditType" uib-btn-radio="\'nickname\'" uncheckable>' +
            '<strong>' +
            'نام مستعارم' +
            '</strong>' +
            'نمایش داده شود</label>'
        }
    });

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
        
angular.module('app.contribute')
.service('paymentService', ['$http', function ($http){


}]);
/*
TODOs:
Canvas have problem with changing tab. So we should redraw it when going back to campaign details tab
 */
angular.module('editCampaignModule').controller('CampaignBasicController', ['$scope', '$timeout',
    '$anchorScroll',
    function ($scope, $timeout, $anchorScroll) {

        

        $scope.$watch('campaignResInstance.province', function (newVal, oldVal) {
            $scope.changeOptionProvince();
        });
        $scope.$watch('campaignProvince', function (newVal, oldVal) {
            $scope.changeOptionProvince();
        });

        $scope.changeOptionProvince = function () {
            if ($scope.campaignCity == undefined) {
                return;
            }
            $scope.campaignCity.availableOptions = [];
            if ($scope.campaignResInstance == undefined) {
                return;
            }
            angular.forEach($scope.campaignProvince.availableOptions, function (value
            ) {
                if (value.provinceName == $scope.campaignResInstance.province) {
                    this.push(value);
                }

            }, $scope.campaignCity.availableOptions);
            var cityBelongsToList = false;
            //make cityId undefined if it does not belong to availableOptions
            if ($scope.campaignCity == undefined) { return; }
            angular.forEach($scope.campaignCity.availableOptions, function (value) {
                if (value.id == $scope.campaignResInstance.cityId) {
                    cityBelongsToList = true;
                    return;
                }
            });
            if (!cityBelongsToList) {
                $scope.campaignResInstance.cityId = undefined;
            };
        };

        $scope.dropboxitemselected = function (value) {
            $scope.itemselected = value;
        }

        
        $scope.addNewTag = function () {
            var tag = $scope.campaignResInstance._newTag;
            $scope.tagSubmitted = true;
            var p = 0;
            if (tag.trim() != "") {
                for (var i = 0; i < $scope.campaignResInstance.tags.length; i++) {
                    if ($scope.campaignResInstance.tags[i] == tag) p = 1;
                }
                if (p == 0) $scope.campaignResInstance.tags.push(tag);
            }
            $scope.campaignResInstance._newTag = "";
        }

        $scope.populateTags=function(){
            var tag = $scope.campaignResInstance._newTag;
            if (tag.trim() != ""){
                
            }
        }
        //end add tag

        $scope.removeTag = function (id) {
            $scope.campaignResInstance.tags.splice(id, 1);
        }

        $scope.enterCropThumb = function () {
            $scope.campaignResInstance.thumbCropMode = true;
            $scope.campaignResInstance.cropDataURI = $scope.campaignResInstance.thumbnail;
        };

        $scope.fileInputLoaded = function (imageData) {
            $scope.campaignResInstance.thumbnail = imageData;
        };


        $scope.updateCampBasic = function () {
            if ($scope.tagSubmitted) return;
            $scope.campBasicWaiting = true;
            //TODO: this is much more complicated that just tagline (B)
            if ($scope.campaignResInstance.tagline != "") {
                var isUpdate = $scope.campaignResInstance.id != undefined;
                $scope.campaignResInstance.$save(function (data) {
                    if (isUpdate) {
                        $scope.basicForm.$setPristine();
                        $scope.setStoryTab();
                    } else {
                        $scope.pageProps.campaignId = $scope.campaignResInstance.id;
                        //scroll to top so that the user notices change of the header to 'Complete Campaign'
                        $anchorScroll();
                    }
                    $scope.campBasicWaiting = false;
                }, function (data) {
                    $scope.campBasicWaiting = false;
                    if (isUpdate) {
                        var message = 'آپدیت موفقیت آمیز نبود. لطفا دوباره سعی کنید';
                    } else {
                        /*TODO: add other errors info if needed such as required props
                        You might not have to add this info if you inform the client by form validation
                        */
                        console.log(data);
                        var message = 'خطا در ایجاد کمپین';
                    }
                    $scope.alerts.push({
                        type: 'danger'
                        , msg: message
                    });
                });
            }
            else //add class shake
                $scope.submitted = true;

            //remove class shake
            $timeout(function () {
                $scope.submitted = false;
            }, 1000);
        };

        $scope.$watch('basicForm.$dirty', function () {
            $scope.dirtyForms.basic.isDirty = $scope.basicForm.$dirty && $scope.campaignResInstance.id != undefined
        });

    }]);



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

angular.module('editCampaignModule').controller('CampaignStoryController', ['$scope', '$timeout', 'campaignResource', 'campaignImageResource', '$sanitize', '$anchorScroll',
    function ($scope, $timeout, campaignResource, campaignImageResource, $sanitize, $anchorScroll) {

        $scope.loadImagesMap = function () {
            var imagesMap = {};
            angular.forEach($scope.campaignImages, function (img) {
                this[img.id.toString()] = img;
            }, imagesMap);
            $scope.imagesMap = imagesMap;
        };

        $scope.$watch('campaignId', function () {
            if (!$scope.pageProps.campaignId) { return; }
            $scope.CampaignImage = campaignImageResource($scope.pageProps.campaignId, $scope.access_token);
            $scope.loadCampaignImages();
        });

        $scope.loadCampaignImages = function () {
            $scope.campaignImages = $scope.CampaignImage.query(function () {
                $scope.loadImagesMap();
            });
        }

        $scope.getImageByIndex = function (ind) {
            console.dir('getImageByIndex:'+ind);
            if (!$scope.campaignStoryElements) return;
            var stElm = $scope.campaignStoryElements[ind];
            if (!stElm) return;
            var imgId = stElm.campaignImageId;
            if (!imgId) return;
            if (!$scope.imagesMap) return;
            var img = $scope.imagesMap[imgId];
            if (!img) return;
             console.dir('getImageByIndex:'+ind+'filePath:'+img.filePath);
           
            return img.filePath;
        }

        $scope.leaveEditMode = function (ind) {
            $scope.campaignStoryElements[ind].editMode = false;
        };

        $scope.enterEditMode = function (ind) {
            $scope.campaignStoryElements[ind].editMode = true;
        };

        $scope.initializeStElm = function (ind, elmType, imageData) {
            if (elmType == 'text') {
                $scope.campaignStoryElements[ind] = { editorText: '', text: '', type: 'text', editMode: true };
            }
            if (elmType == 'image') {
                $scope.campaignStoryElements[ind] = { type: 'image', editMode: true, newImage:imageData };
            }
        };

        $scope.saveImageEdit = function (ind) {
            var stElm = $scope.campaignStoryElements[ind];
            stElm.saveWaiting = true;
            var imageId = stElm.campaignImageId;
            var campaignImage = $scope.CampaignImage
                .save({
                    imageId: imageId,
                    base64Image: stElm.imageModel,
                    appendedToStory: (imageId == undefined) //new image
                }, function () {
                    stElm.saveWaiting = false;
                    $scope.loadCampaignImages();
                    $scope.leaveEditMode(ind);
                    if (imageId == undefined) { //new image
                        console.log('Image Uploaded Successfully');
                        $scope.campaignStoryElements[ind].campaignImageId = campaignImage.id;
                        $scope.addAdjacentEmptyElms(ind);
                        $scope.updateStoryElements();
                    } else {
                        console.log('Image Updated Successfully');
                    }
                }, function () {
                    //TODO add failure notice here
                    stElm.saveWaiting = false;
                });
        }

        $scope.saveTextElm = function (ind) {
            var editorText = $sanitize($scope.campaignStoryElements[ind].editorText);
            console.log(editorText);
            var textWithoutWhiteSpaces = editorText
                .replace(/<\/p>/g, '')
                .replace(/<p>/g, '')
                .replace(/<br>/g, '')
                .replace(/&nbsp;/g, '');
            if (textWithoutWhiteSpaces == '') {//only white spaces
                $scope.alerts.push({
                    type: 'danger'
                    , msg: 'در ویرایشگر چیزی نوشته نشده است!'
                });
            } else {
                //Check whether it's a new story element,(Null-coalescing)
                var isNewElement = ($scope.campaignStoryElements[ind].text || '') == '';
                $scope.campaignStoryElements[ind].text = editorText;
                $scope.campaignStoryElements[ind].editMode = false;
                $scope.updateStoryElements();
                if (isNewElement) {
                    $scope.addAdjacentEmptyElms(ind);
                }
            }
        };
        $scope.emptyStoryElement = function (ind) {
            $scope.campaignStoryElements[ind] = {};
        }
        $scope.removeStoryElement = function (ind) {
            //we need to remove adjacent empty story element too;
            $scope.campaignStoryElements.splice(ind, 2);
            $scope.updateStoryElements();
        }
        $scope.cancelTextEdit = function (ind) {
            if (($scope.campaignStoryElements[ind].text || '') == '') { //Null-coalescing
                $scope.emptyStoryElement(ind);
            } else {
                $scope.leaveEditMode(ind);
                $scope.campaignStoryElements[ind].editorText = $scope.campaignStoryElements[ind].text;
            }
        };

        $scope.cancelImageEdit = function (ind) {
            if ($scope.campaignStoryElements[ind].campaignImageId == undefined) {
                $scope.emptyStoryElement(ind);
            } else {
                $scope.campaignStoryElements[ind].newImage = undefined;
                $scope.leaveEditMode(ind);
            }
        };
        $scope.addAdjacentEmptyElms = function (ind) {
            $scope.campaignStoryElements.splice(ind + 1, 0, {});
            $scope.campaignStoryElements.splice(ind, 0, {});
        }
        /*from http://stackoverflow.com/questions/27709040/how-do-i-move-objects-inside-an-ng-repeat-on-button-click */
        // Move list Elms up or down or swap

        $scope.moveElm = function (origin, destination, elmId) {
            var temp = $scope.campaignStoryElements[destination];
            $scope.campaignStoryElements[destination] = $scope.campaignStoryElements[origin];
            $scope.campaignStoryElements[origin] = temp;
            if (origin > destination) {//i.e., move up
                $timeout(function () { //to run after next digest
                    console.log("scroll to elm" + elmId);
                    $anchorScroll.yOffset = 120;
                    $anchorScroll("elm" + elmId);
                }, 0);
            }
            $scope.updateStoryElements();
        };

        /*NOTE because of presence of empty story elements between initialized story elements
        we should move them two positions not one! */
        // Move list Elm Up
        $scope.listElmUp = function (elmIndex, elmId) {
            $scope.moveElm(elmIndex, elmIndex - 2, elmId);

        };

        // Move list Elm Down
        $scope.listElmDown = function (elmIndex, elmId) {
            $scope.moveElm(elmIndex, elmIndex + 2, elmId);
        };

        $scope.fileInputLoaded = function (ind, imageData) {
           $scope.campaignStoryElements[ind].newImage = imageData;
        };

        $scope.updateStoryElements = function () {
            var elms = $scope.campaignStoryElements;
            var strArray = [];
            for (var i = 0; i < elms.length; i++) {
                if (!elms[i].type) continue;
                if (elms[i].type == 'image') {
                    if (elms[i].campaignImageId) {
                        strArray.push(['[campaignImageId:', elms[i].campaignImageId, ']'].join(''));
                    }
                } else {
                    strArray.push(elms[i].text)
                }
            }
            /*NOTE: we just update campaignResInstance and do $save. Very neat. CampaignBasic should also be updated like this in future*/
            /*TODO: This updates campaignBasics too. There should be a prompt when someone changes tab that says changes in the model will be discarded. Then we should reload the model by query and move to the tab*/
            $scope.campaignResInstance.story = JSON.stringify(strArray);

            $scope.waitingAlertInd = $scope.alerts.push({
                type: 'waiting',
                msg: 'در حال آپدیت'
            }) - 1;

            $scope.campaignResInstance.$save().then(function () {
                $scope.closeAlert($scope.waitingAlertInd);
            }, function () {
                $scope.closeAlert($scope.waitingAlertInd);
                var newAlert = {
                    type: 'danger'
                    , msg: 'آپدیت موفقیت آمیز نبود. لطفا دوباره سعی کنید'
                    , promiseFunc: function () { return $scope.campaignResInstance.$save(); }
                };
                $scope.alerts.push(newAlert);
            }
            );
        }

        $scope.onPaste = function (e, pasteContent) {
            //TODO fix this
            //TODO remove style attr
            //TODO remove dir attrs
            //TODO remove lang attrs
            //TODO Convert MsoListParagraphCxSpFirst classes and similar to ol or ul tags

            return pasteContent;
        };

        $scope.isFirstInitializedSt = function (ind) {
            //we ignore the first empty story element
            return ind == 1;
        }

        $scope.isLastInitializedSt = function (ind) {
            //we ignore the last empty story element
            return ind == ($scope.campaignStoryElements.length - 2);
        }

    }]);
angular.module('editCampaignModule').controller('CampaignUploadDocsController', ['$scope', 'campaignDocumentResource', 'userDocumentResource', function ($scope, campaignDocumentResource, userDocumentResource) {
    $scope.$watch('pageProps.uidataLoaded && isLoggedIn && pageProps.campaignId', function (newValue, oldValue) {
        console.log(newValue);
        if (!newValue) { return; }

        $scope.CampaignDocRes = campaignDocumentResource($scope.pageProps.campaignId, $scope.access_token);
        //Load docs
        $scope.campaignDocQueryInstance = $scope.CampaignDocRes.query(
            function () { },
            function () {
                $scope.alerts.push({
                    type: 'danger'
                    , msg: 'اتصال برای بارگذاری مدارک کمپین برقرار نشد لطفا دوباره تلاش کنید.'
                });
            }
        );

        $scope.UserDocRes = userDocumentResource('ThisUser', $scope.access_token);
        //Load docs
        $scope.userDocQueryInstance = $scope.UserDocRes.query(
            function () { },
            function () {
                $scope.alerts.push({
                    type: 'danger'
                    , msg: 'اتصال برای بارگذاری مدارک هویتی برقرار نشد لطفا دوباره تلاش کنید.'
                });
            }
        );
    });

    $scope.uploadDoc = function (docType) {
        var queryInstance;
        var Res;
        var newObj;
        if (docType == 'campaignDoc') {
            queryInstance = $scope.campaignDocQueryInstance;
            Res = $scope.CampaignDocRes;
            newObj = $scope.newCampaignDocument;
        } else if (docType == 'userDoc') {
            queryInstance = $scope.userDocQueryInstance;
            Res = $scope.UserDocRes;
            newObj = $scope.newUserDocument;
        }
        if (queryInstance) {
            var ind = queryInstance.push(
                new Res(newObj)
            ) - 1;
            newObj._isWaiting=true;
            queryInstance[ind].$save(function () {
                newObj.description='';
                newObj._src=undefined;
                newObj._isWaiting=false;
            }, function () {
                console.log("Error uploading doc");
                queryInstance.splice(ind,1);
                newObj._isWaiting=false;
            });
        }
    }
}]);
angular.module('editCampaignModule')
    .controller('EditCampaignController', ['$scope', '$routeParams', '$location', '$anchorScroll', '$timeout',
        'campaignResource', 'uidataResource',
        function ($scope, $routeParams, $location, $anchorScroll, $timeout,
            campaignResource, uidataResource) {
            
            //alerts
            $scope.alerts = [];
            $scope.cornerAlerts = {};

            $scope.dirtyForms = {basic:{
                                    type: 'danger'
                                    , msg: 'تغییرات مشخصات کمپین ذخیره نشده اند!'
                                    , isDirty : false
                                    , isDeselected : false
                                },
                                story:{
                                    type: 'danger'
                                    , msg: ''
                                    , isDirty : false
                                    , isDeselected : false
                                }
                            };

            $scope.closeAlert = function (i) {
                $scope.alerts.splice(i, 1);
            };
            $scope.closeCornerAlert = function (key) {
                $scope.cornerAlerts[key]=undefined;
            };

            $scope.tryAgain = function (index, promise) {
                if (promise) {
                    promise.then(function () {
                        $scope.closeAlert(index);
                    });
                }
            };
            $scope.waitingAlertInd = $scope.alerts.push({
                type: 'waiting',
                msg: 'لطفا چند لحظه صبر :)'
            }) - 1;

            //To allow for prototypical inheritance (problem by ng-if or tabset scopes)
            $scope.pageProps = {
                activeTab: 0,
                campaignId: $routeParams.campaignId
            };

            //get uidata for EditCampaign page and then Campaign data
            uidataResource.get({ pageName: 'EditCampaign' }, function (data) {

                $scope.uidata = data;
                $scope.campaignCity = {
                    availableOptions: []
                };
                $scope.campaignProvince = {
                    selectProvince: null
                    , availableOptions: $scope.uidata.cities
                };
                $scope.campaignType = {
                    availableOptions: $scope.uidata.campaignCategories
                };
                $scope.campaignLevel = {
                    availableOptions: $scope.uidata.projectStages
                };
                console.log($scope.campaignResInstance);
                $scope.pageProps.uidataLoaded = true;

            }, function (data) { });

            //Scroll to top on tab change
            $scope.$watch('pageProps.activeTab', function () {
                $anchorScroll();
            });

            $scope.$watch('pageProps.uidataLoaded && isLoggedIn', function () {
                if (!$scope.pageProps.uidataLoaded || !$scope.isLoggedIn) { return; }
                $scope.campaignStoryElements = [{}];

                $scope.CampaignRes = campaignResource($scope.access_token);
                if ($scope.pageProps.campaignId == undefined) {
                    $scope.newCampaign = true;
                    $scope.campaignResInstance = new $scope.CampaignRes();
                    $scope.closeAlert($scope.waitingAlertInd);
                } else {
                    $scope.campaignResInstance = $scope.CampaignRes.get(
                        { id: $scope.pageProps.campaignId },
                        function (data) {
                            //remove city to avoid confusion
                            $scope.campaignResInstance.city = undefined;
                            
                            $scope.extractStoryElements(data);                        

                            //may be useful to undo changes!
                            $scope.oldCampaign = angular.copy($scope.campaignResInstance);
                            $scope.closeAlert($scope.waitingAlertInd);
                        },
                        function (data) {
                            $scope.closeAlert($scope.waitingAlertInd);
                            $scope.alerts.push({
                                type: 'danger'
                                , msg: 'اتصال برقرار نشد لطفا دوباره تلاش کنید.'
                            });
                    });
                }
            });

           

            $scope.extractStoryElements = function(data){
                                //     console.log(data.storyElements);
                                        for (var i = 0; i < data.storyElements.length; i++) {
                                            var stElm = data.storyElements[i].trim();
                                            var newElm = undefined;
                                            if (/^\[campaignImageId:.*]$/.test(stElm)) {
                                                newElm = {
                                                    type: 'image',
                                                    editMode: false,
                                                    campaignImageId: stElm.replace(/\D+/g, '')
                                                };
                                            } else {
                                                newElm = { type: 'text', editMode: false, text: stElm, editorText: stElm };
                                            }
                                            if (newElm) {
                                                $scope.campaignStoryElements.push(newElm);
                                                //Add empty story element adjacent to this element to provide ease for editing
                                                $scope.campaignStoryElements.push({});
                                            }
                                        }

                                        //remove unnecessary data to reduce $save payload
                                        data.storyElements = undefined;
            }

            $scope.setStoryTab = function () {
                $scope.pageProps.activeTab = 1;
            };

            
           

             $scope.tabDeselected = function ($event, tabName) {
               $scope.dirtyForms[tabName].isDeselected=true;
            }

            $scope.tabSelected = function ($event, tabName) {
                $scope.dirtyForms[tabName].isDeselected=false;
            }

             

        }]);
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

///-------------------------groupby-----------------------------///
angular.module('editCampaignModule')
    .filter('groupBy', ['$parse', 'pmkr.filterStabilize', function ($parse, filterStabilize) {
        function groupBy(input, prop) {
            if (!input) {
                return;
            }
            var grouped = {};
            input.forEach(function (item) {
                var key = $parse(prop)(item);
                grouped[key] = grouped[key] || [];
                grouped[key].push(item);
            });
            return grouped;
        }
        return filterStabilize(groupBy);
    }])
    .factory('pmkr.filterStabilize', [
        'pmkr.memoize'

        , function (memoize) {
            function service(fn) {
                function filter() {
                    var args = [].slice.call(arguments);
                    // always pass a copy of the args so that the original input can't be modified
                    args = angular.copy(args);
                    // return the `fn` return value or input reference (makes `fn` return optional)
                    var filtered = fn.apply(this, args) || args[0];
                    return filtered;
                }
                var memoized = memoize(filter);
                return memoized;
            }
            return service;
        }
    ])
    .factory('pmkr.memoize', [
        function () {
            function service() {
                return memoizeFactory.apply(this, arguments);
            }

            function memoizeFactory(fn) {
                var cache = {};

                function memoized() {
                    var args = [].slice.call(arguments);
                    var key = JSON.stringify(args);
                    if (cache.hasOwnProperty(key)) {
                        return cache[key];
                    }
                    cache[key] = fn.apply(this, arguments);
                    return cache[key];
                }
                return memoized;
            }
            return service;
        }
    ]);
/*!
 * ngImgCrop v0.3.2
 * https://github.com/alexk111/ngImgCrop
 *
 * Copyright (c) 2014 Alex Kaul
 * License: MIT
 *
 * Generated at Wednesday, December 3rd, 2014, 3:54:12 PM
 */
(function () {
    'use strict';

    var crop = angular.module('ngImgCrop', []);


    crop.factory('cropAreaSquare', ['cropArea', function (CropArea) {
        var CropAreaSquare = function () {
            CropArea.apply(this, arguments);

            this._resizeCtrlBaseRadius = 10;
            this._resizeCtrlNormalRatio = 0.75;
            this._resizeCtrlHoverRatio = 1;
            this._iconMoveNormalRatio = 0.9;
            this._iconMoveHoverRatio = 1.2;

            this._resizeCtrlNormalRadius = this._resizeCtrlBaseRadius * this._resizeCtrlNormalRatio;
            this._resizeCtrlHoverRadius = this._resizeCtrlBaseRadius * this._resizeCtrlHoverRatio;

            this._posDragStartX = 0;
            this._posDragStartY = 0;
            this._posResizeStartX = 0;
            this._posResizeStartY = 0;
            this._posResizeStartSize = { width: 0, height: 0 };

            this._resizeCtrlIsHover = -1;
            this._areaIsHover = false;
            this._resizeCtrlIsDragging = -1;
            this._areaIsDragging = false;
        };

        CropAreaSquare.prototype = new CropArea();

        CropAreaSquare.prototype._calcSquareCorners = function () {
            var hSize = this._size.height / 2;
            var wSize = this._size.width / 2;
            return [
                [this._x - wSize, this._y - hSize],
                [this._x + wSize, this._y - hSize],
                [this._x - wSize, this._y + hSize],
                [this._x + wSize, this._y + hSize]
            ];
        };

        CropAreaSquare.prototype._calcSquareDimensions = function () {
            var wSize = this._size.width / 2;
            var hSize = this._size.height / 2;
            return {
                left: this._x - wSize,
                top: this._y - hSize,
                right: this._x + wSize,
                bottom: this._y + hSize
            };
        };

        CropAreaSquare.prototype._isCoordWithinArea = function (coord) {
            var squareDimensions = this._calcSquareDimensions();
            return (coord[0] >= squareDimensions.left && coord[0] <= squareDimensions.right && coord[1] >= squareDimensions.top && coord[1] <= squareDimensions.bottom);
        };

        CropAreaSquare.prototype._isCoordWithinResizeCtrl = function (coord) {
            var resizeIconsCenterCoords = this._calcSquareCorners();
            var res = -1;
            for (var i = 0, len = resizeIconsCenterCoords.length; i < len; i++) {
                var resizeIconCenterCoords = resizeIconsCenterCoords[i];
                if (coord[0] > resizeIconCenterCoords[0] - this._resizeCtrlHoverRadius && coord[0] < resizeIconCenterCoords[0] + this._resizeCtrlHoverRadius &&
                    coord[1] > resizeIconCenterCoords[1] - this._resizeCtrlHoverRadius && coord[1] < resizeIconCenterCoords[1] + this._resizeCtrlHoverRadius) {
                    res = i;
                    break;
                }
            }
            return res;
        };

        CropAreaSquare.prototype._drawArea = function (ctx, centerCoords, size) {
            var hSize = size.height / 2;
            var wSize = size.width / 2;
            ctx.rect(centerCoords[0] - wSize, centerCoords[1] - hSize, size.width, size.height);
        };

        CropAreaSquare.prototype.draw = function () {
            CropArea.prototype.draw.apply(this, arguments);

            // draw move icon
            this._cropCanvas.drawIconMove([this._x, this._y], this._areaIsHover ? this._iconMoveHoverRatio : this._iconMoveNormalRatio);

            // draw resize cubes
            var resizeIconsCenterCoords = this._calcSquareCorners();
            for (var i = 0, len = resizeIconsCenterCoords.length; i < len; i++) {
                var resizeIconCenterCoords = resizeIconsCenterCoords[i];
                this._cropCanvas.drawIconResizeCircle(resizeIconCenterCoords, this._resizeCtrlBaseRadius, this._resizeCtrlIsHover === i ? this._resizeCtrlHoverRatio : this._resizeCtrlNormalRatio);
            }
        };

        CropAreaSquare.prototype.processMouseMove = function (mouseCurX, mouseCurY) {
            var cursor = 'default';
            var res = false;

            this._resizeCtrlIsHover = -1;
            this._areaIsHover = false;

            if (this._areaIsDragging) {
                this._x = mouseCurX - this._posDragStartX;
                this._y = mouseCurY - this._posDragStartY;
                this._areaIsHover = true;
                cursor = 'move';
                res = true;
                this._events.trigger('area-move');
            } else if (this._resizeCtrlIsDragging > -1) {
                var xMulti, yMulti;
                switch (this._resizeCtrlIsDragging) {
                    case 0: // Top Left
                        xMulti = -1;
                        yMulti = -1;
                        cursor = 'nwse-resize';
                        break;
                    case 1: // Top Right
                        xMulti = 1;
                        yMulti = -1;
                        cursor = 'nesw-resize';
                        break;
                    case 2: // Bottom Left
                        xMulti = -1;
                        yMulti = 1;
                        cursor = 'nesw-resize';
                        break;
                    case 3: // Bottom Right
                        xMulti = 1;
                        yMulti = 1;
                        cursor = 'nwse-resize';
                        break;
                }
                var iFX = (mouseCurX - this._posResizeStartX) * xMulti;
                var iFY = (mouseCurY - this._posResizeStartY) * yMulti;
                var newSize = {
                    width: this._posResizeStartSize.width + iFX,
                    height: this._posResizeStartSize.height + iFY
                };
                var wasSize = this._size;
                this.setSize(newSize);
                var posModifierX = (this._size.width - wasSize.width) / 2 * xMulti;
                var posModifierY = (this._size.height - wasSize.height) / 2 * yMulti;
                this._x += posModifierX;
                this._y += posModifierY;
                this._resizeCtrlIsHover = this._resizeCtrlIsDragging;
                res = true;
                this._events.trigger('area-resize');
            } else {
                var hoveredResizeBox = this._isCoordWithinResizeCtrl([mouseCurX, mouseCurY]);
                if (hoveredResizeBox > -1) {
                    switch (hoveredResizeBox) {
                        case 0:
                            cursor = 'nwse-resize';
                            break;
                        case 1:
                            cursor = 'nesw-resize';
                            break;
                        case 2:
                            cursor = 'nesw-resize';
                            break;
                        case 3:
                            cursor = 'nwse-resize';
                            break;
                    }
                    this._areaIsHover = false;
                    this._resizeCtrlIsHover = hoveredResizeBox;
                    res = true;
                } else if (this._isCoordWithinArea([mouseCurX, mouseCurY])) {
                    cursor = 'move';
                    this._areaIsHover = true;
                    res = true;
                }
            }

            this._dontDragOutside();
            angular.element(this._ctx.canvas).css({ 'cursor': cursor });

            return res;
        };

        CropAreaSquare.prototype.processMouseDown = function (mouseDownX, mouseDownY) {
            var isWithinResizeCtrl = this._isCoordWithinResizeCtrl([mouseDownX, mouseDownY]);
            if (isWithinResizeCtrl > -1) {
                this._areaIsDragging = false;
                this._areaIsHover = false;
                this._resizeCtrlIsDragging = isWithinResizeCtrl;
                this._resizeCtrlIsHover = isWithinResizeCtrl;
                this._posResizeStartX = mouseDownX;
                this._posResizeStartY = mouseDownY;
                this._posResizeStartSize = this._size;
                this._events.trigger('area-resize-start');
            } else if (this._isCoordWithinArea([mouseDownX, mouseDownY])) {
                this._areaIsDragging = true;
                this._areaIsHover = true;
                this._resizeCtrlIsDragging = -1;
                this._resizeCtrlIsHover = -1;
                this._posDragStartX = mouseDownX - this._x;
                this._posDragStartY = mouseDownY - this._y;
                this._events.trigger('area-move-start');
            }
        };

        CropAreaSquare.prototype.processMouseUp = function (/*mouseUpX, mouseUpY*/) {
            if (this._areaIsDragging) {
                this._areaIsDragging = false;
                this._events.trigger('area-move-end');
            }
            if (this._resizeCtrlIsDragging > -1) {
                this._resizeCtrlIsDragging = -1;
                this._events.trigger('area-resize-end');
            }
            this._areaIsHover = false;
            this._resizeCtrlIsHover = -1;

            this._posDragStartX = 0;
            this._posDragStartY = 0;
        };

        return CropAreaSquare;
    }]);

    crop.factory('cropArea', ['cropCanvas', function (CropCanvas) {
        var CropArea = function (ctx, events) {
            this._ctx = ctx;
            this._events = events;

            this._minSize = { width: 80, height: 40 };

            this._cropCanvas = new CropCanvas(ctx);

            this._image = new Image();
           // console.dir('x and y to zero');
            this._x = 0;
            this._y = 0;
            this._size = { width: 0, height: 0 };
        };

        /* GETTERS/SETTERS */

        CropArea.prototype.getImage = function () {
            return this._image;
        };
        CropArea.prototype.setImage = function (image) {
            this._image = image;
        };

        CropArea.prototype.getX = function () {
            return this._x;
        };
        CropArea.prototype.setX = function (x) {
            this._x = x;
            this._dontDragOutside();
        };

        CropArea.prototype.getY = function () {
            return this._y;
        };
        CropArea.prototype.setY = function (y) {
            this._y = y;
            this._dontDragOutside();
        };

        CropArea.prototype.getSize = function () {
            return this._size;
        };
        CropArea.prototype.setSize = function (size) {
            this._size = {
                width: Math.max(this._minSize.width, size.width),
                height: Math.max(this._minSize.height, size.height)
            };
            this._dontDragOutside();
        };

        CropArea.prototype.getMinSize = function () {
            return this._minSize;
        };
        CropArea.prototype.setMinSize = function (size) {
            this._minSize = size;
            this.setSize(this._size); //ensure compatibilty
        };


        /* FUNCTIONS */
        CropArea.prototype._dontDragOutside = function () {
            var h = this._ctx.canvas.height,
                w = this._ctx.canvas.width;
            if (this._size.width > w) { this._size.width = w; }
            if (this._size.height > h) { this._size.height = h; }
            if (this._x < this._size.width / 2) { this._x = this._size.width / 2; }
            if (this._x > w - this._size.width / 2) { this._x = w - this._size.width / 2; }
            if (this._y < this._size.height / 2) { this._y = this._size.height / 2; }
            if (this._y > h - this._size.height / 2) { this._y = h - this._size.height / 2; }
        };

        CropArea.prototype._drawArea = function () { };

        CropArea.prototype.draw = function () {
            // draw crop area
            this._cropCanvas.drawCropArea(this._image, [this._x, this._y], this._size, this._drawArea);
        };

        CropArea.prototype.processMouseMove = function () { };

        CropArea.prototype.processMouseDown = function () { };

        CropArea.prototype.processMouseUp = function () { };

        return CropArea;
    }]);

    crop.factory('cropCanvas', [function () {
        // Shape = Array of [x,y]; [0, 0] - center
        var shapeArrowNW = [[-0.5, -2], [-3, -4.5], [-0.5, -7], [-7, -7], [-7, -0.5], [-4.5, -3], [-2, -0.5]];
        var shapeArrowNE = [[0.5, -2], [3, -4.5], [0.5, -7], [7, -7], [7, -0.5], [4.5, -3], [2, -0.5]];
        var shapeArrowSW = [[-0.5, 2], [-3, 4.5], [-0.5, 7], [-7, 7], [-7, 0.5], [-4.5, 3], [-2, 0.5]];
        var shapeArrowSE = [[0.5, 2], [3, 4.5], [0.5, 7], [7, 7], [7, 0.5], [4.5, 3], [2, 0.5]];
        var shapeArrowN = [[-1.5, -2.5], [-1.5, -6], [-5, -6], [0, -11], [5, -6], [1.5, -6], [1.5, -2.5]];
        var shapeArrowW = [[-2.5, -1.5], [-6, -1.5], [-6, -5], [-11, 0], [-6, 5], [-6, 1.5], [-2.5, 1.5]];
        var shapeArrowS = [[-1.5, 2.5], [-1.5, 6], [-5, 6], [0, 11], [5, 6], [1.5, 6], [1.5, 2.5]];
        var shapeArrowE = [[2.5, -1.5], [6, -1.5], [6, -5], [11, 0], [6, 5], [6, 1.5], [2.5, 1.5]];

        // Colors
        var colors = {
            areaOutline: '#fff',
            resizeBoxStroke: '#fff',
            resizeBoxFill: '#444',
            resizeBoxArrowFill: '#fff',
            resizeCircleStroke: '#fff',
            resizeCircleFill: '#444',
            moveIconFill: '#fff'
        };

        return function (ctx) {

            /* Base functions */

            // Calculate Point
            var calcPoint = function (point, offset, scale) {
                return [scale * point[0] + offset[0], scale * point[1] + offset[1]];
            };

            // Draw Filled Polygon
            var drawFilledPolygon = function (shape, fillStyle, centerCoords, scale) {
                //  console.log('drawFilledPolygon');
                ctx.save();
                ctx.fillStyle = fillStyle;
                ctx.beginPath();
                var pc, pc0 = calcPoint(shape[0], centerCoords, scale);
                ctx.moveTo(pc0[0], pc0[1]);

                for (var p in shape) {
                    if (p > 0) {
                        pc = calcPoint(shape[p], centerCoords, scale);
                        ctx.lineTo(pc[0], pc[1]);
                    }
                }

                ctx.lineTo(pc0[0], pc0[1]);
                ctx.fill();
                ctx.closePath();
                ctx.restore();
            };

            /* Icons */

            this.drawIconMove = function (centerCoords, scale) {
                drawFilledPolygon(shapeArrowN, colors.moveIconFill, centerCoords, scale);
                drawFilledPolygon(shapeArrowW, colors.moveIconFill, centerCoords, scale);
                drawFilledPolygon(shapeArrowS, colors.moveIconFill, centerCoords, scale);
                drawFilledPolygon(shapeArrowE, colors.moveIconFill, centerCoords, scale);
            };

            this.drawIconResizeCircle = function (centerCoords, circleRadius, scale) {
                var scaledCircleRadius = circleRadius * scale;
                ctx.save();
                ctx.strokeStyle = colors.resizeCircleStroke;
                ctx.lineWidth = 2;
                ctx.fillStyle = colors.resizeCircleFill;
                ctx.beginPath();
                ctx.arc(centerCoords[0], centerCoords[1], scaledCircleRadius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                ctx.closePath();
                ctx.restore();
            };

            this.drawIconResizeBoxBase = function (centerCoords, boxSize, scale) {
                var scaledBoxSize = boxSize * scale;
                ctx.save();
                ctx.strokeStyle = colors.resizeBoxStroke;
                ctx.lineWidth = 2;
                ctx.fillStyle = colors.resizeBoxFill;
                ctx.fillRect(centerCoords[0] - scaledBoxSize, centerCoords[1] - scaledBoxSize, scaledBoxSize, scaledBoxSize);
                ctx.strokeRect(centerCoords[0] - scaledBoxSize, centerCoords[1] - scaledBoxSize, scaledBoxSize, scaledBoxSize);
                ctx.restore();
            };
            this.drawIconResizeBoxNESW = function (centerCoords, boxSize, scale) {
                this.drawIconResizeBoxBase(centerCoords, boxSize, scale);
                drawFilledPolygon(shapeArrowNE, colors.resizeBoxArrowFill, centerCoords, scale);
                drawFilledPolygon(shapeArrowSW, colors.resizeBoxArrowFill, centerCoords, scale);
            };
            this.drawIconResizeBoxNWSE = function (centerCoords, boxSize, scale) {
                this.drawIconResizeBoxBase(centerCoords, boxSize, scale);
                drawFilledPolygon(shapeArrowNW, colors.resizeBoxArrowFill, centerCoords, scale);
                drawFilledPolygon(shapeArrowSE, colors.resizeBoxArrowFill, centerCoords, scale);
            };

            /* Crop Area */

            this.drawCropArea = function (image, centerCoords, size, fnDrawClipPath) {
                var xRatio = image.width / ctx.canvas.width,
                    yRatio = image.height / ctx.canvas.height,
                    xLeft = centerCoords[0] - size.width / 2,
                    yTop = centerCoords[1] - size.height / 2;

                // console.log('drawCropArea,xLeft:' + xLeft + ',yTop:' + yTop);


                ctx.save();
                ctx.strokeStyle = colors.areaOutline;
                ctx.lineWidth = 2;
                ctx.beginPath();
                fnDrawClipPath(ctx, centerCoords, size);
                ctx.stroke();
                ctx.clip();

                // draw part of original image
                if (size.width > 0 && size.height > 0) {
                    ctx.drawImage(image, xLeft * xRatio, yTop * yRatio, size.width * xRatio, size.height * yRatio, xLeft, yTop, size.width, size.height);
                }

                ctx.beginPath();
                fnDrawClipPath(ctx, centerCoords, size);
                ctx.stroke();
                ctx.clip();

                ctx.restore();
            };

        };
    }]);

    /**
     * EXIF service is based on the exif-js library (https://github.com/jseidelin/exif-js)
     */

    crop.service('cropEXIF', [function () {
        var debug = false;

        var ExifTags = this.Tags = {

            // version tags
            0x9000: "ExifVersion",             // EXIF version
            0xA000: "FlashpixVersion",         // Flashpix format version

            // colorspace tags
            0xA001: "ColorSpace",              // Color space information tag

            // image configuration
            0xA002: "PixelXDimension",         // Valid width of meaningful image
            0xA003: "PixelYDimension",         // Valid height of meaningful image
            0x9101: "ComponentsConfiguration", // Information about channels
            0x9102: "CompressedBitsPerPixel",  // Compressed bits per pixel

            // user information
            0x927C: "MakerNote",               // Any desired information written by the manufacturer
            0x9286: "UserComment",             // Comments by user

            // related file
            0xA004: "RelatedSoundFile",        // Name of related sound file

            // date and time
            0x9003: "DateTimeOriginal",        // Date and time when the original image was generated
            0x9004: "DateTimeDigitized",       // Date and time when the image was stored digitally
            0x9290: "SubsecTime",              // Fractions of seconds for DateTime
            0x9291: "SubsecTimeOriginal",      // Fractions of seconds for DateTimeOriginal
            0x9292: "SubsecTimeDigitized",     // Fractions of seconds for DateTimeDigitized

            // picture-taking conditions
            0x829A: "ExposureTime",            // Exposure time (in seconds)
            0x829D: "FNumber",                 // F number
            0x8822: "ExposureProgram",         // Exposure program
            0x8824: "SpectralSensitivity",     // Spectral sensitivity
            0x8827: "ISOSpeedRatings",         // ISO speed rating
            0x8828: "OECF",                    // Optoelectric conversion factor
            0x9201: "ShutterSpeedValue",       // Shutter speed
            0x9202: "ApertureValue",           // Lens aperture
            0x9203: "BrightnessValue",         // Value of brightness
            0x9204: "ExposureBias",            // Exposure bias
            0x9205: "MaxApertureValue",        // Smallest F number of lens
            0x9206: "SubjectDistance",         // Distance to subject in meters
            0x9207: "MeteringMode",            // Metering mode
            0x9208: "LightSource",             // Kind of light source
            0x9209: "Flash",                   // Flash status
            0x9214: "SubjectArea",             // Location and area of main subject
            0x920A: "FocalLength",             // Focal length of the lens in mm
            0xA20B: "FlashEnergy",             // Strobe energy in BCPS
            0xA20C: "SpatialFrequencyResponse",    //
            0xA20E: "FocalPlaneXResolution",   // Number of pixels in width direction per FocalPlaneResolutionUnit
            0xA20F: "FocalPlaneYResolution",   // Number of pixels in height direction per FocalPlaneResolutionUnit
            0xA210: "FocalPlaneResolutionUnit",    // Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
            0xA214: "SubjectLocation",         // Location of subject in image
            0xA215: "ExposureIndex",           // Exposure index selected on camera
            0xA217: "SensingMethod",           // Image sensor type
            0xA300: "FileSource",              // Image source (3 == DSC)
            0xA301: "SceneType",               // Scene type (1 == directly photographed)
            0xA302: "CFAPattern",              // Color filter array geometric pattern
            0xA401: "CustomRendered",          // Special processing
            0xA402: "ExposureMode",            // Exposure mode
            0xA403: "WhiteBalance",            // 1 = auto white balance, 2 = manual
            0xA404: "DigitalZoomRation",       // Digital zoom ratio
            0xA405: "FocalLengthIn35mmFilm",   // Equivalent foacl length assuming 35mm film camera (in mm)
            0xA406: "SceneCaptureType",        // Type of scene
            0xA407: "GainControl",             // Degree of overall image gain adjustment
            0xA408: "Contrast",                // Direction of contrast processing applied by camera
            0xA409: "Saturation",              // Direction of saturation processing applied by camera
            0xA40A: "Sharpness",               // Direction of sharpness processing applied by camera
            0xA40B: "DeviceSettingDescription",    //
            0xA40C: "SubjectDistanceRange",    // Distance to subject

            // other tags
            0xA005: "InteroperabilityIFDPointer",
            0xA420: "ImageUniqueID"            // Identifier assigned uniquely to each image
        };

        var TiffTags = this.TiffTags = {
            0x0100: "ImageWidth",
            0x0101: "ImageHeight",
            0x8769: "ExifIFDPointer",
            0x8825: "GPSInfoIFDPointer",
            0xA005: "InteroperabilityIFDPointer",
            0x0102: "BitsPerSample",
            0x0103: "Compression",
            0x0106: "PhotometricInterpretation",
            0x0112: "Orientation",
            0x0115: "SamplesPerPixel",
            0x011C: "PlanarConfiguration",
            0x0212: "YCbCrSubSampling",
            0x0213: "YCbCrPositioning",
            0x011A: "XResolution",
            0x011B: "YResolution",
            0x0128: "ResolutionUnit",
            0x0111: "StripOffsets",
            0x0116: "RowsPerStrip",
            0x0117: "StripByteCounts",
            0x0201: "JPEGInterchangeFormat",
            0x0202: "JPEGInterchangeFormatLength",
            0x012D: "TransferFunction",
            0x013E: "WhitePoint",
            0x013F: "PrimaryChromaticities",
            0x0211: "YCbCrCoefficients",
            0x0214: "ReferenceBlackWhite",
            0x0132: "DateTime",
            0x010E: "ImageDescription",
            0x010F: "Make",
            0x0110: "Model",
            0x0131: "Software",
            0x013B: "Artist",
            0x8298: "Copyright"
        };

        var GPSTags = this.GPSTags = {
            0x0000: "GPSVersionID",
            0x0001: "GPSLatitudeRef",
            0x0002: "GPSLatitude",
            0x0003: "GPSLongitudeRef",
            0x0004: "GPSLongitude",
            0x0005: "GPSAltitudeRef",
            0x0006: "GPSAltitude",
            0x0007: "GPSTimeStamp",
            0x0008: "GPSSatellites",
            0x0009: "GPSStatus",
            0x000A: "GPSMeasureMode",
            0x000B: "GPSDOP",
            0x000C: "GPSSpeedRef",
            0x000D: "GPSSpeed",
            0x000E: "GPSTrackRef",
            0x000F: "GPSTrack",
            0x0010: "GPSImgDirectionRef",
            0x0011: "GPSImgDirection",
            0x0012: "GPSMapDatum",
            0x0013: "GPSDestLatitudeRef",
            0x0014: "GPSDestLatitude",
            0x0015: "GPSDestLongitudeRef",
            0x0016: "GPSDestLongitude",
            0x0017: "GPSDestBearingRef",
            0x0018: "GPSDestBearing",
            0x0019: "GPSDestDistanceRef",
            0x001A: "GPSDestDistance",
            0x001B: "GPSProcessingMethod",
            0x001C: "GPSAreaInformation",
            0x001D: "GPSDateStamp",
            0x001E: "GPSDifferential"
        };

        var StringValues = this.StringValues = {
            ExposureProgram: {
                0: "Not defined",
                1: "Manual",
                2: "Normal program",
                3: "Aperture priority",
                4: "Shutter priority",
                5: "Creative program",
                6: "Action program",
                7: "Portrait mode",
                8: "Landscape mode"
            },
            MeteringMode: {
                0: "Unknown",
                1: "Average",
                2: "CenterWeightedAverage",
                3: "Spot",
                4: "MultiSpot",
                5: "Pattern",
                6: "Partial",
                255: "Other"
            },
            LightSource: {
                0: "Unknown",
                1: "Daylight",
                2: "Fluorescent",
                3: "Tungsten (incandescent light)",
                4: "Flash",
                9: "Fine weather",
                10: "Cloudy weather",
                11: "Shade",
                12: "Daylight fluorescent (D 5700 - 7100K)",
                13: "Day white fluorescent (N 4600 - 5400K)",
                14: "Cool white fluorescent (W 3900 - 4500K)",
                15: "White fluorescent (WW 3200 - 3700K)",
                17: "Standard light A",
                18: "Standard light B",
                19: "Standard light C",
                20: "D55",
                21: "D65",
                22: "D75",
                23: "D50",
                24: "ISO studio tungsten",
                255: "Other"
            },
            Flash: {
                0x0000: "Flash did not fire",
                0x0001: "Flash fired",
                0x0005: "Strobe return light not detected",
                0x0007: "Strobe return light detected",
                0x0009: "Flash fired, compulsory flash mode",
                0x000D: "Flash fired, compulsory flash mode, return light not detected",
                0x000F: "Flash fired, compulsory flash mode, return light detected",
                0x0010: "Flash did not fire, compulsory flash mode",
                0x0018: "Flash did not fire, auto mode",
                0x0019: "Flash fired, auto mode",
                0x001D: "Flash fired, auto mode, return light not detected",
                0x001F: "Flash fired, auto mode, return light detected",
                0x0020: "No flash function",
                0x0041: "Flash fired, red-eye reduction mode",
                0x0045: "Flash fired, red-eye reduction mode, return light not detected",
                0x0047: "Flash fired, red-eye reduction mode, return light detected",
                0x0049: "Flash fired, compulsory flash mode, red-eye reduction mode",
                0x004D: "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",
                0x004F: "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",
                0x0059: "Flash fired, auto mode, red-eye reduction mode",
                0x005D: "Flash fired, auto mode, return light not detected, red-eye reduction mode",
                0x005F: "Flash fired, auto mode, return light detected, red-eye reduction mode"
            },
            SensingMethod: {
                1: "Not defined",
                2: "One-chip color area sensor",
                3: "Two-chip color area sensor",
                4: "Three-chip color area sensor",
                5: "Color sequential area sensor",
                7: "Trilinear sensor",
                8: "Color sequential linear sensor"
            },
            SceneCaptureType: {
                0: "Standard",
                1: "Landscape",
                2: "Portrait",
                3: "Night scene"
            },
            SceneType: {
                1: "Directly photographed"
            },
            CustomRendered: {
                0: "Normal process",
                1: "Custom process"
            },
            WhiteBalance: {
                0: "Auto white balance",
                1: "Manual white balance"
            },
            GainControl: {
                0: "None",
                1: "Low gain up",
                2: "High gain up",
                3: "Low gain down",
                4: "High gain down"
            },
            Contrast: {
                0: "Normal",
                1: "Soft",
                2: "Hard"
            },
            Saturation: {
                0: "Normal",
                1: "Low saturation",
                2: "High saturation"
            },
            Sharpness: {
                0: "Normal",
                1: "Soft",
                2: "Hard"
            },
            SubjectDistanceRange: {
                0: "Unknown",
                1: "Macro",
                2: "Close view",
                3: "Distant view"
            },
            FileSource: {
                3: "DSC"
            },

            Components: {
                0: "",
                1: "Y",
                2: "Cb",
                3: "Cr",
                4: "R",
                5: "G",
                6: "B"
            }
        };

        function addEvent(element, event, handler) {
            if (element.addEventListener) {
                element.addEventListener(event, handler, false);
            } else if (element.attachEvent) {
                element.attachEvent("on" + event, handler);
            }
        }

        function imageHasData(img) {
            return !!(img.exifdata);
        }

        function base64ToArrayBuffer(base64, contentType) {
            contentType = contentType || base64.match(/^data\:([^\;]+)\;base64,/mi)[1] || ''; // e.g. 'data:image/jpeg;base64,...' => 'image/jpeg'
            base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
            var binary = atob(base64);
            var len = binary.length;
            var buffer = new ArrayBuffer(len);
            var view = new Uint8Array(buffer);
            for (var i = 0; i < len; i++) {
                view[i] = binary.charCodeAt(i);
            }
            return buffer;
        }

        function objectURLToBlob(url, callback) {
            var http = new XMLHttpRequest();
            http.open("GET", url, true);
            http.responseType = "blob";
            http.onload = function (e) {
                if (this.status == 200 || this.status === 0) {
                    callback(this.response);
                }
            };
            http.send();
        }

        function getImageData(img, callback) {
            function handleBinaryFile(binFile) {
                var data = findEXIFinJPEG(binFile);
                var iptcdata = findIPTCinJPEG(binFile);
                img.exifdata = data || {};
                img.iptcdata = iptcdata || {};
                if (callback) {
                    callback.call(img);
                }
            }

            if (img.src) {
                if (/^data\:/i.test(img.src)) { // Data URI
                    var arrayBuffer = base64ToArrayBuffer(img.src);
                    handleBinaryFile(arrayBuffer);

                } else if (/^blob\:/i.test(img.src)) { // Object URL
                    var fileReader = new FileReader();
                    fileReader.onload = function (e) {
                        handleBinaryFile(e.target.result);
                    };
                    objectURLToBlob(img.src, function (blob) {
                        fileReader.readAsArrayBuffer(blob);
                    });
                } else {
                    var http = new XMLHttpRequest();
                    http.onload = function () {
                        if (this.status == 200 || this.status === 0) {
                            handleBinaryFile(http.response);
                        } else {
                            throw "Could not load image";
                        }
                        http = null;
                    };
                    http.open("GET", img.src, true);
                    http.responseType = "arraybuffer";
                    http.send(null);
                }
            } else if (window.FileReader && (img instanceof window.Blob || img instanceof window.File)) {
                var fileReader = new FileReader();
                fileReader.onload = function (e) {
                    if (debug) console.log("Got file of length " + e.target.result.byteLength);
                    handleBinaryFile(e.target.result);
                };

                fileReader.readAsArrayBuffer(img);
            }
        }

        function findEXIFinJPEG(file) {
            var dataView = new DataView(file);

            if (debug) console.log("Got file of length " + file.byteLength);
            if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
                if (debug) console.log("Not a valid JPEG");
                return false; // not a valid jpeg
            }

            var offset = 2,
                length = file.byteLength,
                marker;

            while (offset < length) {
                if (dataView.getUint8(offset) != 0xFF) {
                    if (debug) console.log("Not a valid marker at offset " + offset + ", found: " + dataView.getUint8(offset));
                    return false; // not a valid marker, something is wrong
                }

                marker = dataView.getUint8(offset + 1);
                if (debug) console.log(marker);

                // we could implement handling for other markers here,
                // but we're only looking for 0xFFE1 for EXIF data

                if (marker == 225) {
                    if (debug) console.log("Found 0xFFE1 marker");

                    return readEXIFData(dataView, offset + 4, dataView.getUint16(offset + 2) - 2);

                    // offset += 2 + file.getShortAt(offset+2, true);

                } else {
                    offset += 2 + dataView.getUint16(offset + 2);
                }

            }

        }

        function findIPTCinJPEG(file) {
            var dataView = new DataView(file);

            if (debug) console.log("Got file of length " + file.byteLength);
            if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
                if (debug) console.log("Not a valid JPEG");
                return false; // not a valid jpeg
            }

            var offset = 2,
                length = file.byteLength;

            var isFieldSegmentStart = function (dataView, offset) {
                return (
                    dataView.getUint8(offset) === 0x38 &&
                    dataView.getUint8(offset + 1) === 0x42 &&
                    dataView.getUint8(offset + 2) === 0x49 &&
                    dataView.getUint8(offset + 3) === 0x4D &&
                    dataView.getUint8(offset + 4) === 0x04 &&
                    dataView.getUint8(offset + 5) === 0x04
                );
            };

            while (offset < length) {

                if (isFieldSegmentStart(dataView, offset)) {

                    // Get the length of the name header (which is padded to an even number of bytes)
                    var nameHeaderLength = dataView.getUint8(offset + 7);
                    if (nameHeaderLength % 2 !== 0) nameHeaderLength += 1;
                    // Check for pre photoshop 6 format
                    if (nameHeaderLength === 0) {
                        // Always 4
                        nameHeaderLength = 4;
                    }

                    var startOffset = offset + 8 + nameHeaderLength;
                    var sectionLength = dataView.getUint16(offset + 6 + nameHeaderLength);

                    return readIPTCData(file, startOffset, sectionLength);

                    break;

                }

                // Not the marker, continue searching
                offset++;

            }

        }
        var IptcFieldMap = {
            0x78: 'caption',
            0x6E: 'credit',
            0x19: 'keywords',
            0x37: 'dateCreated',
            0x50: 'byline',
            0x55: 'bylineTitle',
            0x7A: 'captionWriter',
            0x69: 'headline',
            0x74: 'copyright',
            0x0F: 'category'
        };
        function readIPTCData(file, startOffset, sectionLength) {
            var dataView = new DataView(file);
            var data = {};
            var fieldValue, fieldName, dataSize, segmentType, segmentSize;
            var segmentStartPos = startOffset;
            while (segmentStartPos < startOffset + sectionLength) {
                if (dataView.getUint8(segmentStartPos) === 0x1C && dataView.getUint8(segmentStartPos + 1) === 0x02) {
                    segmentType = dataView.getUint8(segmentStartPos + 2);
                    if (segmentType in IptcFieldMap) {
                        dataSize = dataView.getInt16(segmentStartPos + 3);
                        segmentSize = dataSize + 5;
                        fieldName = IptcFieldMap[segmentType];
                        fieldValue = getStringFromDB(dataView, segmentStartPos + 5, dataSize);
                        // Check if we already stored a value with this name
                        if (data.hasOwnProperty(fieldName)) {
                            // Value already stored with this name, create multivalue field
                            if (data[fieldName] instanceof Array) {
                                data[fieldName].push(fieldValue);
                            }
                            else {
                                data[fieldName] = [data[fieldName], fieldValue];
                            }
                        }
                        else {
                            data[fieldName] = fieldValue;
                        }
                    }

                }
                segmentStartPos++;
            }
            return data;
        }

        function readTags(file, tiffStart, dirStart, strings, bigEnd) {
            var entries = file.getUint16(dirStart, !bigEnd),
                tags = {},
                entryOffset, tag,
                i;

            for (i = 0; i < entries; i++) {
                entryOffset = dirStart + i * 12 + 2;
                tag = strings[file.getUint16(entryOffset, !bigEnd)];
                if (!tag && debug) console.log("Unknown tag: " + file.getUint16(entryOffset, !bigEnd));
                tags[tag] = readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd);
            }
            return tags;
        }

        function readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd) {
            var type = file.getUint16(entryOffset + 2, !bigEnd),
                numValues = file.getUint32(entryOffset + 4, !bigEnd),
                valueOffset = file.getUint32(entryOffset + 8, !bigEnd) + tiffStart,
                offset,
                vals, val, n,
                numerator, denominator;

            switch (type) {
                case 1: // byte, 8-bit unsigned int
                case 7: // undefined, 8-bit byte, value depending on field
                    if (numValues == 1) {
                        return file.getUint8(entryOffset + 8, !bigEnd);
                    } else {
                        offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getUint8(offset + n);
                        }
                        return vals;
                    }

                case 2: // ascii, 8-bit byte
                    offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                    return getStringFromDB(file, offset, numValues - 1);

                case 3: // short, 16 bit int
                    if (numValues == 1) {
                        return file.getUint16(entryOffset + 8, !bigEnd);
                    } else {
                        offset = numValues > 2 ? valueOffset : (entryOffset + 8);
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getUint16(offset + 2 * n, !bigEnd);
                        }
                        return vals;
                    }

                case 4: // long, 32 bit int
                    if (numValues == 1) {
                        return file.getUint32(entryOffset + 8, !bigEnd);
                    } else {
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getUint32(valueOffset + 4 * n, !bigEnd);
                        }
                        return vals;
                    }

                case 5:    // rational = two long values, first is numerator, second is denominator
                    if (numValues == 1) {
                        numerator = file.getUint32(valueOffset, !bigEnd);
                        denominator = file.getUint32(valueOffset + 4, !bigEnd);
                        val = new Number(numerator / denominator);
                        val.numerator = numerator;
                        val.denominator = denominator;
                        return val;
                    } else {
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            numerator = file.getUint32(valueOffset + 8 * n, !bigEnd);
                            denominator = file.getUint32(valueOffset + 4 + 8 * n, !bigEnd);
                            vals[n] = new Number(numerator / denominator);
                            vals[n].numerator = numerator;
                            vals[n].denominator = denominator;
                        }
                        return vals;
                    }

                case 9: // slong, 32 bit signed int
                    if (numValues == 1) {
                        return file.getInt32(entryOffset + 8, !bigEnd);
                    } else {
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getInt32(valueOffset + 4 * n, !bigEnd);
                        }
                        return vals;
                    }

                case 10: // signed rational, two slongs, first is numerator, second is denominator
                    if (numValues == 1) {
                        return file.getInt32(valueOffset, !bigEnd) / file.getInt32(valueOffset + 4, !bigEnd);
                    } else {
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getInt32(valueOffset + 8 * n, !bigEnd) / file.getInt32(valueOffset + 4 + 8 * n, !bigEnd);
                        }
                        return vals;
                    }
            }
        }

        function getStringFromDB(buffer, start, length) {
            var outstr = "";
            for (var n = start; n < start + length; n++) {
                outstr += String.fromCharCode(buffer.getUint8(n));
            }
            return outstr;
        }

        function readEXIFData(file, start) {
            if (getStringFromDB(file, start, 4) != "Exif") {
                if (debug) console.log("Not valid EXIF data! " + getStringFromDB(file, start, 4));
                return false;
            }

            var bigEnd,
                tags, tag,
                exifData, gpsData,
                tiffOffset = start + 6;

            // test for TIFF validity and endianness
            if (file.getUint16(tiffOffset) == 0x4949) {
                bigEnd = false;
            } else if (file.getUint16(tiffOffset) == 0x4D4D) {
                bigEnd = true;
            } else {
                if (debug) console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)");
                return false;
            }

            if (file.getUint16(tiffOffset + 2, !bigEnd) != 0x002A) {
                if (debug) console.log("Not valid TIFF data! (no 0x002A)");
                return false;
            }

            var firstIFDOffset = file.getUint32(tiffOffset + 4, !bigEnd);

            if (firstIFDOffset < 0x00000008) {
                if (debug) console.log("Not valid TIFF data! (First offset less than 8)", file.getUint32(tiffOffset + 4, !bigEnd));
                return false;
            }

            tags = readTags(file, tiffOffset, tiffOffset + firstIFDOffset, TiffTags, bigEnd);

            if (tags.ExifIFDPointer) {
                exifData = readTags(file, tiffOffset, tiffOffset + tags.ExifIFDPointer, ExifTags, bigEnd);
                for (tag in exifData) {
                    switch (tag) {
                        case "LightSource":
                        case "Flash":
                        case "MeteringMode":
                        case "ExposureProgram":
                        case "SensingMethod":
                        case "SceneCaptureType":
                        case "SceneType":
                        case "CustomRendered":
                        case "WhiteBalance":
                        case "GainControl":
                        case "Contrast":
                        case "Saturation":
                        case "Sharpness":
                        case "SubjectDistanceRange":
                        case "FileSource":
                            exifData[tag] = StringValues[tag][exifData[tag]];
                            break;

                        case "ExifVersion":
                        case "FlashpixVersion":
                            exifData[tag] = String.fromCharCode(exifData[tag][0], exifData[tag][1], exifData[tag][2], exifData[tag][3]);
                            break;

                        case "ComponentsConfiguration":
                            exifData[tag] =
                                StringValues.Components[exifData[tag][0]] +
                                StringValues.Components[exifData[tag][1]] +
                                StringValues.Components[exifData[tag][2]] +
                                StringValues.Components[exifData[tag][3]];
                            break;
                    }
                    tags[tag] = exifData[tag];
                }
            }

            if (tags.GPSInfoIFDPointer) {
                gpsData = readTags(file, tiffOffset, tiffOffset + tags.GPSInfoIFDPointer, GPSTags, bigEnd);
                for (tag in gpsData) {
                    switch (tag) {
                        case "GPSVersionID":
                            gpsData[tag] = gpsData[tag][0] +
                                "." + gpsData[tag][1] +
                                "." + gpsData[tag][2] +
                                "." + gpsData[tag][3];
                            break;
                    }
                    tags[tag] = gpsData[tag];
                }
            }

            return tags;
        }

        this.getData = function (img, callback) {
            if ((img instanceof Image || img instanceof HTMLImageElement) && !img.complete) return false;

            if (!imageHasData(img)) {
                getImageData(img, callback);
            } else {
                if (callback) {
                    callback.call(img);
                }
            }
            return true;
        }

        this.getTag = function (img, tag) {
            if (!imageHasData(img)) return;
            return img.exifdata[tag];
        }

        this.getAllTags = function (img) {
            if (!imageHasData(img)) return {};
            var a,
                data = img.exifdata,
                tags = {};
            for (a in data) {
                if (data.hasOwnProperty(a)) {
                    tags[a] = data[a];
                }
            }
            return tags;
        }

        this.pretty = function (img) {
            if (!imageHasData(img)) return "";
            var a,
                data = img.exifdata,
                strPretty = "";
            for (a in data) {
                if (data.hasOwnProperty(a)) {
                    if (typeof data[a] == "object") {
                        if (data[a] instanceof Number) {
                            strPretty += a + " : " + data[a] + " [" + data[a].numerator + "/" + data[a].denominator + "]\r\n";
                        } else {
                            strPretty += a + " : [" + data[a].length + " values]\r\n";
                        }
                    } else {
                        strPretty += a + " : " + data[a] + "\r\n";
                    }
                }
            }
            return strPretty;
        }

        this.readFromBinaryFile = function (file) {
            return findEXIFinJPEG(file);
        }
    }]);

    crop.factory('cropHost', ['$document', 'cropAreaSquare', 'cropEXIF', function ($document, CropAreaSquare, cropEXIF) {
        /* STATIC FUNCTIONS */

        // Get Element's Offset
        var getElementOffset = function (elem) {
            var box = elem.getBoundingClientRect();

            var body = document.body;
            var docElem = document.documentElement;

            var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
            var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

            var clientTop = docElem.clientTop || body.clientTop || 0;
            var clientLeft = docElem.clientLeft || body.clientLeft || 0;

            var top = box.top + scrollTop - clientTop;
            var left = box.left + scrollLeft - clientLeft;

            return { top: Math.round(top), left: Math.round(left) };
        };

        return function (elCanvas, opts, events) {
            /* PRIVATE VARIABLES */

            // Object Pointers
            var ctx = null,
                image = null,
                theArea = null;

            // Dimensions
            var minCanvasDims = [100, 100],
                maxCanvasDims = [300, 300];

            // Result Image ratio
            var resImgRatio = 1.5;

            // Result Image format
            var resImgFormat = 'image/png';

            // Result Image quality
            var resImgQuality = null;

            /* PRIVATE FUNCTIONS */

            // Draw Scene
            function drawScene() {
                // clear canvas
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                if (image !== null) {
                    // draw source image
                    ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height);

                    ctx.save();

                    // and make it darker
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                    ctx.restore();

                    //   console.log('theArea:');
                    //   console.log(theArea);

                    // draw Area
                    theArea.draw();
                }
            }

            // Resets CropHost
            var resetCropHost = function () {
                if (image !== null) {
                    theArea.setImage(image);
                    var imageDims = [image.width, image.height],
                        imageRatio = image.width / image.height,
                        canvasDims = imageDims;

                    updateCanvasDims();
                    theArea.setX(ctx.canvas.width / 2);
                    theArea.setY(ctx.canvas.height / 2);
                    theArea.setSize({
                        width: Math.min(200, ctx.canvas.width / 2),
                        height: Math.min(200, ctx.canvas.height / 2)
                    });
                } else {
                    elCanvas.prop('width', 0).prop('height', 0).css({ 'margin-top': 0 });
                }

                drawScene();
            };

            var updateCanvasDims = function () {
                var imageDims = [image.width, image.height],
                    imageRatio = image.width / image.height,
                    canvasDims = imageDims;

                if (canvasDims[0] > maxCanvasDims[0]) {
                    canvasDims[0] = maxCanvasDims[0];
                    canvasDims[1] = canvasDims[0] / imageRatio;
                } else if (canvasDims[0] < minCanvasDims[0]) {
                    canvasDims[0] = minCanvasDims[0];
                    canvasDims[1] = canvasDims[0] / imageRatio;
                }
                if (angular.isDefined(maxCanvasDims[1])) {
                    if (canvasDims[1] > maxCanvasDims[1]) {
                        canvasDims[1] = maxCanvasDims[1];
                        canvasDims[0] = canvasDims[1] * imageRatio;
                    } else if (canvasDims[1] < minCanvasDims[1]) {
                        canvasDims[1] = minCanvasDims[1];
                        canvasDims[0] = canvasDims[1] * imageRatio;
                    }
                }
                elCanvas.prop('width', canvasDims[0]).prop('height', canvasDims[1]);/*.css({ 'margin-left': -canvasDims[0] / 2 + 'px', 'margin-top': -canvasDims[1] / 2 + 'px' });*/

            }

            /**
             * Returns event.changedTouches directly if event is a TouchEvent.
             * If event is a jQuery event, return changedTouches of event.originalEvent
             */
            var getChangedTouches = function (event) {
                if (angular.isDefined(event.changedTouches)) {
                    return event.changedTouches;
                } else {
                    return event.originalEvent.changedTouches;
                }
            };

            var onMouseMove = function (e) {
                if (image !== null) {
                    var offset = getElementOffset(ctx.canvas),
                        pageX, pageY;
                    if (e.type === 'touchmove') {
                        pageX = getChangedTouches(e)[0].pageX;
                        pageY = getChangedTouches(e)[0].pageY;
                    } else {
                        pageX = e.pageX;
                        pageY = e.pageY;
                    }
                    theArea.processMouseMove(pageX - offset.left, pageY - offset.top);
                    drawScene();
                }
            };

            var onMouseDown = function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (image !== null) {
                    var offset = getElementOffset(ctx.canvas),
                        pageX, pageY;
                    if (e.type === 'touchstart') {
                        pageX = getChangedTouches(e)[0].pageX;
                        pageY = getChangedTouches(e)[0].pageY;
                    } else {
                        pageX = e.pageX;
                        pageY = e.pageY;
                    }
                    theArea.processMouseDown(pageX - offset.left, pageY - offset.top);
                    drawScene();
                }
            };

            var onMouseUp = function (e) {
                if (image !== null) {
                    var offset = getElementOffset(ctx.canvas),
                        pageX, pageY;
                    if (e.type === 'touchend') {
                        pageX = getChangedTouches(e)[0].pageX;
                        pageY = getChangedTouches(e)[0].pageY;
                    } else {
                        pageX = e.pageX;
                        pageY = e.pageY;
                    }
                    theArea.processMouseUp(pageX - offset.left, pageY - offset.top);
                    drawScene();
                }
            };

            this.getResultImageDataURI = function () {
                if (image == null) {
                    return undefined;
                }
                var temp_ctx, temp_canvas;
                temp_canvas = angular.element('<canvas></canvas>')[0];
                temp_ctx = temp_canvas.getContext('2d');
                var area_size = theArea.getSize();
                var w = area_size.width;
                var h = area_size.height;
                temp_canvas.width = resImgRatio * w;
                temp_canvas.height = resImgRatio * h;
                if (image !== null) {

                    temp_ctx.drawImage(image, (theArea.getX() - w / 2) * (image.width / ctx.canvas.width), (theArea.getY() - h / 2) * (image.height / ctx.canvas.height), w * (image.width / ctx.canvas.width), h * (image.height / ctx.canvas.height), 0, 0, temp_canvas.width, temp_canvas.height);
                }
                if (resImgQuality !== null) {
                    return temp_canvas.toDataURL(resImgFormat, resImgQuality);
                }
                return temp_canvas.toDataURL(resImgFormat);
            };

            this.setNewImageSource = function (imageSource) {
                image = null;
                resetCropHost();
                events.trigger('image-updated');
                if (!!imageSource) {
                    var newImage = new Image();
                    if (imageSource.substring(0, 4).toLowerCase() === 'http') {
                        newImage.crossOrigin = 'anonymous';
                    }
                    newImage.onload = function () {
                        events.trigger('load-done');

                        cropEXIF.getData(newImage, function () {
                            var orientation = cropEXIF.getTag(newImage, 'Orientation');

                            if ([3, 6, 8].indexOf(orientation) > -1) {
                                var canvas = document.createElement("canvas"),
                                    ctx = canvas.getContext("2d"),
                                    cw = newImage.width, ch = newImage.height, cx = 0, cy = 0, deg = 0;
                                switch (orientation) {
                                    case 3:
                                        cx = -newImage.width;
                                        cy = -newImage.height;
                                        deg = 180;
                                        break;
                                    case 6:
                                        cw = newImage.height;
                                        ch = newImage.width;
                                        cy = -newImage.height;
                                        deg = 90;
                                        break;
                                    case 8:
                                        cw = newImage.height;
                                        ch = newImage.width;
                                        cx = -newImage.width;
                                        deg = 270;
                                        break;
                                }

                                canvas.width = cw;
                                canvas.height = ch;
                                ctx.rotate(deg * Math.PI / 180);
                                ctx.drawImage(newImage, cx, cy);

                                image = new Image();
                                image.src = canvas.toDataURL("image/png");
                            } else {
                                image = newImage;
                            }
                            resetCropHost();
                            events.trigger('image-updated');
                        });
                    };
                    newImage.onerror = function () {
                        events.trigger('load-error');
                    };
                    events.trigger('load-start');
                    newImage.src = imageSource;
                }
            };

            this.setMaxDimensions = function (width, height) {
                maxCanvasDims = [width, height];
              //  console.log('maxCanvasDims');
              //  console.log(maxCanvasDims);
                if (image !== null) {
                    var curWidth = ctx.canvas.width,
                        curHeight = ctx.canvas.height;

                    updateCanvasDims();
                    var ratioNewCurWidth = ctx.canvas.width / curWidth,
                        ratioNewCurHeight = ctx.canvas.height / curHeight;


                    theArea.setX(theArea.getX() * ratioNewCurWidth);
                    theArea.setY(theArea.getY() * ratioNewCurHeight);
                    var area_size = theArea.getSize()
                    theArea.setSize({
                        width: area_size.width * ratioNewCurWidth,
                        height: area_size.height * ratioNewCurHeight
                    });

                } else {
                    elCanvas.prop('width', 0).prop('height', 0).css({ 'margin-top': 0 });
                }

                drawScene();

            };

            this.setAreaMinSize = function (size) {
                if (size) {
                    theArea.setMinSize(size);
                    drawScene();
                }
            };

            this.setResultImageRatio = function (r) {
                if (r != undefined) {
                    resImgRatio = r;
                }
            };

            this.setResultImageFormat = function (format) {
                resImgFormat = format;
            };

            this.setResultImageQuality = function (quality) {
                quality = parseFloat(quality);
                if (!isNaN(quality) && quality >= 0 && quality <= 1) {
                    resImgQuality = quality;
                }
            };

            /* Life Cycle begins */

            // Init Context var
            ctx = elCanvas[0].getContext('2d');

            // Init CropArea
            theArea = new CropAreaSquare(ctx, events);

            // Init Mouse Event Listeners
            $document.on('mousemove', onMouseMove);
            elCanvas.on('mousedown', onMouseDown);
            $document.on('mouseup', onMouseUp);

            // Init Touch Event Listeners
            $document.on('touchmove', onMouseMove);
            elCanvas.on('touchstart', onMouseDown);
            $document.on('touchend', onMouseUp);

            // CropHost Destructor
            this.destroy = function () {
                $document.off('mousemove', onMouseMove);
                elCanvas.off('mousedown', onMouseDown);
                $document.off('mouseup', onMouseMove);

                $document.off('touchmove', onMouseMove);
                elCanvas.off('touchstart', onMouseDown);
                $document.off('touchend', onMouseMove);

                elCanvas.remove();
            };
        };

    }]);


    crop.factory('cropPubSub', [function () {
        return function () {
            var events = {};
            // Subscribe
            this.on = function (names, handler) {
                names.split(' ').forEach(function (name) {
                    if (!events[name]) {
                        events[name] = [];
                    }
                    events[name].push(handler);
                });
                return this;
            };
            // Publish
            this.trigger = function (name, args) {
                angular.forEach(events[name], function (handler) {
                    handler.call(null, args);
                });
                return this;
            };
        };
    }]);

    crop.directive('imgCrop', ['$timeout', 'cropHost', 'cropPubSub', function ($timeout, CropHost, CropPubSub) {
        return {
            restrict: 'AE',
            scope: {
                image: '=?',
                resultImage: '=',

                changeOnFly: '=',
                areaType: '@',
                areaMinSize: '=',

                resultImageRatio: '=',
                resultImageFormat: '@',
                resultImageQuality: '=',

                maxHeight: '=?',
                maxWidth: '=?',

                onChange: '&',
                onLoadBegin: '&',
                onLoadDone: '&',
                onLoadError: '&'
            },
            template: '<canvas></canvas>',
            controller: ['$scope', function ($scope) {
                $scope.events = new CropPubSub();
            }],
            link: function (scope, element/*, attrs*/) {
                // Init Events Manager
                var events = scope.events;

                // Init Crop Host
                var cropHost = new CropHost(element.find('canvas'), {}, events);

                // Store Result Image to check if it's changed
                var storedResultImage;

                var updateResultImage = function (scope) {
                    var resultImage = cropHost.getResultImageDataURI();
                    if (storedResultImage !== resultImage) {
                        storedResultImage = resultImage;
                        scope.resultImage = resultImage;
                        scope.onChange({ $dataURI: scope.resultImage });
                    }
                };

                // Wrapper to safely exec functions within $apply on a running $digest cycle
                var fnSafeApply = function (fn) {
                    return function () {
                        $timeout(function () {
                            scope.$apply(function (scope) {
                                fn(scope);
                            });
                        });
                    };
                };

                // Setup CropHost Event Handlers
                events
                    .on('load-start', fnSafeApply(function (scope) {
                        scope.onLoadBegin({});
                    }))
                    .on('load-done', fnSafeApply(function (scope) {
                        scope.onLoadDone({});
                    }))
                    .on('load-error', fnSafeApply(function (scope) {
                        scope.onLoadError({});
                    }))
                    .on('area-move area-resize', fnSafeApply(function (scope) {
                        if (!!scope.changeOnFly) {
                            updateResultImage(scope);
                        }
                    }))
                    .on('area-move-end area-resize-end image-updated', fnSafeApply(function (scope) {
                        updateResultImage(scope);
                    }));

                // Sync CropHost with Directive's options
                scope.$watch('image', function () {
                    cropHost.setNewImageSource(scope.image);
                });

                scope.$watch('areaMinSize', function () {
                    cropHost.setAreaMinSize(scope.areaMinSize);
                    updateResultImage(scope);
                });


                scope.$watch('resultImageRatio', function () {
                    cropHost.setResultImageRatio(scope.resultImageRatio);
                    updateResultImage(scope);
                });
                scope.$watch('resultImageFormat', function () {
                    cropHost.setResultImageFormat(scope.resultImageFormat);
                    updateResultImage(scope);
                });
                scope.$watch('resultImageQuality', function () {
                    cropHost.setResultImageQuality(scope.resultImageQuality);
                    updateResultImage(scope);
                });
                scope.$watch('[maxWidth, maxHeight]', function (value) {
                    //We only consider clientWidth just like normal html flow
                    var wmax = angular.isDefined(value[0]) ? Math.min(value[0], element[0].clientWidth) : element[0].clientWidth;
                    cropHost.setMaxDimensions(wmax, value[1]);
                    updateResultImage(scope);
                });

                // Update CropHost dimensions when the directive element is resized
                scope.$watch(
                    function () {
                        return element[0].clientWidth;
                    },
                    function (value) {
                        if (value == 0) { return; }
                        var wmax = angular.isDefined(scope.maxWidth) ? Math.min(value, scope.maxWidth) : value;
                        cropHost.setMaxDimensions(wmax, scope.maxHeight);
                        updateResultImage(scope);
                    },
                    true
                );

                // Destroy CropHost Instance when the directive is destroying
                scope.$on('$destroy', function () {
                    cropHost.destroy();
                });
            }
        };
    }])
        .directive('imgFileInput', ['$timeout', '$document', function ($timeout, $document) {
            return {
                restrict: 'A',
                scope: {
                    'fileInputLoaded': '&'
                },
                link: function (scope, element, attrs) {
                    var handleFileSelect = function (evt) {
                        var file = evt.currentTarget.files[0];
                        var reader = new FileReader();
                        reader.onload = function (evt) {
                            scope.$apply(function (scope) {
                                scope.fileInputLoaded({
                                    imageData: evt.target.result
                                });
                            })

                        };
                        reader.readAsDataURL(file);
                    };
                    angular.element(element[0]).on('change', handleFileSelect);
                }
            }
        }])
        .directive('imgDims', ['$timeout', '$document', function ($timeout, $document) {
            return {
                restrict: 'AE',
                scope: {
                    'imageWidth': '=',
                    'imageHeight': '=',
                    'imgSrc': '='
                },
                link: function (scope, element, attrs) {

                    element[0].onload = function () {
                        var w = this.width;
                        var h = this.height;
                        scope.$apply(function (scope) {
                            scope.imageWidth = w;
                            scope.imageHeight = h;
                        });
                    }

                    scope.$watch('imgSrc', function (newVal) {
                        element[0].src = scope.imgSrc;
                    });

                }
            }
        }])
} ());
})(angular);