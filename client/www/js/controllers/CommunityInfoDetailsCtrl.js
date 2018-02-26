angular.module('ourBoard').controller('CommunityInfoDetailsCtrl',
    function ($scope, $stateParams, $state, $ionicTabsDelegate, dataSrvc) {
        dataSrvc.api({
            type: 'getCommunityInfo',
            urlParamsObj: {
                communityInfoId: $stateParams.communityInfoId
            }
        }).then(function (res) {
            $scope.infoData = res.data;
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
            var urlPrefixHttp = "http://";
            var urlPrefixHttps = "https://";
            if (!fullUrl.startsWith(urlPrefixHttp) && !fullUrl.startsWith(urlPrefixHttps)) {
                fullUrl = urlPrefixHttp.concat(fullUrl);
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
