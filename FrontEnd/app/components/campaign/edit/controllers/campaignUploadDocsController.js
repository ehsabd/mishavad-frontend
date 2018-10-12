angular.module('editCampaignModule').controller('CampaignUploadDocsController', ['$scope', 'campaignDocumentResource', 'userDocumentResource', function ($scope, campaignDocumentResource, userDocumentResource) {
    $scope.$watch('pageProps.uidataLoaded && isLoggedIn && pageProps.campaignId', function (newValue, oldValue) {
        console.log(newValue);
        if (!newValue) { return; }

        $scope.CampaignDocRes = campaignDocumentResource($scope.pageProps.campaignId, $scope.access_token);
        //Load docs
        $scope.campaignDocQueryInstance = $scope.CampaignDocRes.query(
            function () { },
            function () {
                $scope.alerts.push({
                    type: 'danger'
                    , msg: 'اتصال برای بارگذاری مدارک کمپین برقرار نشد لطفا دوباره تلاش کنید.'
                });
            }
        );

        $scope.UserDocRes = userDocumentResource('ThisUser', $scope.access_token);
        //Load docs
        $scope.userDocQueryInstance = $scope.UserDocRes.query(
            function () { },
            function () {
                $scope.alerts.push({
                    type: 'danger'
                    , msg: 'اتصال برای بارگذاری مدارک هویتی برقرار نشد لطفا دوباره تلاش کنید.'
                });
            }
        );
    });

    $scope.uploadDoc = function (docType) {
        var queryInstance;
        var Res;
        var newObj;
        if (docType == 'campaignDoc') {
            queryInstance = $scope.campaignDocQueryInstance;
            Res = $scope.CampaignDocRes;
            newObj = $scope.newCampaignDocument;
        } else if (docType == 'userDoc') {
            queryInstance = $scope.userDocQueryInstance;
            Res = $scope.UserDocRes;
            newObj = $scope.newUserDocument;
        }
        if (queryInstance) {
            var ind = queryInstance.push(
                new Res(newObj)
            ) - 1;
            newObj._isWaiting=true;
            queryInstance[ind].$save(function () {
                newObj.description='';
                newObj._src=undefined;
                newObj._isWaiting=false;
            }, function () {
                console.log("Error uploading doc");
                queryInstance.splice(ind,1);
                newObj._isWaiting=false;
            });
        }
    }
}]);