module.exports = {
    // App Settings
    MONGO_URI: process.env.MONGO_URI || 'mongodb://alonkatz:alonkatz@ds237815.mlab.com:37815/ourboard_dev',
    TOKEN_SECRET: process.env.TOKEN_SECRET || 'B38E63D45418C7466ECFA5D867902F9317711E8824A8AC4B637F2BADC8FF94A3',
    S3_BUCKET: process.env.S3_BUCKET || 'ourboard-dev',
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || 'AKIAJ5FOHMBCHCUYKAFQ',
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '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',
    S3_REGION: process.env.S3_REGION || 'us-west-2',

    // OAuth 2.0
    FACEBOOK_SECRET: process.env.FACEBOOK_SECRET || '510d69fb56f15688f83b20bd03d2e9d6',
    FOURSQUARE_SECRET: process.env.FOURSQUARE_SECRET || 'YOUR_FOURSQUARE_CLIENT_SECRET',
    GOOGLE_SECRET: process.env.GOOGLE_SECRET || 'ZI5IpbZecGgKyZeof9ypV5P6',
    GITHUB_SECRET: process.env.GITHUB_SECRET || 'YOUR_GITHUB_CLIENT_SECRET',
    INSTAGRAM_SECRET: process.env.INSTAGRAM_SECRET || 'YOUR_INSTAGRAM_CLIENT_SECRET',
    LINKEDIN_SECRET: process.env.LINKEDIN_SECRET || 'YOUR_LINKEDIN_CLIENT_SECRET',
    TWITCH_SECRET: process.env.TWITCH_SECRET || 'YOUR_TWITCH_CLIENT_SECRET',
    WINDOWS_LIVE_SECRET: process.env.WINDOWS_LIVE_SECRET || 'YOUR_MICROSOFT_CLIENT_SECRET',
    YAHOO_SECRET: process.env.YAHOO_SECRET || 'YOUR_YAHOO_CLIENT_SECRET',
    BITBUCKET_SECRET: process.env.BITBUCKET_SECRET || 'YOUR_BITBUCKET_CLIENT_SECRET',
    SPOTIFY_SECRET: process.env.SPOTIFY_SECRET || 'YOUR_SPOTIFY_CLIENT_SECRET',

    // OAuth 1.0
    TWITTER_KEY: process.env.TWITTER_KEY || 'YOUR_TWITTER_CONSUMER_KEY',
    TWITTER_SECRET: process.env.TWITTER_SECRET || 'YOUR_TWITTER_CONSUMER_SECRET'
};
