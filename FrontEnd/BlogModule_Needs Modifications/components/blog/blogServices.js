angular.module('app.blog')
    .factory('blogPostResource', ['$resource', 'ConstantsUtils', function ($resource, ConstantsUtils) {
        return function (token) {
            return $resource(ConstantsUtils.API_V1_URL + '/blogposts/:id', { id: '@id' }, {
                save: {
                    method: 'POST'
                    , headers: {
                        'Authorization': 'Bearer ' + token
                    }
                },
                update: {
                    method: 'POST'
                    , headers: {
                        'Authorization': 'Bearer ' + token,
                    }
                },
                query_newest: {
                    method: 'GET'
                    , params:{newest:true}
                    , isArray:true
                },
            }, { cancellable: true }
            );
        };
    }])
    .factory('postPagesResource', ['$resource', 'ConstantsUtils',
    function ($resource, ConstantsUtils) {
        return function (url) {
            if (url == undefined) {
                url = ConstantsUtils.API_V1_URL + '/blogposts';
            }
            var res = $resource(url, {},
                {
                    'get': {
                        method: 'GET'
                    }
                }
            );
            return res;
        };
    }])