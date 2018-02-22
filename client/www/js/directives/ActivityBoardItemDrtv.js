angular.module('ourBoard').directive('activityBoardItemDrtv',
    function ($state, authSrvc, activitySrvc) {
        return {
            restrict: 'E',
            templateUrl: 'templates/activityBoardItemView.html',
            scope: {
                activity: '='
            },
            link: function ($scope, element, attrs) {
                $scope.watchers = [];

                init();
                function init() {
                    authSrvc.getUser().then(function (userData) {
                        activitySrvc.processActivityData(userData, $scope.activity)
                    });
                }

                $scope.goToActivity = function () {
                    $state.go('tab.activity-details', {activityId: $scope.activity._id})
                };

                $scope.watchers.push($scope.$watch('activity',function (newVal, oldVal) {
                    if(!angular.equals(newVal, oldVal)){
                       init();
                    }
                }))

                $scope.$on('$destroy', function (event) {
                    $scope.watchers.forEach(function (destroy) {
                        destroy && destroy();
                    })
                })
            }
        }
    });
