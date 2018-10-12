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
