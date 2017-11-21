angular.module('ourBoard').service('authSrvc',
    function (localStorageService, $http, $q, dataSrvc) {
        var that = this;
        that.userData = undefined;

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

        this.getUser = function () {
            if (!that.userData && that.hasToken()) {
                return dataSrvc.api({
                    type: 'getUser'
                }).then(function (res) {
                    that.userData = res.data;
                    return that.userData;
                }, function (err) {
                    return null;
                });
            }
            else {
                return $q.resolve(that.userData);
            }
        };

    });
