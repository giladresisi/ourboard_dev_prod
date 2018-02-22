// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services;.js
// 'starter.controllers' is found in controllers.js
angular.module('ourBoard', [
    'ionic',
    'LocalStorageModule',
    'satellizer',
    'ion-datetime-picker',
    'angularMoment',
    'ngFileUpload'
])
    .constant('ENV', {
        FREE_TEXT_ID: 'FREE_TEXT',
        TOKEN_NAME: 'OurBoard_token',
        DEV_URL: '',
        S3_URL: 'http://ourboard-dev.s3-website-us-west-2.amazonaws.com',
        API_URL:'http://ourboarddev-env.us-west-2.elasticbeanstalk.com'
        // API_URL: 'http://10.0.0.9:4000'
        // API_URL: 'http://192.168.1.5:4000'
    })


    .run(function ($ionicPlatform, $window) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);

            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });

    })

    .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider, $authProvider, localStorageServiceProvider, ENV) {

        $ionicConfigProvider.tabs.position('bottom'); // other values: to
        $ionicConfigProvider.navBar.alignTitle('center');
        $ionicConfigProvider.backButton.previousTitleText(false);
        $ionicConfigProvider.form.toggle('large');
        $ionicConfigProvider.form.checkbox("circle");

        //Auth Configuration
        $authProvider.cordova = true;
        // Satellizer configuration that specifies which API
        // route the JWT should be retrieved from
        $authProvider.tokenName = 'token';
        $authProvider.tokenPrefix = 'OurBoard';
        $authProvider.baseUrl = ENV.API_URL;
        $authProvider.facebook({
            clientId: '148119152614035'
        });

        localStorageServiceProvider
            .setPrefix('')
            .setStorageCookie(0)
            .setStorageCookieDomain(window.location);

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider
        // setup an abstract state for the tabs directive
            .state('tab', {
                url: '/tab',
                abstract: true,
                templateUrl: 'templates/tabs.html'
            })

            // Each tab has its own nav history stack:

            .state('tab.profile', {
                url: '/profile',
                views: {
                    'tab-profile': {
                        templateUrl: 'templates/profileView.html',
                        controller: 'ProfileCtrl'
                    }
                }
            })

            .state('tab.communityInfo', {
                url: '/communityInfo',
                views: {
                    'community-info': {
                        templateUrl: 'templates/communityInfoView.html',
                        controller: 'CommunityInfoCtrl'
                    }
                }
            })
            .state('tab.dummy2', {
                url: '/dummy2',
                views: {
                    'tab-dummy2': {
                        templateUrl: 'templates/dummy2.html',
                        controller: 'DummyCtrl'
                    }
                }
            })
            .state('tab.dummy3', {
                url: '/dummy3',
                views: {
                    'tab-dummy3': {
                        templateUrl: 'templates/dummy3.html',
                        controller: 'DummyCtrl'
                    }
                }
            })

            .state('tab.activity-board', {
                url: '/activity-board',
                // cache: false, // ERROR! need to clear stateParams somehow if a reload is required on every entry to this state
                views: {
                    'tab-activity-board': {
                        templateUrl: 'templates/activityBoardView.html',
                        controller: 'ActivityBoardCtrl'
                    }
                },
                params: {
                    'openCreate': false,
                    'activityId': false,
                    'joinActivity': false
                }
            })
            .state('tab.activity-details', {
                url: '/activity-details/:activityId',
                // cache: false, // ERROR! need to clear stateParams somehow if a reload is required on every entry to this state
                views: {
                    'tab-activity-details': {
                        templateUrl: 'templates/activityDetailsView.html',
                        controller: 'ActivityDetailsCtrl'
                    }
                },
                params: {
                    'showParticipants': false,
                    'showOrganizerPhone': false,
                    'joinActivity': false
                }
            })
            .state('tab.community-info-details', {
                url: '/community-info-details/:communityInfoId',
                // cache: false, // ERROR! need to clear stateParams somehow if a reload is required on every entry to this state
                views: {
                    'tab-community-info-details': {
                        templateUrl: 'templates/communityInfoDetailsView.html',
                        controller: 'CommunityInfoDetailsCtrl'
                    }
                },
                params: {
                    'info': false
                }
            });

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/tab/activity-board');

    });
