angular.module('ourBoard').controller('ActivityDetailsCtrl',
    function ($scope, dataSrvc, $stateParams, activitySrvc, $rootScope, $state, authSrvc, $ionicScrollDelegate, $ionicTabsDelegate, modalSrvc) {

        authSrvc.getUser().then(fetchData);

        function fetchData(userData) {
            $scope.userData = userData;
            dataSrvc.api({
                type: $scope.userData ? 'getActivity' : 'getActivityAsGuest',
                urlParamsObj: {
                    activityId: $stateParams.activityId
                }
            }).then(function (res) {
                $scope.activity = res.data;
                if ($scope.activity && $scope.activity.participants) {
                    $scope.activity.users = $scope.activity.participants.map(function(participant) {
                        return participant._id.toString();
                    });
                }
                if ($scope.userData && $stateParams.joinActivity && $stateParams.activityId) {
                    if ($stateParams.activityId == $scope.activity._id.toString()) {
                        $scope.activity.joinUserAfterLogin = true; // Mark for activitySrvc (mark for activitySrvc, make 'join' server call after setting isAttending)
                    } else {
                        // TODO error: request to join the wrong activity
                    }
                }
                activitySrvc.processActivityData(userData, $scope.activity);
                if ($stateParams.showOrganizerPhone) {
                    $scope.showOrganizerPhone = true;
                }
                if ($stateParams.showParticipants) {
                    $scope.showParticipants = true;
                }
            });
        }

        $scope.scrollToParticipants = function () {
            $ionicScrollDelegate.scrollTo(null, $scope.participantListElementTop, true);
        };
        $scope.scrollTop = function () {
            $ionicScrollDelegate.scrollTop(true);
        };

        $scope.onScroll = function () {
            console.log('scroll Delegate: ',$ionicScrollDelegate.getScrollPosition().top + 2);

            var shouldShowGoUpButton = (($ionicScrollDelegate.getScrollPosition().top + 2) > $scope.participantListElementTop);
            if ($scope.showGoUpButton !== shouldShowGoUpButton) {
                $scope.showGoUpButton = shouldShowGoUpButton;
                $scope.$apply(); //invoke digest
            }
        };

        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
            $ionicTabsDelegate.showBar(false);
        });
        $scope.$on('$ionicView.afterEnter', function (event, viewData) {
            $scope.participantListElementTop = document.getElementById('participant-list').offsetTop;
            console.log(document.getElementById('participant-list').offsetTop);
        });
        $scope.$on("$ionicView.beforeLeave", function () {
            $ionicTabsDelegate.showBar(true); // TODO deosn't work!!
        });

        $scope.participantsClick = function () {
            if (!$scope.userData) {
                modalSrvc.showGuestRestrictedActionModal('VIEW_ACTIVITY_PARTICIPANT', {
                    redirectionState: 'tab.activity-details',
                    redirectionStateParams: {
                        showParticipants: true,
                        activityId: $stateParams.activityId
                    }
                });
            }
            else {
                $scope.showParticipants = !$scope.showParticipants;
            }
        };
        $scope.organizerClick = function () {
            if (!$scope.userData) {
                modalSrvc.showGuestRestrictedActionModal('VIEW_ACTIVITY_ORGANIZER', {
                    redirectionState: 'tab.activity-details',
                    redirectionStateParams: {
                        showOrganizerPhone: true,
                        activityId: $stateParams.activityId
                    }
                });
            }
            else {
                $scope.showOrganizerPhone = !$scope.showOrganizerPhone;
            }
        };

        $scope.editActivity = function () {
            modalSrvc.showModal('editActivityDrtv', $scope.activity);
        };
        $scope.customBack = function () {
            $state.go('tab.activity-board');
        };

        $rootScope.$on('ACTIVITY_EDITED', function (event) {
            fetchData($scope.userData);
        });

        $rootScope.$on('ADD_USER_TO_ACTIVITY_DATA', function (event, args) {
            if ($scope.activity && $scope.activity._id.toString() == args.activityId) {
                activitySrvc.addUserToActivityData($scope.userData, $scope.activity);
            } else {
                // TODO error: request to add user to the data of the wrong activity
            }
        });

        $rootScope.$on('REMOVE_USER_FROM_ACTIVITY_DATA', function (event, args) {
            if ($scope.activity && $scope.activity._id.toString() == args.activityId) {
                activitySrvc.removeUserFromActivityData($scope.userData, $scope.activity);
            } else {
                // TODO error: request to remove user from the data of non-existing activity
            }
        });

    });
