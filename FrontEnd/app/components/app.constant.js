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

