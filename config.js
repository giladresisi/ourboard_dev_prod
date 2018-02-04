var fs = require('fs');

var exports = {};

if (process.env.PRODUCTION) {
    console.log('production');
    exports = {
        // App Settings
        MONGO_DB_NAME: process.env.MONGO_DB_NAME,
        MONGO_URI: process.env.MONGO_URI,
        TOKEN_SECRET: process.env.TOKEN_SECRET,
        S3_BUCKET: process.env.S3_BUCKET,
        S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
        S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
        S3_REGION: process.env.S3_REGION,

        // OAuth 2.0
        FACEBOOK_SECRET: process.env.FACEBOOK_SECRET,
        FOURSQUARE_SECRET: process.env.FOURSQUARE_SECRET,
        GOOGLE_SECRET: process.env.GOOGLE_SECRET,
        GITHUB_SECRET: process.env.GITHUB_SECRET,
        INSTAGRAM_SECRET: process.env.INSTAGRAM_SECRET,
        LINKEDIN_SECRET: process.env.LINKEDIN_SECRET,
        TWITCH_SECRET: process.env.TWITCH_SECRET,
        WINDOWS_LIVE_SECRET: process.env.WINDOWS_LIVE_SECRET,
        YAHOO_SECRET: process.env.YAHOO_SECRET,
        BITBUCKET_SECRET: process.env.BITBUCKET_SECRET,
        SPOTIFY_SECRET: process.env.SPOTIFY_SECRET,

        // OAuth 1.0
        TWITTER_KEY: process.env.TWITTER_KEY,
        TWITTER_SECRET: process.env.TWITTER_SECRET
    };
} else {
    console.log('development');
    var devConfig = require('./devConfig');

    exports = {
        // App Settings
        MONGO_DB_NAME: devConfig.MONGO_DB_NAME,
        MONGO_URI: devConfig.MONGO_URI,
        TOKEN_SECRET: devConfig.TOKEN_SECRET,
        S3_BUCKET: devConfig.S3_BUCKET,
        S3_ACCESS_KEY_ID: devConfig.S3_ACCESS_KEY_ID,
        S3_SECRET_ACCESS_KEY: devConfig.S3_SECRET_ACCESS_KEY,
        S3_REGION: devConfig.S3_REGION,

        // OAuth 2.0
        FACEBOOK_SECRET: devConfig.FACEBOOK_SECRET,
        FOURSQUARE_SECRET: devConfig.FOURSQUARE_SECRET,
        GOOGLE_SECRET: devConfig.GOOGLE_SECRET,
        GITHUB_SECRET: devConfig.GITHUB_SECRET,
        INSTAGRAM_SECRET: devConfig.INSTAGRAM_SECRET,
        LINKEDIN_SECRET: devConfig.LINKEDIN_SECRET,
        TWITCH_SECRET: devConfig.TWITCH_SECRET,
        WINDOWS_LIVE_SECRET: devConfig.WINDOWS_LIVE_SECRET,
        YAHOO_SECRET: devConfig.YAHOO_SECRET,
        BITBUCKET_SECRET: devConfig.BITBUCKET_SECRET,
        SPOTIFY_SECRET: devConfig.SPOTIFY_SECRET,

        // OAuth 1.0
        TWITTER_KEY: devConfig.TWITTER_KEY,
        TWITTER_SECRET: devConfig.TWITTER_SECRET
    };
}

module.exports = exports;
