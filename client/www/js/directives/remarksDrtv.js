angular.module('ourBoard').directive('remarksDrtv',
    function (dataSrvc, $rootScope, $ionicPopup) {
        return {
            restrict: 'E',
            templateUrl: 'templates/remarksDrtv.html',
            link: function ($scope, element, attrs) {
                $scope.errors = [];

                initData();

                function initData() {
                    $scope.remark = '';
                }
                $scope.submitRemarks = function () {
                    $scope.errors = [];

                    if(!$scope.remark || $scope.remark.length < 5){
                        $scope.errors.push('אנא הזן שם אירוע תקין');
                    }

                    if ($scope.errors.length === 0) {
                        dataSrvc.api({
                            type: 'remarks',
                            args: {
                                remark: $scope.remark
                            }
                        }).then(function (res) {
                            initData();
                            $rootScope.activeModal.hide();
                            $ionicPopup.alert({
                                title: 'תודה ששיתפת אותנו בחוויה שלך'
                            });
                        });
                    }
                };

                $scope.cancel = function () {
                    $scope.errors = [];
                    initData();
                    $rootScope.activeModal.hide();
                }
            }
        }
    });
