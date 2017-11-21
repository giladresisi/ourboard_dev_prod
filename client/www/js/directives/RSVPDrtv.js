angular.module('ourBoard').directive('rsvpDrtv',
    function (authSrvc, $ionicPopup, modalSrvc, dataSrvc, $state, $rootScope) {
        return {
            restrict: 'E',
            templateUrl: 'templates/RSVPView.html',
            scope: {
                isAttending: '=',
                activityId: '=',
                redirectionState: '='
            },
            link: function ($scope, element, attrs) {
                $scope.$watch('isAttending', function (newVal, oldVal) {
                    if (newVal === true && oldVal !== true && oldVal !== null && oldVal !== undefined) {
                        authSrvc.getUser().then(function (userData) {
                            if (!userData) {
                                //change back to false
                                $scope.isAttending = false;
                                modalSrvc.showGuestRestrictedActionModal('RSVP', {
                                    redirectionState: $scope.redirectionState,
                                    redirectionStateParams: {activityId: $scope.activityId}
                                });
                            }
                            else {
                                dataSrvc.api({
                                    type: 'joinActivity',
                                    args: {
                                        activityId: $scope.activityId
                                    }
                                }).then(function () {
                                    if($scope.source !== 'activity_board'){
                                        $rootScope.$broadcast('REFRESH_ACTIVITY_BOARD');
                                    }
                                });
                            }
                        });
                    }
                    else if(newVal === false && oldVal !== false && oldVal !== null && oldVal !== undefined){
                        authSrvc.getUser().then(function (userData) {
                            if (userData) {
                                dataSrvc.api({
                                    type: 'leaveActivity',
                                    args: {
                                        activityId: $scope.activityId
                                    }
                                }).then(function () {
                                    if($scope.source !== 'activity_board'){
                                        $rootScope.$broadcast('REFRESH_ACTIVITY_BOARD');
                                    }
                                });
                            }
                        })
                    }
                })
            }
        }
    });
