angular.module('campaignResourceModule', ['ngResource'])
    .factory('campaignResource', ['$resource', 'constantsUtils', function ($resource, constantsUtils) {
        return function (token) {
            var actions;
            var headers = {
                'Authorization': 'Bearer ' + token
            };
            if (token != undefined) {
                actions = {
                    get: {
                        method: 'GET'
                        , headers: headers
                    },
                    save: {
                        method: 'POST'
                        , headers: headers
                    },
                    query_user_campaigns: {
                        method: 'GET'
                        , headers: headers
                        , params: { user_campaigns: true }
                        , isArray: true
                    },
                    soft_delete: {
                        method: 'POST'
                        , headers: headers
                        , params: { soft_delete: true }
                        , transformRequest: constantsUtils.softDeleteTransform
                    }

                };
            }
            return $resource(constantsUtils.API_V1_URL + '/campaigns/:id', { id: '@id' }, actions);
        };
    }])
    .factory('rewardResource', ['$resource', 'constantsUtils', function ($resource, constantsUtils) {
        return function (campaignId, token) {
            return $resource(constantsUtils.API_V1_URL + '/campaigns/:campaignId/rewards/:rewardId', { campaignId: campaignId, rewardId: '@id' }, {
                save: {
                    method: 'POST'
                    , headers: {
                        'Authorization': 'Bearer ' + token
                    }
                },
                soft_delete: {
                    method: 'POST'
                    , headers: {
                        'Authorization': 'Bearer ' + token
                    }
                    , params: { soft_delete: true }
                    , transformRequest: constantsUtils.softDeleteTransform
                }
            }, { cancellable: true }
            );
        }
    }])
    .factory('campaignImageResource', ['$resource', 'constantsUtils', function ($resource, constantsUtils) {
    return function (campaignId, token) {
        return $resource(constantsUtils.API_V1_URL + '/campaigns/:campaignId/images/:imageId', { 'campaignId': campaignId, 'imageId': '@imageId' }, {
            save: {
                method: 'POST'
                , headers: {
                    'Authorization': 'Bearer ' + token
                }
            },
            update: {
                method: 'POST'
                , headers: {
                    'Authorization': 'Bearer ' + token
                }
            }
        }
        );
    }
}])
.factory('campaignDocumentResource', ['$resource','constantsUtils', function($resource, constantsUtils){
    return function(campaignId, token){
         return $resource(constantsUtils.API_V1_URL + '/documents/campaign/:campaignId/:id', { 'campaignId': campaignId, 'id': '@id' }, {
            save: {
                method: 'POST'
                , headers: {
                    'Authorization': 'Bearer ' + token
                }
            },
            update: {
                method: 'POST'
                , headers: {
                    'Authorization': 'Bearer ' + token
                }
            },
            query: {
                method: 'GET'
                , headers: {
                    'Authorization': 'Bearer ' + token
                },isArray:true
            }
        }
        );
    }
}])
.factory('userDocumentResource', ['$resource','constantsUtils', function($resource, constantsUtils){
    return function(userId, token){
         return $resource(constantsUtils.API_V1_URL + '/documents/user/:userId/:id', { 'userId': userId, 'id': '@id' }, {
            save: {
                method: 'POST'
                , headers: {
                    'Authorization': 'Bearer ' + token
                }
            },
            update: {
                method: 'POST'
                , headers: {
                    'Authorization': 'Bearer ' + token
                }
            },
            query: {
                method: 'GET'
                , headers: {
                    'Authorization': 'Bearer ' + token
                },isArray:true
            },
        }
        );
    }
}]);