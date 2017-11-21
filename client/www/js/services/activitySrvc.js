angular.module('ourBoard').service('activitySrvc',
    function (dataSrvc) {
        this.processActivityData = function (userData, activity) {
            var dateMoment = moment(activity.datetimeMS);
            activity.date = dateMoment.format('DD/MM');
            activity.hour = dateMoment.format('HH:mm');
            if (userData) {
                //Check if Current user is attending to the event;
                var tmpUser = _.find(activity.users, function (participant) {
                    return participant === userData._id;
                });
                activity.isAttending = (tmpUser !== undefined);
                return activity;
            }
            else {
                activity.isAttending = false;
                return activity;
            }


        }

    });
