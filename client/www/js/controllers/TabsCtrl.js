angular.module('ourBoard').controller('TabsCtrl',
    function ($scope, $state) {
        
        $scope.goToActivityBoard = function() {
            $state.go("tab.activity-board", {openCreate: false, activityId: false, joinActivity: false});
        };
    });
