angular.module('app').controller('ContactController',['$scope','$http','ConstantsUtils', function($scope,$http,ConstantsUtils){

    $scope.sendMessage = function(){
        $http.post(ConstantsUtils.API_V1_URL+'/contact', $scope.contactModel )
             .then(function(){
                 $scope.isMessageSent=true;
             }, function(){

             });
    }
}]);