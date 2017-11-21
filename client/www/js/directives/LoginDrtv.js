angular.module('ourBoard').directive('loginDrtv',
    function ($state, authSrvc, $rootScope, $auth, authSrvc, $ionicPopup, actionsAfterSignupSrvc, modalSrvc, $timeout) {
        return {
            restrict: 'E',
            templateUrl: 'templates/loginView.html',
            link: function ($scope, element, attrs) {
                var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
                $scope.loginData = {};
                $scope.errors = [];

                $scope.login = function () {
                    $scope.errors = [];
                    if (!$scope.loginData.email || !emailPattern.test($scope.loginData.email)) {
                        $scope.errors.push('אנא הזן כתובת אימייל תקינה');
                    }
                    if (!$scope.loginData.password || $scope.loginData.password.length < 6) {
                        $scope.errors.push('אנא הזן סיסמא בת 6 תווים לפחות');
                    }

                    if ($scope.errors.length === 0) {
                        {
                            $auth.login($scope.loginData).then(function (res) {
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
                    $scope.loginData = {};
                    $rootScope.activeModal.hide();
                };

                $scope.signUp = function () {
                    $scope.cancel();
                    modalSrvc.showModal('signUpDrtv');
                }
            }
        }
    });
