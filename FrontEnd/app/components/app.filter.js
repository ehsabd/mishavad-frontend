
angular.module('app')
.filter('xlat', ['XlatService', function (XlatService) {
    return function (label, parameters) {
        return XlatService.xlat(label, parameters);
    }
}]);
