angular.module('ourBoard').service('activitySrvc',
    function (dataSrvc, ENV) {
        var that = this;

        that.processActivityData = function (userData, activity) {
            var dateMoment = moment(activity.datetimeMS);
            activity.date = dateMoment.format('DD/MM');
            activity.hour = dateMoment.format('HH:mm');
            if (activity.imgName) {
                activity.imageUrl = ENV.S3_URL + '/' + activity._id.toString() + '/' + activity.imgName; // Same as in create API
            }
            if (userData) {
                //Check if Current user is attending to the event;
                var tmpUser = _.find(activity.users, function (participantId) {
                    return (participantId === userData._id.toString());
                });
                activity.isAttending = (tmpUser !== undefined);
                if (activity.joinUserAfterLogin) {
                    if (!activity.isAttending) {
                        activity.isAttending = true; // Change here and not after server 'join' call, before RSVPDrtv is loaded and watches isAttending
                        dataSrvc.api({
                            type: 'joinActivity',
                            args: {
                                activityId: activity._id.toString()
                            }
                        }).then(function() {
                            that.addUserToActivityData(userData, activity);
                        });
                    }
                }
                return activity;
            }
            else {
                activity.isAttending = false;
                return activity;
            }
        };

        that.addUserToActivityData = function(userData, activity) {
            if (userData) { // Protect from guests
                activity.nParticipants++;
                if (activity.users) { // Must exist
                    activity.users.push(userData._id.toString());
                }
                if (activity.participants) { // Exists when in activity details page
                    activity.participants.push({
                        _id: userData._id,
                        displayName: userData.displayName
                    });
                    activity.participants.sort(function (p1, p2) {
                        if (p1.displayName < p2.displayName) {return -1;}
                        if (p1.displayName > p2.displayName) {return 1;}
                        return 0;
                    });
                }
            }
        };

        that.removeUserFromActivityData = function(userData, activity) {
            if (userData) { // Protect from guests
                if (activity.nParticipants > 0) { // Must be true if called
                    activity.nParticipants--;
                }
                if (activity.users) { // Must exist
                    var userIndex = activity.users.indexOf(userData._id.toString());
                    if (userIndex != -1) { // Must be true if called
                        activity.users.splice(userIndex, 1);
                    }
                }
                if (activity.participants) { // Exists when in activity details page
                    var participantIndex = activity.participants.findIndex(function(participant) {
                        return (participant._id.toString() == userData._id.toString());
                    });
                    if (participantIndex != -1) { // Must be true if called
                        activity.participants.splice(participantIndex, 1);
                    }
                }
            }
        }
    });
