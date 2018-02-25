angular.module('ourBoard').directive('createEditActivityDrtv',
    function (dataSrvc, $rootScope, Upload, ENV) {
        return {
            restrict: 'E',
            templateUrl: 'templates/createEditActivityView.html',
            link: function ($scope, element, attrs) {
                $scope.errors = [];
                $scope.edit = ($rootScope.activeModal.args._id != undefined);
                $scope.imgChange = false;
                $scope.oldTitle = '';
                $scope.freeTextId = ENV.FREE_TEXT_ID;
                $scope.orgActivity = {};
                $scope.image = undefined;
                $scope.activityData = {};

                $scope.titleOptions = [];
                if (!$scope.edit) {
                    $scope.titleOptions.push({
                        _id: null,
                        display: 'בחר כותרת לפעילות'
                    });
                }
                dataSrvc.api({
                    type: 'getActivityTitles'
                }).then(function (res) {
                    $scope.titleOptions = $scope.titleOptions.concat(res.data);
                    $scope.titleOptions.push({
                        _id: $scope.freeTextId,
                        display: 'טקסט חופשי'
                    });
                });

                initData();

                function initData() {
                    $scope.imageBtnText = 'הוסף תמונה';
                    $scope.activityData = {
                        datetimeValue : new Date(),
                        titleId: null,
                        freeText: '',
                        location: '',
                        additionalInfo: ''
                    };
                    if ($scope.edit) {
                        $scope.activityData = convertDataFormat($rootScope.activeModal.args);
                        if ($scope.activityData.imageUrl) {
                            $scope.image = $scope.activityData.imageUrl;
                            $scope.imageBtnText = 'החלף תמונה';
                        }
                        $scope.orgActivity = $scope.activityData;
                    }
                }

                $scope.createEditActivity = function () {
                    $scope.errors = [];
                    var args = undefined, fd = undefined, apiType = '';
                    var title = $scope.activityData.titleId === $scope.freeTextId ? $scope.activityData.freeText : _.findWhere($scope.titleOptions, {_id: $scope.activityData.titleId}).display;

                    if(!$scope.activityData.titleId){
                        $scope.errors.push('אנא הזן כותרת תקינה לאירוע');
                    }

                    if ($scope.activityData.titleId === $scope.freeTextId &&  ($scope.activityData.freeText === '' || $scope.activityData.freeText === undefined || $scope.activityData.freeText.length < 3)) {
                        $scope.errors.push('אנא הזן כותרת תקינה לאירוע');
                    }

                    if (!$scope.activityData.datetimeValue) {
                        $scope.errors.push('אנא בחר תאריך ושעה לאירוע');
                    }

                    else if(moment($scope.activityData.datetimeValue).isSameOrBefore(moment())){
                        $scope.errors.push('תאריך האירוע לא יכול להיות בעבר');
                    }

                    if (!$scope.activityData.location || $scope.activityData.location.length < 3) {
                        $scope.errors.push('אנא הזן את מיקום האירוע');
                    }

                    if ($scope.edit && !$scope.imgChange && ($scope.activityData == $scope.orgActivity) && ($scope.oldTitle == title)) {
                        $scope.errors.push('אנא שנה פרט אחד לפחות או לחץ ביטול');
                    }

                    if ($scope.errors.length === 0) {
                        if ($scope.image && $scope.imgChange) {
                            fd = new FormData();
                            fd.append($scope.image.name, $scope.image);
                            if ($scope.oldTitle != title) {
                                fd.append('title', title);
                            }
                            if ($scope.activityData.location != $scope.orgActivity.location) {
                                fd.append('location', $scope.activityData.location);
                            }
                            if ($scope.activityData.additionalInfo != $scope.orgActivity.additionalInfo) {
                                fd.append('extraDetails', $scope.activityData.additionalInfo);
                            }
                            if ($scope.activityData.datetimeValue != $scope.orgActivity.datetimeValue) {
                                fd.append('datetimeMS', moment($scope.activityData.datetimeValue).valueOf());
                            }
                            if ($scope.edit) {
                                fd.append('activityId', $rootScope.activeModal.args._id.toString());
                                apiType = 'updateActivityImage';
                            } else {
                                apiType = 'createNewActivityImage';
                            }
                            dataSrvc.api({
                                type: apiType,
                                args: args,
                                fd: fd
                            }).then(function (res) {
                                closeModal(true);
                            });
                        } else {
                            args = {};
                            if ($scope.oldTitle != title) {
                                args.title = title;
                            }
                            if ($scope.activityData.location != $scope.orgActivity.location) {
                                args.location = $scope.activityData.location;
                            }
                            if ($scope.activityData.additionalInfo != $scope.orgActivity.additionalInfo) {
                                args.extraDetails = $scope.activityData.additionalInfo;
                            }
                            if ($scope.activityData.additionalInfo != $scope.orgActivity.additionalInfo) {
                                args.datetimeMS = moment($scope.activityData.datetimeValue).valueOf();
                            }
                            if ($scope.edit) {
                                args.imgChange = $scope.imgChange;
                                args.activityId = $rootScope.activeModal.args._id.toString();
                                apiType = 'updateActivity';
                            } else {
                                apiType = 'createNewActivity';
                            }
                            dataSrvc.api({
                                type: apiType,
                                args: args,
                                fd: fd
                            }).then(function (res) {
                                closeModal(true);
                            });
                        }
                    }
                };

                $scope.cancel = function () {
                    closeModal(false);
                };

                $scope.clearImage = function() {
                    $scope.image = null;
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
                                $scope.image = resizedFile;
                            });
                        });
                    }
                };

                $scope.restoreOrigImage = function() {
                    if ($scope.activityData.imageUrl) {
                        $scope.image = $scope.activityData.imageUrl;
                        $scope.imageBtnText = 'החלף תמונה';
                    }
                    $scope.imgChange = false;
                };

                function convertDataFormat(obj) {
                    var titleAndId = convertTitleAndId(obj);
                    return {
                        freeText: titleAndId.freeText,
                        titleId: titleAndId.titleId,
                        location: obj.location,
                        additionalInfo: obj.extraDetails,
                        datetimeValue: obj.datetimeMS,
                        imageUrl: (obj.imgName == undefined) ? undefined : ENV.S3_URL + '/' + $rootScope.activeModal.args._id.toString() + '/' + obj.imgName // Same as in create API
                    }
                };

                function convertTitleAndId(obj) {
                    var titleId = $scope.freeTextId;
                    var freeText = '';
                    for (i = 0; i < $scope.titleOptions.length - 1; i++) {
                        if (obj.title == $scope.titleOptions[i].display) {
                            titleId = $scope.titleOptions[i]._id;
                            $scope.oldTitle = $scope.titleOptions[i].display;
                            break;
                        }
                    }
                    if (titleId == $scope.freeTextId) {
                        freeText = obj.title;
                        $scope.oldTitle = freeText;
                    }
                    return {
                        freeText: freeText,
                        titleId: titleId
                    }
                };

                function closeModal(refreshScope) {
                    $scope.errors = [];
                    $rootScope.activeModal.hide();
                    if (refreshScope) {
                        if ($scope.edit) {
                            $rootScope.$broadcast('ACTIVITY_EDITED');
                        } else {
                            $rootScope.$broadcast('REFRESH_ACTIVITY_BOARD');
                        }
                    }
                };
            }
        }
    });
