angular.module('ourBoard').value('apiMap', {
    getUser: {
        url: '/api/me',
        method: 'GET'
    },
    getActivities: {
        url: '/activity/all',
        method: 'GET'
    },
    getActivityAsGuest: {
        urlTemplate: '/guest/activity/single/<%= activityId %>',
        method: 'GET'
    },
    getActivity: {
        urlTemplate: '/activity/single/<%= activityId %>',
        method: 'GET'
    },
    joinActivity: {
        url: '/activity/join',
        method: 'POST'
    },
    leaveActivity: {
        urlTemplate: '/activity/leave',
        method: 'POST',
        disableLoading: false //example of use
    },
    createNewActivity: {
        urlTemplate: '/activity/create',
        method: 'PUT'
    },
    updateActivity: {
        urlTemplate: '/activity/update',
        method: 'POST'
    },
    facebookCordovaLogin: {
        urlTemplate: '/auth/facebook',
        method: 'POST'
    }

});
