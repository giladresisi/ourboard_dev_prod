angular.module('ourBoard').controller('CommunityInfoDetailsCtrl',
    function ($scope, dataSrvc, $stateParams, activitySrvc, $rootScope, $state, authSrvc, $ionicScrollDelegate, $ionicTabsDelegate, modalSrvc) {

        $scope.infoData = $stateParams.info.infoPage.infoItems;
        $scope.description = $stateParams.info.infoPage.description;
        $scope.title = $stateParams.info.title;

        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
            $ionicTabsDelegate.showBar(false);
        });
        $scope.$on("$ionicView.beforeLeave", function () {
            $ionicTabsDelegate.showBar(true); // TODO deosn't work!!
        });


        $scope.customBack = function () {
            $state.go('tab.communityInfo');
        };

    });
