angular.module('ourBoard').directive('signUpDrtv',
    function ($state, $rootScope, $auth, authSrvc, $ionicPopup, actionsAfterSignupSrvc, modalSrvc) {
        return {
            restrict: 'E',
            templateUrl: 'templates/signUpView.html',
            link: function ($scope, element, attrs) {
                $scope.signupData = {};
                $scope.errors = [];

                $scope.signUp = function () {
                    $scope.errors = [];
                    if (!$scope.signupData.displayName || $scope.signupData.displayName.length < 3) {
                        $scope.errors.push('אנא הזן שם מלא תקין');
                    }
                    if (!$scope.signupData.email || !authSrvc.emailPattern.test($scope.signupData.email)) {
                        $scope.errors.push('אנא הזן כתובת אימייל תקינה');
                    }
                    if (!$scope.signupData.password || $scope.signupData.password.length < 6) {
                        $scope.errors.push('אנא הזן סיסמא בת 6 תווים לפחות');
                    }

                    if ($scope.errors.length === 0) {
                        {
                            $auth.signup($scope.signupData).then(function (res) {
                                authSrvc.setToken(res.data.token);
                                authSrvc.getUser().then(function () {
                                    actionsAfterSignupSrvc.performAllActions().then(function () {
                                        $rootScope.activeModal.hide();
                                        var redirectionState = actionsAfterSignupSrvc.getRedirectionState();
                                        if(redirectionState){
                                            $state.go(redirectionState, actionsAfterSignupSrvc.getRedirectionStateParams() );

                                        }
                                        else{
                                            $state.go('tab.activity-board');
                                        }
                                    });
                                })
                            },function (error) {
                                console.log(error);
                                $ionicPopup.alert({
                                    title: error.data.message
                                });
                            })

                        }
                    }
                };
                $scope.cancel = function () {
                    $scope.signupData = {};
                    $rootScope.activeModal.hide();
                };

                $scope.login = function () {
                    $scope.cancel();
                    modalSrvc.showModal('loginDrtv');
                }
            }
        }
    });
