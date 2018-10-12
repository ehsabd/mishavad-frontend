angular.module('app').factory('XlatService', ['$interpolate', 'translateProvider', function ($interpolate, translateProvider) {
    var currentLanguage = 'fa';
    return {
        setCurrentLanguage: function () {
            currentLanguage = newCurrentLanguage;
        },
        getCurrentLanguage: function () {
            return currentLanguage;
        },
        xlat: function (label, parameters) {
            var transText = translateProvider[currentLanguage][label];
            if (transText == undefined) {
                transText = label;
            } else {
                transText = transText.replace(new RegExp('\\*می شود\\*', 'g'), '<span class="mishavad">می&zwnj;شود</span>');
            }
            //  console.log(parameters);
            if (parameters == null || $.isEmptyObject(parameters)) {
                return transText;
            }
            else {
                for (var prop in parameters) {
                    parameters[prop] = '<span class="' + prop + '">' + parameters[prop] + '</span>';
                }
                return $interpolate(transText)(parameters);
            }
        }

    };
}])
  