angular.module('ourBoard').service('authSrvc',
    function (localStorageService, $q, dataSrvc) {
        var that = this;
        that.userData = undefined;
        this.emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

        var token = localStorageService.get('OurBoard_token');

        this.setToken = function (newToken) {
            localStorageService.set('OurBoard_token', newToken);
            token = newToken;
        };

        this.hasToken = function () {
            return token ? token : false;
        };

        this.logout = function () {
            token = '';
            localStorageService.remove('OurBoard_token');
            that.userData = undefined;
        };

        /**
         * Action Enums:
         *      ORGANIZER_CLICK
         *      PARTICIPANTS_CLICK
         *      RSVP_CLICK
         *
         */

        this.getUser = function (forceFromServer) {
            if ((!that.userData && that.hasToken()) || forceFromServer) {
                return dataSrvc.api({
                    type: 'getUser'
                }).then(function (res) {
                    that.userData = res.data;
                    return $q.resolve(that.userData);
                }, function (err) {
                    return null;
                });
            }
            else {
                return $q.resolve(that.userData);
            }
        };
    });
