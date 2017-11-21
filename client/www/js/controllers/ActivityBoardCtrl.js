angular.module('ourBoard').controller('ActivityBoardCtrl',
    function ($scope, $q, apiMap, $http, dataSrvc, authSrvc, $rootScope, modalSrvc, $stateParams) {

        authSrvc.getUser().then(fetchData);
        console.log($stateParams);
        $scope.watchers = [];

        function fetchData(userData) {
            if (userData && $stateParams.openCreate === true) {
                $scope.openCreateNewActivityModal();
            }
            if (userData && $stateParams.activityId) {
                dataSrvc.api({
                    type: 'joinActivity',
                    args: {
                        activityId: $stateParams.activityId
                    }
                }).then(function (res) {
                    dataSrvc.api({
                        type: 'getActivities'
                    }).then(function (res) {
                        $scope.activities = res.data;
                    });
                });
            }
            else{
                dataSrvc.api({
                    type: 'getActivities'
                }).then(function (res) {
                    $scope.activities = res.data;
                });
            }

        }


        $scope.watchers.push($rootScope.$on('REFRESH_ACTIVITY_BOARD', function (event, data) {
            fetchData();
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

        $scope.$on('$destroy', function (event) {
            $scope.watchers.forEach(function (destroyer) {
                destroyer && destroyer();
            })
        })
    });
