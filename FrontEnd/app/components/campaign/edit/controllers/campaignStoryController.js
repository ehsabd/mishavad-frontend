angular.module('editCampaignModule').controller('CampaignStoryController', ['$scope', '$timeout', 'campaignResource', 'campaignImageResource', '$sanitize', '$anchorScroll',
    function ($scope, $timeout, campaignResource, campaignImageResource, $sanitize, $anchorScroll) {

        $scope.loadImagesMap = function () {
            var imagesMap = {};
            angular.forEach($scope.campaignImages, function (img) {
                this[img.id.toString()] = img;
            }, imagesMap);
            $scope.imagesMap = imagesMap;
        };

        $scope.$watch('campaignId', function () {
            if (!$scope.pageProps.campaignId) { return; }
            $scope.CampaignImage = campaignImageResource($scope.pageProps.campaignId, $scope.access_token);
            $scope.loadCampaignImages();
        });

        $scope.loadCampaignImages = function () {
            $scope.campaignImages = $scope.CampaignImage.query(function () {
                $scope.loadImagesMap();
            });
        }

        $scope.getImageByIndex = function (ind) {
            console.dir('getImageByIndex:'+ind);
            if (!$scope.campaignStoryElements) return;
            var stElm = $scope.campaignStoryElements[ind];
            if (!stElm) return;
            var imgId = stElm.campaignImageId;
            if (!imgId) return;
            if (!$scope.imagesMap) return;
            var img = $scope.imagesMap[imgId];
            if (!img) return;
             console.dir('getImageByIndex:'+ind+'filePath:'+img.filePath);
           
            return img.filePath;
        }

        $scope.leaveEditMode = function (ind) {
            $scope.campaignStoryElements[ind].editMode = false;
        };

        $scope.enterEditMode = function (ind) {
            $scope.campaignStoryElements[ind].editMode = true;
        };

        $scope.initializeStElm = function (ind, elmType, imageData) {
            if (elmType == 'text') {
                $scope.campaignStoryElements[ind] = { editorText: '', text: '', type: 'text', editMode: true };
            }
            if (elmType == 'image') {
                $scope.campaignStoryElements[ind] = { type: 'image', editMode: true, newImage:imageData };
            }
        };

        $scope.saveImageEdit = function (ind) {
            var stElm = $scope.campaignStoryElements[ind];
            stElm.saveWaiting = true;
            var imageId = stElm.campaignImageId;
            var campaignImage = $scope.CampaignImage
                .save({
                    imageId: imageId,
                    base64Image: stElm.imageModel,
                    appendedToStory: (imageId == undefined) //new image
                }, function () {
                    stElm.saveWaiting = false;
                    $scope.loadCampaignImages();
                    $scope.leaveEditMode(ind);
                    if (imageId == undefined) { //new image
                        console.log('Image Uploaded Successfully');
                        $scope.campaignStoryElements[ind].campaignImageId = campaignImage.id;
                        $scope.addAdjacentEmptyElms(ind);
                        $scope.updateStoryElements();
                    } else {
                        console.log('Image Updated Successfully');
                    }
                }, function () {
                    //TODO add failure notice here
                    stElm.saveWaiting = false;
                });
        }

        $scope.saveTextElm = function (ind) {
            var editorText = $sanitize($scope.campaignStoryElements[ind].editorText);
            console.log(editorText);
            var textWithoutWhiteSpaces = editorText
                .replace(/<\/p>/g, '')
                .replace(/<p>/g, '')
                .replace(/<br>/g, '')
                .replace(/&nbsp;/g, '');
            if (textWithoutWhiteSpaces == '') {//only white spaces
                $scope.alerts.push({
                    type: 'danger'
                    , msg: 'در ویرایشگر چیزی نوشته نشده است!'
                });
            } else {
                //Check whether it's a new story element,(Null-coalescing)
                var isNewElement = ($scope.campaignStoryElements[ind].text || '') == '';
                $scope.campaignStoryElements[ind].text = editorText;
                $scope.campaignStoryElements[ind].editMode = false;
                $scope.updateStoryElements();
                if (isNewElement) {
                    $scope.addAdjacentEmptyElms(ind);
                }
            }
        };
        $scope.emptyStoryElement = function (ind) {
            $scope.campaignStoryElements[ind] = {};
        }
        $scope.removeStoryElement = function (ind) {
            //we need to remove adjacent empty story element too;
            $scope.campaignStoryElements.splice(ind, 2);
            $scope.updateStoryElements();
        }
        $scope.cancelTextEdit = function (ind) {
            if (($scope.campaignStoryElements[ind].text || '') == '') { //Null-coalescing
                $scope.emptyStoryElement(ind);
            } else {
                $scope.leaveEditMode(ind);
                $scope.campaignStoryElements[ind].editorText = $scope.campaignStoryElements[ind].text;
            }
        };

        $scope.cancelImageEdit = function (ind) {
            if ($scope.campaignStoryElements[ind].campaignImageId == undefined) {
                $scope.emptyStoryElement(ind);
            } else {
                $scope.campaignStoryElements[ind].newImage = undefined;
                $scope.leaveEditMode(ind);
            }
        };
        $scope.addAdjacentEmptyElms = function (ind) {
            $scope.campaignStoryElements.splice(ind + 1, 0, {});
            $scope.campaignStoryElements.splice(ind, 0, {});
        }
        /*from http://stackoverflow.com/questions/27709040/how-do-i-move-objects-inside-an-ng-repeat-on-button-click */
        // Move list Elms up or down or swap

        $scope.moveElm = function (origin, destination, elmId) {
            var temp = $scope.campaignStoryElements[destination];
            $scope.campaignStoryElements[destination] = $scope.campaignStoryElements[origin];
            $scope.campaignStoryElements[origin] = temp;
            if (origin > destination) {//i.e., move up
                $timeout(function () { //to run after next digest
                    console.log("scroll to elm" + elmId);
                    $anchorScroll.yOffset = 120;
                    $anchorScroll("elm" + elmId);
                }, 0);
            }
            $scope.updateStoryElements();
        };

        /*NOTE because of presence of empty story elements between initialized story elements
        we should move them two positions not one! */
        // Move list Elm Up
        $scope.listElmUp = function (elmIndex, elmId) {
            $scope.moveElm(elmIndex, elmIndex - 2, elmId);

        };

        // Move list Elm Down
        $scope.listElmDown = function (elmIndex, elmId) {
            $scope.moveElm(elmIndex, elmIndex + 2, elmId);
        };

        $scope.fileInputLoaded = function (ind, imageData) {
           $scope.campaignStoryElements[ind].newImage = imageData;
        };

        $scope.updateStoryElements = function () {
            var elms = $scope.campaignStoryElements;
            var strArray = [];
            for (var i = 0; i < elms.length; i++) {
                if (!elms[i].type) continue;
                if (elms[i].type == 'image') {
                    if (elms[i].campaignImageId) {
                        strArray.push(['[campaignImageId:', elms[i].campaignImageId, ']'].join(''));
                    }
                } else {
                    strArray.push(elms[i].text)
                }
            }
            /*NOTE: we just update campaignResInstance and do $save. Very neat. CampaignBasic should also be updated like this in future*/
            /*TODO: This updates campaignBasics too. There should be a prompt when someone changes tab that says changes in the model will be discarded. Then we should reload the model by query and move to the tab*/
            $scope.campaignResInstance.story = JSON.stringify(strArray);

            $scope.waitingAlertInd = $scope.alerts.push({
                type: 'waiting',
                msg: 'در حال آپدیت'
            }) - 1;

            $scope.campaignResInstance.$save().then(function () {
                $scope.closeAlert($scope.waitingAlertInd);
            }, function () {
                $scope.closeAlert($scope.waitingAlertInd);
                var newAlert = {
                    type: 'danger'
                    , msg: 'آپدیت موفقیت آمیز نبود. لطفا دوباره سعی کنید'
                    , promiseFunc: function () { return $scope.campaignResInstance.$save(); }
                };
                $scope.alerts.push(newAlert);
            }
            );
        }

        $scope.onPaste = function (e, pasteContent) {
            //TODO fix this
            //TODO remove style attr
            //TODO remove dir attrs
            //TODO remove lang attrs
            //TODO Convert MsoListParagraphCxSpFirst classes and similar to ol or ul tags

            return pasteContent;
        };

        $scope.isFirstInitializedSt = function (ind) {
            //we ignore the first empty story element
            return ind == 1;
        }

        $scope.isLastInitializedSt = function (ind) {
            //we ignore the last empty story element
            return ind == ($scope.campaignStoryElements.length - 2);
        }

    }]);