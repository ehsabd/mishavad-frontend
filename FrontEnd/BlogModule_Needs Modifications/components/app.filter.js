
angular.module('app')
.filter('xlat', ['XlatService', function (XlatService) {
    return function (label, parameters) {
        return XlatService.xlat(label, parameters);
    }
}])
.filter('htmlToPlaintext', function() {
    return function(text) {
      return  text ? String(text).replace(/<[^>]+>/gm, ' ') : '';
    };
  }
);;
