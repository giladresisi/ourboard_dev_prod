angular.module('ourBoard').directive('editProfileDrtv',
    function (dataSrvc, $rootScope, authSrvc) {
        return {
            restrict: 'E',
            templateUrl: 'templates/editProfileView.html',
            link: function ($scope, element, attrs) {
                $scope.errors = [];
                authSrvc.getUser().then(function (userData) {
                    $scope.userData = userData;
                    $scope.profileData = angular.copy($scope.userData);
                    delete $scope.profileData.password;
                });


                $scope.updateProfile = function () {
                    $scope.errors = [];

                    if (!$scope.profileData.displayName || $scope.profileData.displayName.length < 3) {
                        $scope.errors.push('אנא הזן שם מלא תקין');
                    }
                    if (!$scope.userData.facebook && (!$scope.profileData.email || !authSrvc.emailPattern.test($scope.profileData.email))) {
                        $scope.errors.push('אנא הזן כתובת אימייל תקינה');
                    }
                    if ($scope.userData.facebook && $scope.profileData.email && !authSrvc.emailPattern.test($scope.profileData.email)) {
                        $scope.errors.push('אנא הזן כתובת אימייל תקינה');
                    }
                    // if (!$scope.profileData.password || $scope.profileData.password.length < 6) {
                    //     $scope.errors.push('אנא הזן סיסמא בת 6 תווים לפחות');
                    // }

                    if ($scope.errors.length === 0) {
                        dataSrvc.api({
                            type: 'updateUser',
                            args: {
                                displayName: $scope.profileData.displayName,
                                email: $scope.profileData.email,
                                phone: $scope.profileData.phone,
                                newPassword: $scope.profileData.newPassword,
                                password: $scope.profileData.password
                            }
                        }).then(function (data) {
                            if($scope.source !== 'activity_board'){
                                authSrvc.setToken(data.data.token);
                                $rootScope.$broadcast('REFRESH_USER_PROFILE');
                                $rootScope.activeModal.hide();
                            }
                        });
                    }
                };


                $scope.cancel = function () {
                    $scope.errors = [];
                    $rootScope.activeModal.hide();
                };

                $scope.updateDetails = function () {

                }
            }
        }
    });
