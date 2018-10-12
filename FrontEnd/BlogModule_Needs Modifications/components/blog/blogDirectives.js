angular.module('app.blog')
.directive('scrolly', ['$window', function ($window) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                angular.element($window).bind('scroll', function () {
                    if (($window.innerHeight + $window.scrollY) >= element[0].offsetHeight)
                        scope.$apply(attrs.scrolly);
                })
            }
        }
    }])