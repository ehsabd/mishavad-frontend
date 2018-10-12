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