angular.module('ourBoard').controller('ProfileCtrl',
    function ($scope, authSrvc, modalSrvc, $state, dataSrvc, $auth, $timeout, actionsAfterSignupSrvc, $rootScope) {
        
        function getUserData(forceFromServer) {
            authSrvc.getUser(forceFromServer).then(function (userData) {
                $scope.isLoggedIn = !!userData;
                $scope.userData = userData;
            });
        }

        var beforeEnter = function (event, viewData) {
            getUserData();
        };

        $scope.$on('$ionicView.beforeEnter', beforeEnter);

        $rootScope.$on('REFRESH_USER_PROFILE', function(event, viewData) {
            getUserData(true);
        });

        $scope.signUp = function () {
            modalSrvc.showModal('signUpDrtv');
        };

        $scope.login = function () {
            modalSrvc.showModal('loginDrtv');
        };
        $scope.fb_login = function () {
            if (window.cordova && window.cordova.plugins && facebookConnectPlugin) {
                var permissions = ['email', 'public_profile'];
                facebookConnectPlugin.login(permissions, fbLoginSuccess, fbLoginError);
            }
            else {
                $auth.authenticate('facebook').then(function (res) {
                    actionsAfterLogin(res);
                }, fbLoginError);
            }
        };

        function actionsAfterLogin(res) {
            if (res.data && res.data.token) {
                authSrvc.setToken(res.data.token);
                authSrvc.getUser().then(function () {
                    actionsAfterSignupSrvc.performAllActions().then(function () {
                        var redirectionState = actionsAfterSignupSrvc.getRedirectionState();
                        if(redirectionState){
                            $state.go(redirectionState, actionsAfterSignupSrvc.getRedirectionStateParams() );
                        }
                        else{
                            $state.go('tab.activity-board');
                        }
                    });
                });
            }
        }

        function fbLoginSuccess(res) {
            if (res.authResponse && res.status == "connected") {
                dataSrvc.api({
                    type: 'facebookCordovaLogin',
                    args: {
                        accessToken: {
                            access_token: res.authResponse.accessToken,
                            expires_in: res.authResponse.expiresIn,
                            token_type: 'bearer'
                        }
                    }
                }).then(function (res) {
                    actionsAfterLogin(res);
                });
            }
        }

        function fbLoginError(err) {
            // TODO
        }

        $scope.logout = function () {
            authSrvc.logout();
            $state.go('tab.activity-board');
        };

        $scope.editProfile = function () {
            modalSrvc.showModal('editProfileDrtv');
        };

        $scope.remarks = function () {
            modalSrvc.showModal('remarksDrtv');
        }
    })
;
