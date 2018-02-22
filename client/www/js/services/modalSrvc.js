angular.module('ourBoard').service('modalSrvc',
    function ($rootScope, $ionicModal, actionsAfterSignupSrvc, $state, $ionicPopup) {
        var that = this;
        $rootScope.activeModal = undefined;

        var drtvNames = [
            'signUpDrtv',
            'createEditActivityDrtv',
            'loginDrtv',
            'editProfileDrtv',
            'remarksDrtv'
        ]; // just for documentation

        that.showModal = function (drtvName, args) {
            //First remove previousModal
            $rootScope.activeModal && $rootScope.activeModal.remove();

            //Create new modal from template
            return $ionicModal.fromTemplateUrl('templates/generalModalView.html', {
                scope: $rootScope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $rootScope.activeModal = modal;
                $rootScope.activeModal.args = args || {};
                $rootScope.activeModal.drtvName = drtvName;
                $rootScope.activeModal.show()
            });

        };

        that.showGuestRestrictedActionModal = function (actionEnum, params) {
            var myPopup = $ionicPopup.show({
                title: 'פעולה זו אפשרית עבור משתמשים רשומים בלבד',
                scope: $rootScope,
                buttons: [
                    {
                        text: 'בטל',
                        type: 'button-light'
                    },
                    {
                        text: 'התחבר / הרשם',
                        type: 'button-calm',
                        onTap: function () {
                            return 'login-sign-up';
                        }
                    }
                ]
            });

            myPopup.then(function (res) {
                if (res === 'login-sign-up') {
                    actionsAfterSignupSrvc.addAction(actionEnum, params);
                    $state.go('tab.profile');
                }
            });
        }

    }
);
