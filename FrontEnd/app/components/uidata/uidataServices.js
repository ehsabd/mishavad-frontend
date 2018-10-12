angular.module("uidataModule", ["ngResource"])
    .factory('uidataResource', ['$resource', 'constantsUtils',
        function ($resource, constantsUtils) {
            return $resource(constantsUtils.API_V1_URL + '/UiData/:pageName',
                { pageName: '@pageName' });
        }]);