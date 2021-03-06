angular.module('ourBoard').service('authSrvc',
    function (localStorageService, $q, dataSrvc, $auth, ENV) {
        var that = this;
        that.userData = undefined;
        this.emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

        var token = localStorageService.get(ENV.TOKEN_NAME);

        this.setToken = function (newToken) {
            localStorageService.set(ENV.TOKEN_NAME, newToken);
            token = newToken;
        };

        this.hasToken = function () {
            return token ? token : false;
        };

        this.logout = function () {
            token = undefined;
            localStorageService.remove(ENV.TOKEN_NAME);
            that.userData = undefined;
            $auth.logout();
        };

        this.getUser = function (forceFromServer) {
            if (that.hasToken() && !$auth.isAuthenticated()) {
                that.logout();
            }

            if ((!that.userData && that.hasToken()) || forceFromServer) {
                return dataSrvc.api({
                    type: 'getUser'
                }).then(function (res) {
                    that.userData = res.data;
                    if (!that.userData) {
                        that.logout();
                        return $q.resolve(that.userData);
                    } else {
                        return $q.resolve(that.userData);
                    }
                }, function (err) {
                    return null;
                });
            }
            else {
                return $q.resolve(that.userData);
            }
        };
    });
