angular.module('ourBoard').controller('ActivityBoardCtrl',
    function ($scope, $ionicLoading, apiMap, dataSrvc, authSrvc, $rootScope, modalSrvc, $stateParams, $ionicTabsDelegate, activitySrvc) {

        authSrvc.getUser().then(fetchData);
        console.log($stateParams);
        $scope.watchers = [];

        function fetchData(userData) {
            $ionicLoading.show({
                template: 'טוען פעילויות'
            });
            dataSrvc.api({
                type: userData ? 'getActivities' : 'getActivitiesAsGuest',
            }).then(function (res) {
                $ionicLoading.hide();
                $scope.activities = res.data;
                if (userData && $stateParams.joinActivity && $stateParams.activityId) {
                    var activityIndex = $scope.activities.findIndex(function(activity) {
                        return (activity._id.toString() == $stateParams.activityId);
                    });
                    if (activityIndex != -1) {
                        $scope.activities[activityIndex].joinUserAfterLogin = true; // Mark for activitySrvc (mark for activitySrvc, make 'join' server call after setting isAttending)
                    } else {
                        // TODO error: request to join non-existing activity after login
                    }
                }
                if (userData && $stateParams.openCreate === true) {
                    $scope.openCreateNewActivityModal();
                }
            });
        };

        $scope.watchers.push($rootScope.$on('ADD_USER_TO_ACTIVITY_DATA', function (event, args) {
            var activityIndex = $scope.activities.findIndex(function(activity) {
                return (activity._id.toString() == args.activityId);
            });
            if (activityIndex != -1) {
                authSrvc.getUser().then(function (userData) {
                    activitySrvc.addUserToActivityData(userData, $scope.activities[activityIndex]);
                });
            } else {
                // TODO error: request to add user to the data of non-existing activity
            }
        }));

        $scope.watchers.push($rootScope.$on('REMOVE_USER_FROM_ACTIVITY_DATA', function (event, args) {
            var activityIndex = $scope.activities.findIndex(function(activity) {
                return (activity._id.toString() == args.activityId);
            });
            if (activityIndex != -1) {
                authSrvc.getUser().then(function (userData) {
                    activitySrvc.removeUserFromActivityData(userData, $scope.activities[activityIndex]);
                });
            } else {
                // TODO error: request to remove user from the data of non-existing activity
            }
        }));

        $scope.watchers.push($rootScope.$on('REFRESH_ACTIVITY_BOARD', function () {
            authSrvc.getUser().then(fetchData);
        }));

        $scope.openCreateNewActivityModal = function () {
            authSrvc.getUser().then(function (userData) {
                if (!userData) {
                    modalSrvc.showGuestRestrictedActionModal('CREATE_NEW_ACTIVITY', {
                        redirectionState: 'tab.activity-board',
                        redirectionStateParams: {openCreate: true}
                    });
                }
                else {
                    modalSrvc.showModal('createNewActivityDrtv');
                }
            });
        };

        $scope.doRefresh = function() {
            $rootScope.$broadcast('REFRESH_ACTIVITY_BOARD');
            $rootScope.$broadcast('scroll.refreshComplete');
        };

        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            $ionicTabsDelegate.showBar(true); // Because ActivityDetails.beforeLeave doesn't work
        });

        $scope.$on('$destroy', function (event) {
            $scope.watchers.forEach(function (destroyer) {
                destroyer && destroyer();
            })
        })
    });
