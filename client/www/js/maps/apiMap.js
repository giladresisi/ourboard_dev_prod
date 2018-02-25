angular.module('ourBoard').value('apiMap', {
    getUser: {
        url: '/api/me',
        method: 'GET'
    },
    updateUser: {
        url: '/api/me',
        method: 'POST'
    },
    remarks: {
        url: '/api/remarks',
        method: 'POST'
    },
    getActivities: {
        url: '/activity/all',
        method: 'GET'
    },
    getActivitiesAsGuest: {
        url: '/guest/activity/all',
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
        method: 'POST',
        disableLoading: true
    },
    leaveActivity: {
        urlTemplate: '/activity/leave',
        method: 'POST',
        disableLoading: true
    },
    createNewActivity: {
        urlTemplate: '/activity/create',
        method: 'POST'
    },
    createNewActivityImage: {
        urlTemplate: '/activity/create/image',
        method: 'POST',
        uploadImage: true
    },
    updateActivity: {
        urlTemplate: '/activity/update',
        method: 'POST'
    },
    updateActivityImage: {
        urlTemplate: '/activity/update/image',
        method: 'POST',
        uploadImage: true
    },
    facebookCordovaLogin: {
        urlTemplate: '/auth/facebook',
        method: 'POST'
    },
    getActivityTitles: {
        urlTemplate: '/activity/titles',
        method: 'GET'
    },
    getCommunityInfos: {
        urlTemplate: '/community-info/all',
        method: 'GET'
    },
    getCommunityInfo: {
        urlTemplate: '/community-info/single/<%= communityInfoId %>',
        method: 'GET'
    }
});
