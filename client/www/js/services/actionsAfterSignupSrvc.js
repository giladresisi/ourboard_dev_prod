angular.module('ourBoard').service('actionsAfterSignupSrvc',
    function (dataSrvc, $q) {
        var that = this;
        var actionsToPerformAfterSignup = {};
        var lastActionRedirectionState = null;
        var lastActionRedirectionStateParams = null;

        var actionEnums = [
            'RSVP',
            'CREATE_NEW_ACTIVITY',
            'VIEW_ACTIVITY_PARTICIPANT',
            'VIEW_ACTIVITY_ORGANIZER',
            'VIEW_COMMUNITY_INFO_DETAILS'
        ]; // just for documentation

        that.addAction = function (actionName, actionParamsObj) {
            actionsToPerformAfterSignup[actionName] = actionParamsObj;
            lastActionRedirectionState = actionParamsObj.redirectionState;
            lastActionRedirectionStateParams = actionParamsObj.redirectionStateParams;
        };

        that.removeAction = function (actionName) {
            delete actionsToPerformAfterSignup[actionName];
        };

        that.performAction = function (actionName) {
            switch (actionName) {
                case 'RSVP':
                case 'CREATE_NEW_ACTIVITY':
                case 'VIEW_ACTIVITY_PARTICIPANT':
                case 'VIEW_ACTIVITY_ORGANIZER':
                case 'VIEW_COMMUNITY_INFO_DETAILS':
                    that.removeAction(actionName);
                default:
                    return $q.resolve({});
            }
        };

        that.performAllActions = function () {
            var actionPromises = [];
            _.keys(actionsToPerformAfterSignup).forEach(function (key) {
                actionPromises.push(that.performAction(key));
            });
            return $q.all(actionPromises);
        };

        that.getRedirectionState = function () {
            var tmpRedirectionState = angular.copy(lastActionRedirectionState);
            lastActionRedirectionState = null;
            return tmpRedirectionState ;
        };
        that.getRedirectionStateParams = function () {
            var tmpStateParams = angular.copy(lastActionRedirectionStateParams);
            lastActionRedirectionStateParams = null;
            return tmpStateParams;
        }
    }
);
