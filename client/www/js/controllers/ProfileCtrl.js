angular.module('ourBoard').controller('ProfileCtrl',
    function ($scope, authSrvc, modalSrvc, $state, dataSrvc, $auth, authSrvc, $timeout, actionsAfterSignupSrvc) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            authSrvc.getUser().then(function (userData) {
                $scope.isLoggedIn = !!userData;
                $scope.userData = userData;
            });
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
                    if (res.data && res.data.token) {
                        authSrvc.setToken(res.data.token);
                        authSrvc.getUser().then(function () {
                            actionsAfterLogin();
                        })
                    }
                }, fbLoginError);
            }
        };

        function actionsAfterLogin() {
            actionsAfterSignupSrvc.performAllActions().then(function () {
                var redirectionState = actionsAfterSignupSrvc.getRedirectionState();
                if(redirectionState){
                    $state.go(redirectionState, actionsAfterSignupSrvc.getRedirectionStateParams() );
                }
                else{
                    $state.go('tab.activity-board');
                }
            });
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
                    authSrvc.setToken(res.data.token);
                    authSrvc.getUser().then(function () {
                        actionsAfterLogin();
                    })
                });
            }
        }

        function fbLoginError(err) {

        }

        $scope.logout = function () {
            authSrvc.logout();
            $state.go('tab.activity-board');
        }
    })
;
