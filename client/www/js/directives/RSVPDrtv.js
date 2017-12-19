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
                                var params = {
                                    activityId: $scope.activityId,
                                    joinActivity: true
                                }
                                modalSrvc.showGuestRestrictedActionModal('RSVP', {
                                    redirectionState: $scope.redirectionState,
                                    redirectionStateParams: params
                                });
                            } else {
                                dataSrvc.api({
                                    type: 'joinActivity',
                                    args: {
                                        activityId: $scope.activityId
                                    }
                                }).then(function () {
                                    $rootScope.$broadcast('ADD_USER_TO_ACTIVITY_DATA', {activityId: $scope.activityId});
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
                                    $rootScope.$broadcast('REMOVE_USER_FROM_ACTIVITY_DATA', {activityId: $scope.activityId});
                                });
                            }
                        })
                    }
                });
            }
        }
    });
