angular.module('app.contribute')
    .directive('paymentButtons', function () {
        return {
            template: '<label class="btn btn-default" ng-model="payMethod" uib-btn-radio="\'shetab\'"' +
            ' ng-bind-html="\'_ui_key_PayShetab\' | xlat"></label>' +
            '<label class="btn btn-default" ng-click="openLogin();" ng-model="payMethod" uib-btn-radio="\'mishavad\'"' +
            'ng-bind-html="\'_ui_key_PayMishavad\' | xlat"></label>'
        }
    })
    .directive('creditButtons', function () {
        return {
            template: '<label class="btn btn-success" ng-model="creditType" uib-btn-radio="\'َanonymous\'" uncheckable>' +
            'دوست دارم' +
            '<strong>' +
            'بدون نام' +
            '</strong>(Anonymous)' +
            'کمک کنم</label>' +
            '<label class="btn btn-success" ng-model="creditType" uib-btn-radio="\'realname\'" uncheckable>' +
            '<strong>' +
            ' نام واقعی ام' +
            '</strong>' +
            'نمایش داده شود</label>' +
            '<label class="btn btn-success" ng-model="creditType" uib-btn-radio="\'nickname\'" uncheckable>' +
            '<strong>' +
            'نام مستعارم' +
            '</strong>' +
            'نمایش داده شود</label>'
        }
    });
