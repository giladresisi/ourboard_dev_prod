angular.module('ourBoard').directive('editActivityDrtv',
    function (dataSrvc, $rootScope, Upload, $stateParams, ENV) {
        return {
            restrict: 'E',
            templateUrl: 'templates/createEditNewActivityView.html',
            link: function ($scope, element, attrs) {
                $scope.errors = [];
                $scope.edit = true;
                $scope.imgChange = false;
                $scope.oldTitle = '';

                initData();

                function initData() {
                    $scope.nameOptions = [
                        {
                            id: '1',
                            display : 'רכיבת סוסים'
                        },
                        {
                            id: '2',
                            display : 'פגישה בפארק'
                        },
                        {
                            id: '3',
                            display : 'הליכת ערב'
                        },
                        {
                            id: 'FREE_TEXT',
                            display : 'טקסט חופשי'
                        }
                    ];
                    $scope.imageBtnText = 'הוסף תמונה';
                    $scope.newActivityData = convertDataFormat($rootScope.activeModal.args);
                    if ($scope.newActivityData.imageUrl) {
                        $scope.newActivityData.image = $scope.newActivityData.imageUrl;
                        $scope.imageBtnText = 'החלף תמונה';
                    }
                    $scope.imgChange = false;
                }

                $scope.updateActivity = function () {
                    $scope.errors = [];

                    if(!$scope.newActivityData.nameId){
                        $scope.errors.push('אנא הזן שם אירוע תקין');
                    }

                    if ($scope.newActivityData.nameId === 'FREE_TEXT' &&  ($scope.newActivityData.freeName === '' || $scope.newActivityData.freeName === undefined || $scope.newActivityData.freeName < 3)) {
                        $scope.errors.push('אנא הזן שם אירוע תקין');
                    }

                    if (!$scope.newActivityData.datetimeValue) {
                        $scope.errors.push('אנא בחר תאריך ושעה לאירוע');
                    }

                    else if(moment($scope.newActivityData.datetimeValue).isSameOrBefore(moment())){
                        $scope.errors.push('תאריך האירוע לא יכול להיות בעבר');
                    }

                    if (!$scope.newActivityData.location || $scope.newActivityData.location.length < 3) {
                        $scope.errors.push('אנא הזן את מיקום האירוע');
                    }

                    if ($scope.errors.length === 0) {
                        var title = $scope.newActivityData.nameId === 'FREE_TEXT' ? $scope.newActivityData.freeName : _.findWhere($scope.nameOptions, {id: $scope.newActivityData.nameId}).display;
                        var args = undefined, fd = undefined;
                        if ($scope.newActivityData.image && $scope.imgChange) { // No upload required unless added / replaced / removed and re-added image
                            fd = new FormData();
                            fd.append($scope.newActivityData.image.name, $scope.newActivityData.image); // No need to append imgChange since it must be true here
                            fd.append('title', title);
                            fd.append('location', $scope.newActivityData.location);
                            fd.append('extraDetails', $scope.newActivityData.additionalInfo);
                            fd.append('datetimeMS', moment($scope.newActivityData.datetimeValue).valueOf());
                            fd.append('activityId', $stateParams.activityId);
                            dataSrvc.api({
                                type: 'updateActivityImage',
                                args: args,
                                fd: fd
                            }).then(function (res) {
                                initData();
                                $rootScope.activeModal.hide();
                                $rootScope.$broadcast('ACTIVITY_EDITED');
                            });
                        } else {
                             args = {
                                imgChange: $scope.imgChange,
                                title: title,
                                location: $scope.newActivityData.location,
                                extraDetails: $scope.newActivityData.additionalInfo,
                                datetimeMS: moment($scope.newActivityData.datetimeValue).valueOf(),
                                activityId: $stateParams.activityId
                            };
                            dataSrvc.api({
                                type: 'updateActivity',
                                args: args,
                                fd: fd
                            }).then(function (res) {
                                initData();
                                $rootScope.activeModal.hide();
                                $rootScope.$broadcast('ACTIVITY_EDITED');
                            });
                        }
                    }
                };

                $scope.cancel = function () {
                    $scope.errors = [];
                    initData();
                    $rootScope.activeModal.hide();
                };

                $scope.clearImage = function() {
                    $scope.newActivityData.image = null;
                    $scope.imageBtnText = 'הוסף תמונה';
                    $scope.imgChange = true;
                };

                $scope.selectImg = function(file) {
                    if (file) {
                        $scope.imageBtnText = 'החלף תמונה';
                        $scope.imgChange = true;
                        Upload.imageDimensions(file).then(function(dimensions) {
                            var resizeObj = {}
                            var ratio = dimensions.width / dimensions.height;
                            if (dimensions.width < dimensions.height) {
                                resizeObj.width = 500 * ratio;
                                resizeObj.height = 500;
                            }
                            Upload.resize(file, resizeObj).then(function(resizedFile) {
                                $scope.newActivityData.image = resizedFile;
                            });
                        });
                    }
                };

                $scope.restoreOrigImage = function() {
                    if ($scope.newActivityData.imageUrl) {
                        $scope.newActivityData.image = $scope.newActivityData.imageUrl;
                        $scope.imageBtnText = 'החלף תמונה';
                    }
                    $scope.imgChange = false;
                };

                function convertDataFormat(obj) {
                    var nameAndId = convertNameAndId(obj);
                    return {
                        freeName: nameAndId.freeName,
                        nameId: nameAndId.nameId,
                        location: obj.location,
                        additionalInfo: obj.extraDetails,
                        datetimeValue: obj.datetimeMS,
                        imageUrl: (obj.imgName == undefined) ? undefined : ENV.S3_URL + '/' + $stateParams.activityId + '/' + obj.imgName // Same as in create API
                    }
                };

                function convertNameAndId(obj) {
                    var nameId = 'FREE_TEXT';
                    var freeName = '';
                    for (i = 0; i < $scope.nameOptions.length - 1; i++) {
                        if (obj.title == $scope.nameOptions[i].display) {
                            nameId = $scope.nameOptions[i].id;
                            $scope.oldTitle = $scope.nameOptions[i].display;
                            break;
                        }
                    }
                    if (nameId == 'FREE_TEXT') {
                        freeName = obj.title;
                        $scope.oldTitle = freeName;
                    }
                    return {
                        freeName: freeName,
                        nameId: nameId
                    }
                };
            }
        }
    });
