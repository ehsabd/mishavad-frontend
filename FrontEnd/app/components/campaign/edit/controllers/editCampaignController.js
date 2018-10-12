angular.module('editCampaignModule')
    .controller('EditCampaignController', ['$scope', '$routeParams', '$location', '$anchorScroll', '$timeout',
        'campaignResource', 'uidataResource',
        function ($scope, $routeParams, $location, $anchorScroll, $timeout,
            campaignResource, uidataResource) {
            
            //alerts
            $scope.alerts = [];
            $scope.cornerAlerts = {};

            $scope.dirtyForms = {basic:{
                                    type: 'danger'
                                    , msg: 'تغییرات مشخصات کمپین ذخیره نشده اند!'
                                    , isDirty : false
                                    , isDeselected : false
                                },
                                story:{
                                    type: 'danger'
                                    , msg: ''
                                    , isDirty : false
                                    , isDeselected : false
                                }
                            };

            $scope.closeAlert = function (i) {
                $scope.alerts.splice(i, 1);
            };
            $scope.closeCornerAlert = function (key) {
                $scope.cornerAlerts[key]=undefined;
            };

            $scope.tryAgain = function (index, promise) {
                if (promise) {
                    promise.then(function () {
                        $scope.closeAlert(index);
                    });
                }
            };
            $scope.waitingAlertInd = $scope.alerts.push({
                type: 'waiting',
                msg: 'لطفا چند لحظه صبر :)'
            }) - 1;

            //To allow for prototypical inheritance (problem by ng-if or tabset scopes)
            $scope.pageProps = {
                activeTab: 0,
                campaignId: $routeParams.campaignId
            };

            //get uidata for EditCampaign page and then Campaign data
            uidataResource.get({ pageName: 'EditCampaign' }, function (data) {

                $scope.uidata = data;
                $scope.campaignCity = {
                    availableOptions: []
                };
                $scope.campaignProvince = {
                    selectProvince: null
                    , availableOptions: $scope.uidata.cities
                };
                $scope.campaignType = {
                    availableOptions: $scope.uidata.campaignCategories
                };
                $scope.campaignLevel = {
                    availableOptions: $scope.uidata.projectStages
                };
                console.log($scope.campaignResInstance);
                $scope.pageProps.uidataLoaded = true;

            }, function (data) { });

            //Scroll to top on tab change
            $scope.$watch('pageProps.activeTab', function () {
                $anchorScroll();
            });

            $scope.$watch('pageProps.uidataLoaded && isLoggedIn', function () {
                if (!$scope.pageProps.uidataLoaded || !$scope.isLoggedIn) { return; }
                $scope.campaignStoryElements = [{}];

                $scope.CampaignRes = campaignResource($scope.access_token);
                if ($scope.pageProps.campaignId == undefined) {
                    $scope.newCampaign = true;
                    $scope.campaignResInstance = new $scope.CampaignRes();
                    $scope.closeAlert($scope.waitingAlertInd);
                } else {
                    $scope.campaignResInstance = $scope.CampaignRes.get(
                        { id: $scope.pageProps.campaignId },
                        function (data) {
                            //remove city to avoid confusion
                            $scope.campaignResInstance.city = undefined;
                            
                            $scope.extractStoryElements(data);                        

                            //may be useful to undo changes!
                            $scope.oldCampaign = angular.copy($scope.campaignResInstance);
                            $scope.closeAlert($scope.waitingAlertInd);
                        },
                        function (data) {
                            $scope.closeAlert($scope.waitingAlertInd);
                            $scope.alerts.push({
                                type: 'danger'
                                , msg: 'اتصال برقرار نشد لطفا دوباره تلاش کنید.'
                            });
                    });
                }
            });

           

            $scope.extractStoryElements = function(data){
                                //     console.log(data.storyElements);
                                        for (var i = 0; i < data.storyElements.length; i++) {
                                            var stElm = data.storyElements[i].trim();
                                            var newElm = undefined;
                                            if (/^\[campaignImageId:.*]$/.test(stElm)) {
                                                newElm = {
                                                    type: 'image',
                                                    editMode: false,
                                                    campaignImageId: stElm.replace(/\D+/g, '')
                                                };
                                            } else {
                                                newElm = { type: 'text', editMode: false, text: stElm, editorText: stElm };
                                            }
                                            if (newElm) {
                                                $scope.campaignStoryElements.push(newElm);
                                                //Add empty story element adjacent to this element to provide ease for editing
                                                $scope.campaignStoryElements.push({});
                                            }
                                        }

                                        //remove unnecessary data to reduce $save payload
                                        data.storyElements = undefined;
            }

            $scope.setStoryTab = function () {
                $scope.pageProps.activeTab = 1;
            };

            
           

             $scope.tabDeselected = function ($event, tabName) {
               $scope.dirtyForms[tabName].isDeselected=true;
            }

            $scope.tabSelected = function ($event, tabName) {
                $scope.dirtyForms[tabName].isDeselected=false;
            }

             

        }]);