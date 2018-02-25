angular.module('ourBoard').controller('CommunityInfoDetailsCtrl',
    function ($scope, $stateParams, $state, $ionicTabsDelegate, dataSrvc) {
        dataSrvc.api({
            type: 'getCommunityInfo',
            urlParamsObj: {
                communityInfoId: $stateParams.communityInfoId
            }
        }).then(function (res) {
            $scope.infoData = res.data;
            console.log('data: ' + JSON.stringify($scope.infoData));
        });

        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
            $ionicTabsDelegate.showBar(false);
        });
        $scope.$on("$ionicView.beforeLeave", function () {
            $ionicTabsDelegate.showBar(true); // TODO deosn't work!!
        });

        $scope.goToLink = function (linkUrl) {
            var fullUrl = linkUrl;
            var urlPrefix = "http://";
            if (!fullUrl.startsWith(urlPrefix)) {
                fullUrl = urlPrefix.concat(fullUrl);
            }
            if (window.cordova) {
                window.open(fullUrl, "_system");
            } else {
                window.open(fullUrl, "_blank");
            }
        };

        $scope.customBack = function () {
            $state.go('tab.communityInfo');
        };

    });
