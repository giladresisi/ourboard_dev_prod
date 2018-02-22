angular.module('ourBoard').directive('createEditActivityDrtv',
    function (dataSrvc, $rootScope, Upload, ENV) {
        return {
            restrict: 'E',
            templateUrl: 'templates/createEditActivityView.html',
            link: function ($scope, element, attrs) {
                $scope.errors = [];
                $scope.edit = ($rootScope.activeModal.args.activityId != undefined);
                $scope.imgChange = false;
                $scope.oldTitle = '';
                $scope.freeTextId = ENV.FREE_TEXT_ID;

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
                        additionalInfo: '',
                        image: undefined
                    };
                    if ($scope.edit) {
                        $scope.activityData = convertDataFormat($rootScope.activeModal.args);
                        if ($scope.activityData.imageUrl) {
                            $scope.activityData.image = $scope.activityData.imageUrl;
                            $scope.imageBtnText = 'החלף תמונה';
                        }
                    }
                }

                $scope.createActivity = function () {
                    $scope.errors = [];

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

                    if ($scope.errors.length === 0) {
                        var args = undefined, fd = undefined, apiType = '';
                        var title = $scope.activityData.titleId === $scope.freeTextId ? $scope.activityData.freeText : _.findWhere($scope.titleOptions, {_id: $scope.activityData.titleId}).display;
                        if ($scope.activityData.image) {
                            fd = new FormData();
                            fd.append($scope.activityData.image.name, $scope.activityData.image);
                            fd.append('title', title);
                            fd.append('location', $scope.activityData.location);
                            fd.append('extraDetails', $scope.activityData.additionalInfo);
                            fd.append('datetimeMS', moment($scope.activityData.datetimeValue).valueOf());
                            if ($scope.edit) {
                                fd.append('activityId', $rootScope.activeModal.args.activityId);
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
                            args = {
                                title: title,
                                location: $scope.activityData.location,
                                extraDetails: $scope.activityData.additionalInfo,
                                datetimeMS: moment($scope.activityData.datetimeValue).valueOf()
                            };
                            if ($scope.edit) {
                                args.imgChange = $scope.imgChange;
                                args.activityId = $rootScope.activeModal.args.activityId;
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
                    $scope.activityData.image = null;
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
                                $scope.activityData.image = resizedFile;
                            });
                        });
                    }
                };

                $scope.restoreOrigImage = function() {
                    if ($scope.activityData.imageUrl) {
                        $scope.activityData.image = $scope.activityData.imageUrl;
                        $scope.imageBtnText = 'החלף תמונה';
                    }
                    $scope.imgChange = false;
                };

                function convertDataFormat(obj) {
                    var titleAndId = convertNameAndId(obj);
                    return {
                        freeText: titleAndId.freeText,
                        titleId: titleAndId.titleId,
                        location: obj.location,
                        additionalInfo: obj.extraDetails,
                        datetimeValue: obj.datetimeMS,
                        imageUrl: (obj.imgName == undefined) ? undefined : ENV.S3_URL + '/' + $rootScope.activeModal.args.activityId + '/' + obj.imgName // Same as in create API
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
