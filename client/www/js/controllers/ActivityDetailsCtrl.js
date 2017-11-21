angular.module('ourBoard').controller('ActivityDetailsCtrl',
    function ($scope, $ionicLoading, dataSrvc, $stateParams, activitySrvc, $rootScope, $ionicHistory, authSrvc, $ionicScrollDelegate, $ionicTabsDelegate, modalSrvc) {

        init();

        function init() {
            if ($stateParams.joinActivity && $stateParams.activityId) {
                authSrvc.getUser().then(joinActivity).then(fetchData);
            }
            else {
                authSrvc.getUser().then(fetchData);
            }
        }


        function joinActivity() {
            return dataSrvc.api({
                type: 'joinActivity',
                args: {
                    activityId: $stateParams.activityId
                }
            })
        }

        function fetchData(userData) {
            $scope.userData = userData;
            $ionicLoading.show({
                template: 'טוען פעילות'
            });
            return dataSrvc.api({
                type: $scope.userData ? 'getActivity' : 'getActivityAsGuest',
                urlParamsObj: {
                    activityId: $stateParams.activityId
                }
            }).then(function (res) {
                $ionicLoading.hide();
                $scope.activity = res.data;
                activitySrvc.processActivityData(userData, $scope.activity);
                // //for testing TODO Remove
                // for(var i=1 ; i<20 ; i++){
                //     $scope.activity.participants.push({_id:i, displayName: 'asdasd1'})
                // }
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
            var shouldShowGoUpButton = (($ionicScrollDelegate.getScrollPosition().top + 2) > $scope.participantListElementTop);
            if ($scope.showGoUpButton !== shouldShowGoUpButton) {
                $scope.showGoUpButton = shouldShowGoUpButton;
                $scope.$apply(); //invoke digest
            }
        };

        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
            $ionicTabsDelegate.showBar(false);
            init();
        });
        $scope.$on('$ionicView.afterEnter', function (event, viewData) {

            $scope.participantListElementTop = document.getElementById('participant-list').offsetTop;
        });
        $scope.$on("$ionicView.beforeLeave", function () {
            $ionicTabsDelegate.showBar(true);
        });

        $scope.participantsClick = function () {
            if (!$scope.userData) {
                modalSrvc.showGuestRestrictedActionModal('VIEW_ACTIVITY_PARTICIPANT', {
                    redirectionState: 'tab.activity-details',
                    redirectionStateParams: {
                        showParticipants: true,
                        activityId: $stateParams.activityId,
                        originNotFromActivityFeed: true
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
                        activityId: $stateParams.activityId,
                        originNotFromActivityFeed: true
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
            $ionicHistory.goBack(-1);
        };

        $rootScope.$on('ACTIVITY_EDITED', function (event) {
            fetchData($scope.userData);
        })

    });
