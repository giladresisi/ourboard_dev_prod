angular.module('ourBoard').directive('communityInfoItemDrtv',
    function ($state, authSrvc, modalSrvc) {
        return {
            restrict: 'E',
            templateUrl: 'templates/communityInfoItemView.html',
            scope: {
                info: '='
            },
            link: function ($scope, element, attrs) {
                $scope.watchers = [];

                $scope.goToInfo = function () {
                    authSrvc.getUser().then(function (userData) {
                        if (!userData) {
                            modalSrvc.showGuestRestrictedActionModal('VIEW_COMMUNITY_INFO_DETAILS', {
                                redirectionState: 'tab.community-info-details',
                                redirectionStateParams: {communityInfoId: $scope.info._id}
                            });
                        }
                        else {
                            $state.go('tab.community-info-details', {communityInfoId: $scope.info._id});
                        }
                    });
                };

                $scope.watchers.push($scope.$watch('info',function (newVal, oldVal) {
                    if(!angular.equals(newVal, oldVal)){
                    }
                }));

                $scope.$on('$destroy', function (event) {
                    $scope.watchers.forEach(function (destroy) {
                        destroy && destroy();
                    })
                })
            }
        }
    });
