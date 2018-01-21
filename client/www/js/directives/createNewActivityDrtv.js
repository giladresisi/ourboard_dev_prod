angular.module('ourBoard').directive('createNewActivityDrtv',
    function (dataSrvc, $rootScope, Upload) {
        return {
            restrict: 'E',
            templateUrl: 'templates/createEditNewActivityView.html',
            link: function ($scope, element, attrs) {
                $scope.errors = [];

                initData();

                function initData() {
                    $scope.newActivityData = {
                        datetimeValue : new Date(),
                        nameId: null,
                        freeName: '',
                        location: '',
                        additionalInfo: '',
                        image: undefined
                    };
                    $scope.nameOptions = [
                        {
                            id: null,
                            display : 'בחר כותרת לפעילות'
                        },
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
                }

                $scope.createActivity = function () {
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
                        if ($scope.newActivityData.image) {
                            fd = new FormData();
                            fd.append($scope.newActivityData.image.name, $scope.newActivityData.image);
                            fd.append('title', title);
                            fd.append('location', $scope.newActivityData.location);
                            fd.append('extraDetails', $scope.newActivityData.additionalInfo);
                            fd.append('datetimeMS', moment($scope.newActivityData.datetimeValue).valueOf());
                            dataSrvc.api({
                                type: 'createNewActivityImage',
                                args: args,
                                fd: fd
                            }).then(function (res) {
                                initData();
                                $rootScope.activeModal.hide();
                                $rootScope.$broadcast('REFRESH_ACTIVITY_BOARD');
                            });
                        } else {
                            args = {
                                title: title,
                                location: $scope.newActivityData.location,
                                extraDetails: $scope.newActivityData.additionalInfo,
                                datetimeMS: moment($scope.newActivityData.datetimeValue).valueOf()
                            };
                            dataSrvc.api({
                                type: 'createNewActivity',
                                args: args,
                                fd: fd
                            }).then(function (res) {
                                initData();
                                $rootScope.activeModal.hide();
                                $rootScope.$broadcast('REFRESH_ACTIVITY_BOARD');
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
                };

                $scope.selectImg = function(file) {
                    $scope.imageBtnText = 'החלף תמונה';
                    if (file) {
                        Upload.imageDimensions(file).then(function(dimensions) {
                            var resizeObj = {}
                            var ratio = dimensions.width / dimensions.height;
                            if (dimensions.width > dimensions.height) {
                                resizeObj.width = 500;
                                resizeObj.height = 500 / ratio;
                            } else {
                                resizeObj.width = 500 * ratio;
                                resizeObj.height = 500;
                            }
                            Upload.resize(file, resizeObj).then(function(resizedFile) {
                                $scope.newActivityData.image = resizedFile;
                            });
                        });
                    }
                };
            }
        }
    });
