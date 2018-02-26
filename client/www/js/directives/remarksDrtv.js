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
                };

                $scope.submitRemarks = function () {
                    $scope.errors = [];

                    if(!$scope.remark || $scope.remark.length < 2){
                        $scope.errors.push('אנא כתוב הערה חוקית (יותר מ-2');
                    }

                    if ($scope.errors.length === 0) {
                        dataSrvc.api({
                            type: 'remarks',
                            args: {
                                remark: $scope.remark
                            }
                        }).then(function (res) {
                            initData();
                            $ionicPopup.alert({
                                title: 'תודה ששיתפת אותנו בחוויה שלך'
                            }).then(function() {
                                $rootScope.activeModal.hide();
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
