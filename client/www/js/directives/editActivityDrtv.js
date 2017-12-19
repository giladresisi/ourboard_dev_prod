angular.module('ourBoard').directive('editActivityDrtv',
    function (dataSrvc, $rootScope, $stateParams) {
        return {
            restrict: 'E',
            templateUrl: 'templates/createEditNewActivityView.html',
            link: function ($scope, element, attrs) {
                $scope.errors = [];
                $scope.edit = true;

                initData();

                function initData() {
                    $scope.nameOptions = [
                        {
                            id: 1,
                            display : 'רכיבת סוסים'
                        },
                        {
                            id: 2,
                            display : 'פגישה בפארק'
                        },
                        {
                            id: 3,
                            display : 'הליכת ערב'
                        },
                        {
                            id: 'FREE_TEXT',
                            display : 'טקסט חופשי'
                        }
                    ];
                    $scope.newActivityData = convertDataFormat($rootScope.activeModal.args);
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
                        dataSrvc.api({
                            type: 'updateActivity',
                            args: {
                                title: $scope.newActivityData.nameId === 'FREE_TEXT' ? $scope.newActivityData.freeName : _.findWhere($scope.nameOptions, {id: parseInt($scope.newActivityData.nameId)}).display,
                                location: $scope.newActivityData.location,
                                hasImage: !!$scope.newActivityData.image,
                                extraDetails: $scope.newActivityData.additionalInfo,
                                datetimeMS: moment($scope.newActivityData.datetimeValue).valueOf(),
                                activityId: $stateParams.activityId
                            }
                        }).then(function (res) {
                            initData();
                            $rootScope.activeModal.hide();
                            $rootScope.$broadcast('REFRESH_ACTIVITY_BOARD');
                            $rootScope.$broadcast('ACTIVITY_EDITED');
                        });
                    }
                };

                $scope.cancel = function () {
                    $scope.errors = [];
                    initData();
                    $rootScope.activeModal.hide();
                };

                function convertDataFormat(obj) {
                    var nameAndId = convertNameAndId(obj);
                    return {
                        freeName: nameAndId.freeName,
                        nameId: nameAndId.nameId,
                        location: obj.location,
                        image: obj.hasImage,
                        additionalInfo: obj.extraDetails,
                        datetimeValue: obj.datetimeMS
                    }
                };

                function convertNameAndId(obj) {
                    var nameId = 'FREE_TEXT';
                    var freeName = undefined;
                    for (i = 0; i < $scope.nameOptions.length - 1; i++) {
                        if (obj.type == $scope.nameOptions[i].display) {
                            nameId = i + 1
                            break;;
                        }
                    }
                    if (nameId == 'FREE_TEXT') {
                        freeName = obj.type;
                    }
                    return {
                        freeName: freeName,
                        nameId: nameId
                    }
                }
            }
        }
    });
