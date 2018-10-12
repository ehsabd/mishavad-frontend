
angular.module('app')
.run(['$rootScope', '$anchorScroll','$location', function($rootScope, $anchorScroll, $location){
  $rootScope.docProps={};
    $rootScope.$on("$locationChangeStart", function(){
        $anchorScroll();
        console.log('location change start');
        
        $rootScope.docProps={};
    
        console.log($location.absUrl())
        $rootScope.docProps.canonical=$location.absUrl();
    });
    $rootScope.$on('TitleUpdatedEvent', function (ev, newTitle) {
                console.log("Title Updated Event");
                console.log(newTitle);
                $rootScope.docProps.title = newTitle;
            });
    $rootScope.$on('DescriptionUpdatedEvent', function (ev, newValue) {
                console.log("Desc Updated Event");
                /*NOTE: The following is a trick to strip tags from newValue*/
                var div = document.createElement('div');
                div.innerHTML = newValue;
                $rootScope.docProps.description = div.innerText; //no tags!
            });
}]);
    