angular.module('ourBoard').controller('CommunityInfoCtrl',
    function ($scope, apiMap, dataSrvc, authSrvc, $rootScope, modalSrvc, $stateParams, $ionicTabsDelegate, activitySrvc) {

        var params = $stateParams;
        fetchData();
        $scope.watchers = [];

        function fetchData(userData) {
            dataSrvc.api({
                type: 'getCommunityInfos',
            }).then(function (res) {
                $scope.communityInfoItems = res.data;
            });
        }

        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            $ionicTabsDelegate.showBar(true); // Because ActivityDetails.beforeLeave doesn't work
        });

        $scope.$on('$destroy', function (event) {
            $scope.watchers.forEach(function (destroyer) {
                destroyer && destroyer();
            })
        })
    });
