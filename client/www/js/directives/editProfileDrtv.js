angular.module('ourBoard').directive('editProfileDrtv',
    function (dataSrvc, $rootScope, authSrvc) {
        return {
            restrict: 'E',
            templateUrl: 'templates/editProfileView.html',
            link: function ($scope, element, attrs) {
                $scope.errors = [];
                $scope.switchPass = false;

                authSrvc.getUser().then(function (userData) {
                    $scope.userData = userData;
                    $scope.profileData = angular.copy($scope.userData);
                });

                $scope.updateProfile = function () {
                    $scope.errors = [];

                    if (!$scope.profileData.displayName || $scope.profileData.displayName.length < 3) {
                        $scope.errors.push('אנא הזן שם מלא תקין');
                    }
                    if (!$scope.userData.facebook && (!$scope.profileData.email || !authSrvc.emailPattern.test($scope.profileData.email))) {
                        $scope.errors.push('אנא הזן כתובת אימייל תקינה');
                    }
                    // if ($scope.userData.facebook && $scope.profileData.email && !authSrvc.emailPattern.test($scope.profileData.email)) {
                    //     $scope.errors.push('אנא הזן כתובת אימייל תקינה');
                    // }
                    // if (!$scope.profileData.password || $scope.profileData.password.length < 6) {
                    //     $scope.errors.push('אנא הזן סיסמא בת 6 תווים לפחות');
                    // }

                    if ($scope.errors.length === 0) {
                        var args = {
                            displayName: $scope.profileData.displayName,
                            phone: $scope.profileData.phone
                        }
                        if (!$scope.userData.facebook) {
                            args.email = $scope.profileData.email;
                        }
                        if ($scope.switchPass) {
                            args.newPassword = $scope.profileData.newPassword;
                            args.oldPassword = $scope.profileData.oldPassword;
                        }
                        dataSrvc.api({
                            type: 'updateUser',
                            args: args
                        }).then(function (data) {
                            //authSrvc.setToken(data.data.token);
                            $rootScope.$broadcast('REFRESH_USER_PROFILE');
                            $rootScope.activeModal.hide();
                        });
                    }
                };


                $scope.cancel = function () {
                    $scope.errors = [];
                    $rootScope.activeModal.hide();
                };
            }
        }
    });
