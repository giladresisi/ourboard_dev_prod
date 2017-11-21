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
            'VIEW_ACTIVITY_ORGANIZER'
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
                    that.removeAction(actionName);
                    return $q.resolve();
                case 'CREATE_NEW_ACTIVITY':
                    that.removeAction(actionName);
                    return $q.resolve();
                case 'VIEW_ACTIVITY_PARTICIPANT':
                    that.removeAction(actionName);
                    return $q.resolve();
                case 'VIEW_ACTIVITY_ORGANIZER':
                    that.removeAction(actionName);
                    return $q.resolve();
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
            return lastActionRedirectionState;
        };
        that.getRedirectionStateParams = function () {
            return lastActionRedirectionStateParams;
        }
    }
);
