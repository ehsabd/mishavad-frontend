/*
TODOs:
Canvas have problem with changing tab. So we should redraw it when going back to campaign details tab
 */
angular.module('editCampaignModule').controller('CampaignBasicController', ['$scope', '$timeout',
    '$anchorScroll',
    function ($scope, $timeout, $anchorScroll) {

        

        $scope.$watch('campaignResInstance.province', function (newVal, oldVal) {
            $scope.changeOptionProvince();
        });
        $scope.$watch('campaignProvince', function (newVal, oldVal) {
            $scope.changeOptionProvince();
        });

        $scope.changeOptionProvince = function () {
            if ($scope.campaignCity == undefined) {
                return;
            }
            $scope.campaignCity.availableOptions = [];
            if ($scope.campaignResInstance == undefined) {
                return;
            }
            angular.forEach($scope.campaignProvince.availableOptions, function (value
            ) {
                if (value.provinceName == $scope.campaignResInstance.province) {
                    this.push(value);
                }

            }, $scope.campaignCity.availableOptions);
            var cityBelongsToList = false;
            //make cityId undefined if it does not belong to availableOptions
            if ($scope.campaignCity == undefined) { return; }
            angular.forEach($scope.campaignCity.availableOptions, function (value) {
                if (value.id == $scope.campaignResInstance.cityId) {
                    cityBelongsToList = true;
                    return;
                }
            });
            if (!cityBelongsToList) {
                $scope.campaignResInstance.cityId = undefined;
            };
        };

        $scope.dropboxitemselected = function (value) {
            $scope.itemselected = value;
        }

        
        $scope.addNewTag = function () {
            var tag = $scope.campaignResInstance._newTag;
            $scope.tagSubmitted = true;
            var p = 0;
            if (tag.trim() != "") {
                for (var i = 0; i < $scope.campaignResInstance.tags.length; i++) {
                    if ($scope.campaignResInstance.tags[i] == tag) p = 1;
                }
                if (p == 0) $scope.campaignResInstance.tags.push(tag);
            }
            $scope.campaignResInstance._newTag = "";
        }

        $scope.populateTags=function(){
            var tag = $scope.campaignResInstance._newTag;
            if (tag.trim() != ""){
                
            }
        }
        //end add tag

        $scope.removeTag = function (id) {
            $scope.campaignResInstance.tags.splice(id, 1);
        }

        $scope.enterCropThumb = function () {
            $scope.campaignResInstance.thumbCropMode = true;
            $scope.campaignResInstance.cropDataURI = $scope.campaignResInstance.thumbnail;
        };

        $scope.fileInputLoaded = function (imageData) {
            $scope.campaignResInstance.thumbnail = imageData;
        };


        $scope.updateCampBasic = function () {
            if ($scope.tagSubmitted) return;
            $scope.campBasicWaiting = true;
            //TODO: this is much more complicated that just tagline (B)
            if ($scope.campaignResInstance.tagline != "") {
                var isUpdate = $scope.campaignResInstance.id != undefined;
                $scope.campaignResInstance.$save(function (data) {
                    if (isUpdate) {
                        $scope.basicForm.$setPristine();
                        $scope.setStoryTab();
                    } else {
                        $scope.pageProps.campaignId = $scope.campaignResInstance.id;
                        //scroll to top so that the user notices change of the header to 'Complete Campaign'
                        $anchorScroll();
                    }
                    $scope.campBasicWaiting = false;
                }, function (data) {
                    $scope.campBasicWaiting = false;
                    if (isUpdate) {
                        var message = 'آپدیت موفقیت آمیز نبود. لطفا دوباره سعی کنید';
                    } else {
                        /*TODO: add other errors info if needed such as required props
                        You might not have to add this info if you inform the client by form validation
                        */
                        console.log(data);
                        var message = 'خطا در ایجاد کمپین';
                    }
                    $scope.alerts.push({
                        type: 'danger'
                        , msg: message
                    });
                });
            }
            else //add class shake
                $scope.submitted = true;

            //remove class shake
            $timeout(function () {
                $scope.submitted = false;
            }, 1000);
        };

        $scope.$watch('basicForm.$dirty', function () {
            $scope.dirtyForms.basic.isDirty = $scope.basicForm.$dirty && $scope.campaignResInstance.id != undefined
        });

    }]);


