
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

