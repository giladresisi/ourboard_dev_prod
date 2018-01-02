angular.module('ourBoard').directive('createNewActivityDrtv',
    function (dataSrvc, $rootScope, Upload) {
        return {
            restrict: 'E',
            templateUrl: 'templates/createEditNewActivityView.html',
            link: function ($scope, element, attrs) {
                $scope.errors = [];

                $scope.resizeObj = {
                    'width': '100%',
                    'height': 'auto'
                }

                initData();

                function initData() {
                    $scope.newActivityData = {
                        datetimeValue : new Date(),
                        nameId: null,
                        freeName: '',
                        location: '',
                        additionalInfo: ''
                    };
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
                        dataSrvc.api({
                            type: 'createNewActivity',
                            args: {
                                title: $scope.newActivityData.nameId === 'FREE_TEXT' ? $scope.newActivityData.freeName : _.findWhere($scope.nameOptions, {id: parseInt($scope.newActivityData.nameId)}).display,
                                location: $scope.newActivityData.location,
                                hasImage: !!$scope.newActivityData.image,
                                extraDetails: $scope.newActivityData.additionalInfo,
                                datetimeMS: moment($scope.newActivityData.datetimeValue).valueOf()
                            }
                        }).then(function (res) {
                            initData();
                            $rootScope.activeModal.hide();
                            $rootScope.$broadcast('REFRESH_ACTIVITY_BOARD');
                        });
                    }
                };

                $scope.cancel = function () {
                    $scope.errors = [];
                    initData();
                    $rootScope.activeModal.hide();
                };

                $scope.clearImage = function() {
                    $scope.newActivityData.image = null;
                    console.log('image cleared');
                    $scope.imageBtnText = 'הוסף תמונה';
                };

                $scope.selectImg = function(file) {
                    $scope.imageBtnText = 'החלף תמונה';
                    if (file) {
                        $scope.newActivityData.image = file;
                        console.log('selected image: ' + $scope.newActivityData.image.name);
                    }
                };
            }
        }
    });
