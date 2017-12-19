#!/usr/bin/env node

/**
 * Module dependencies.
 */

var http = require('http');
var express = require('express');
var path = require('path');
var qs = require('querystring');
var async = require('async');
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
var colors = require('colors');
var cors = require('cors');
var logger = require('morgan');
var jwt = require('jwt-simple');
var moment = require('moment');
var request = require('request');
var fs = require('fs');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
var single = upload.single('file');

/**
 * Read config file
 */

var config = require('./config');

/**
 * Prepare MongoPool & ObjectId
 */

var MongoPool = require("./mongo-pool.js");
var ObjectId = require('mongodb').ObjectID;

/**
 * Helper functions to compare & hash passwords
 */

function comparePassword(existing, tested, done) {
    bcrypt.compare(tested, existing, function (err, isMatch) {
        done(err, isMatch);
    });
};

function hashPassword(password, done) {
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hashed) {
            done(hashed);
        });
    });
};

/**
 * Create the app itself, store values & prepare utils to be used
 */

var app = express();

// app.set('host', process.env.NODE_IP || '192.168.1.4');
app.set('host', process.env.NODE_IP || 'localhost');
app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '4000');
app.set('port', port);

/**
 * Serve static files
 */

app.use(express.static('client/www'));

/*
|--------------------------------------------------------------------------
| Login Required Middleware
|--------------------------------------------------------------------------
*/
function ensureAuthenticated(req, res, next) {
    if (!req.header('Authorization')) {
        return res.status(401).send({message: 'Please make sure your request has an Authorization header'});
    }
    var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');

    var payload = null;
    try {
        payload = jwt.decode(token, config.TOKEN_SECRET);
    }
    catch (err) {
        return res.status(401).send({message: err.message});
    }

    if (payload.exp <= moment().unix()) {
        return res.status(401).send({message: 'Token has expired'});
    }
    req.user = payload.sub;
    next();
}

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function createJWT(user) {
    var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
    };
    return jwt.encode(payload, config.TOKEN_SECRET);
}

/*
 |--------------------------------------------------------------------------
 | GET /api/me - get user profile data
 |--------------------------------------------------------------------------
 */
app.get('/api/me', ensureAuthenticated, function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('users', function (err, users) {
            if (err) {
                console.log('get(/api/me) error: db.collection()');
                return res.status(500).send({message: err.message});
            }
            users.findOne({"_id": new ObjectId(req.user)}, {fields: {password: 0, activities: 0}}, function (err, user) {
                if (err) {
                    console.log('get(/api/me) error: collection.findOne()');
                    return res.status(500).send({message: err.message});
                }
                console.log('get(/api/me) success: user = ' + JSON.stringify(user));
                res.send(user);
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Aux function to save & send new user data
 |--------------------------------------------------------------------------
 */
function saveAndSendNewUserData(user, users, res, req, newUserObjectForSet) {
    users.findOne({email: user.email}, function (err, existingUser) {
        if (err) {
            console.log('post(/api/me) error: collection.findOne()');
            return res.status(500).send({message: err.message});
        }
        if (existingUser._id.toString() !== req.user) {
            console.log('post(/api/me) error: Email is already taken');
            return res.status(409).send({message: 'Email is already taken by another user'});
        }
        else {
            users.updateOne({"_id": new ObjectId(user._id.toString())}, {
                $set: newUserObjectForSet
            }, function (err) {
                if (!err) {
                    users.findOne({email: req.body.email}, function (err, newUser) {
                        if (!err) {
                            res.status(200).send({token: createJWT(newUser)});
                        }
                    });
                }
            });
        }
    });
}

/*
 |--------------------------------------------------------------------------
 | POST /api/me - update user profile data
 |--------------------------------------------------------------------------
 */
app.post('/api/me', ensureAuthenticated, function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('users', function (err, users) {
            if (err) {
                console.log('post(/api/me) error: db.collection()');
                return res.status(500).send({message: err.message});
            }
            users.findOne({"_id": new ObjectId(req.user)}, function (err, user) {
                if (err) {
                    console.log('post(/api/me) error: collection.findOne()');
                    return res.status(500).send({message: err.message});
                }
                else if (user) {
                    var newUserObjectForSet = {};
                    newUserObjectForSet.displayName = req.body.displayName || user.displayName;
                    newUserObjectForSet.phone = req.body.phone || user.phone;

                    if (req.body.newPassword && req.body.password) {
                        comparePassword(user.password, req.body.password, function (err, isMatch) {
                            if (!isMatch) {
                                console.log('post(/auth/login +) error: Passwords do not match - ' + req.body.password + ' ' + user.password);
                                return res.status(402).send({message: 'Passwords do not match'});
                            }
                            console.log('post(/auth/login) success: user = ' + JSON.stringify(user));
                            hashPassword(req.body.newPassword, function (hashed) {
                                newUserObjectForSet.password = hashed;
                                saveAndSendNewUserData(user, users, res, req, newUserObjectForSet);
                            });
                        });
                    } else {
                        saveAndSendNewUserData(user, users, res, req, newUserObjectForSet);
                    }
                } else {
                    res.status(500).send({message: 'User is not authenticated please login'});
                }
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | PUT /api/me
 |--------------------------------------------------------------------------
 */
// app.put('/api/me', ensureAuthenticated, function (req, res) {
//     MongoPool.getInstance(function (db) {
//         db.collection('users', function (err, users) {
//             if (err) {
//                 console.log('put(/api/me) error: db.collection()');
//                 return res.status(500).send({message: err.message});
//             }
//             users.updateOne({"_id": new ObjectId(req.user)}, {
//                 $set: {
//                     displayName: req.body.displayName,
//                     email: req.body.email
//                 }
//             }, function (err, user) {
//                 if (err) {
//                     console.log('put(/api/me) error: collection.updateOne()');
//                     return res.status(500).send({message: err.message});
//                 }
//                 console.log('put(/api/me) success: user = ' + JSON.stringify(user));
//                 res.status(200).end();
//             });
//         });
//     });
// });


/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */
app.post('/auth/login', function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('users', function (err, users) {
            if (err != null) {
                console.log('post(/auth/login) error: db.collection()');
                return res.status(500).send({message: err.message});
            }
            users.findOne({email: req.body.email}, {fields: {password: 1}}, function (err, user) {
                if (err != null) {
                    console.log('post(/auth/login) error: collection.findOne()');
                    return res.status(500).send({message: err.message});
                }
                if (!user) {
                    console.log('post(/auth/login) error: Invalid email and/or password');
                    return res.status(401).send({message: 'Invalid email and/or password'});
                }
                comparePassword(user.password, req.body.password, function (err, isMatch) {
                    if (!isMatch) {
                        console.log('post(/auth/login +) error: Passwords do not match - ' + req.body.password + ' ' + user.password);
                        return res.status(402).send({message: 'Passwords do not match'});
                    }
                    console.log('post(/auth/login) success: user = ' + JSON.stringify(user));
                    res.send({token: createJWT(user)});
                });
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Create Email and Password Account
 |--------------------------------------------------------------------------
 */
app.post('/auth/signup', function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('users', function (err, users) {
            if (err != null) {
                console.log('post(/auth/signup) error: db.collection()');
                return res.status(500).send({message: err.message});
            }
            users.findOne({email: req.body.email}, function (err, existingUser) {
                if (err != null) {
                    console.log('post(/auth/signup) error: collection.findOne()');
                    return res.status(500).send({message: err.message});
                }
                if (existingUser) {
                    console.log('post(/auth/signup) error: Email is already taken');
                    return res.status(409).send({message: 'Email is already taken'});
                }
                hashPassword(req.body.password, function (hashed) {
                    var user = {
                        displayName: req.body.displayName,
                        email: req.body.email,
                        password: hashed,
                        phone: req.body.phone,
                        activities: []
                    };
                    users.insertOne(user, function (err) {
                        if (err) {
                            console.log('post(/auth/signup) error: collection.insertOne()');
                            return res.status(500).send({message: err.message});
                        }
                        console.log('post(/auth/signup) success: new user id is = ' + user._id);
                        return res.send({token: createJWT(user)});
                    });
                });
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Login with Google
 |--------------------------------------------------------------------------
 */
app.post('/auth/google', function (req, res) {
    var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
    var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: config.GOOGLE_SECRET,
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
    };

    // Step 1. Exchange authorization code for access token.
    request.post(accessTokenUrl, {json: true, form: params}, function (err, response, token) {
        var accessToken = token.access_token;
        var headers = {Authorization: 'Bearer ' + accessToken};

        // Step 2. Retrieve profile information about the current user.
        request.get({url: peopleApiUrl, headers: headers, json: true}, function (err, response, profile) {
            if (profile.error) {
                return res.status(500).send({message: profile.error.message});
            }
            MongoPool.getInstance(function (db) {
                db.collection('users', function (err, users) {
                    if (err != null) {
                        console.log('post(/auth/google) error: db.collection()');
                        return res.status(500).send({message: err.message});
                    }
                    // Step 3a. Link user accounts.
                    if (req.header('Authorization')) {
                        users.findOne({google: profile.sub}, function (err, existingUser) {
                            if (existingUser) {
                                console.log('post(/auth/google) error: existing google account');
                                return res.status(409).send({message: 'There is already a Google account that belongs to you'});
                            }
                            var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');
                            var payload = jwt.decode(token, config.TOKEN_SECRET);
                            users.findOne({"_id": new ObjectId(payload.sub)}, function (err, user) {
                                if (!user) {
                                    console.log('post(/auth/google) error: User not found');
                                    return res.status(400).send({message: 'User not found'});
                                }
                                user.google = profile.sub;
                                user.picture = user.picture || profile.picture.replace('sz=50', 'sz=200');
                                user.displayName = user.displayName || profile.name;
                                users.save(user, function (err) {
                                    if (err) {
                                        console.log('post(/auth/google) error: collection.save()');
                                        return res.status(500).send({message: err.message});
                                    }
                                    var token = createJWT(user);
                                    return res.send({token: token});
                                });
                            });
                        });
                    } else {
                        // Step 3b. Create a new user account or return an existing one.
                        users.findOne({google: profile.sub}, function (err, existingUser) {
                            if (existingUser) {
                                console.log('post(/auth/google) returning existing google account');
                                return res.send({token: createJWT(existingUser)});
                            }
                            var user = {
                                google: profile.sub,
                                picture: profile.picture.replace('sz=50', 'sz=200'),
                                displayName: profile.name,
                                activities: []
                            };
                            users.insertOne(user, function (err) {
                                if (err) {
                                    console.log('post(/auth/google) error: collection.insertOne()');
                                    return res.status(500).send({message: err.message});
                                }
                                var token = createJWT(user);
                                return res.send({token: token});
                            });
                        });
                    }
                });
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Login with GitHub
 |--------------------------------------------------------------------------
 */
app.post('/auth/github', function (req, res) {
    var accessTokenUrl = 'https://github.com/login/oauth/access_token';
    var userApiUrl = 'https://api.github.com/user';
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: config.GITHUB_SECRET,
        redirect_uri: req.body.redirectUri
    };

    // Step 1. Exchange authorization code for access token.
    request.get({url: accessTokenUrl, qs: params}, function (err, response, accessToken) {
        accessToken = qs.parse(accessToken);
        var headers = {'User-Agent': 'Satellizer'};

        // Step 2. Retrieve profile information about the current user.
        request.get({
            url: userApiUrl,
            qs: accessToken,
            headers: headers,
            json: true
        }, function (err, response, profile) {
            MongoPool.getInstance(function (db) {
                db.collection('users', function (err, users) {
                    if (err != null) {
                        console.log('post(/auth/github) error: db.collection()');
                        return res.status(500).send({message: err.message});
                    }
                    // Step 3a. Link user accounts.
                    if (req.header('Authorization')) {
                        users.findOne({github: profile.id}, function (err, existingUser) {
                            if (existingUser) {
                                console.log('post(/auth/github) error: existing github account');
                                return res.status(409).send({message: 'There is already a Github account that belongs to you'});
                            }
                            var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');
                            var payload = jwt.decode(token, config.TOKEN_SECRET);
                            users.findOne({"_id": new ObjectId(payload.sub)}, function (err, user) {
                                if (!user) {
                                    console.log('post(/auth/github) error: User not found');
                                    return res.status(400).send({message: 'User not found'});
                                }
                                user.github = profile.id;
                                user.picture = user.picture || profile.avatar_url;
                                user.displayName = user.displayName || profile.name;
                                users.save(user, function (err) {
                                    if (err) {
                                        console.log('post(/auth/github) error: collection.save()');
                                        return res.status(500).send({message: err.message});
                                    }
                                    var token = createJWT(user);
                                    return res.send({token: token});
                                });
                            });
                        });
                    } else {
                        // Step 3b. Create a new user account or return an existing one.
                        users.findOne({github: profile.id}, function (err, existingUser) {
                            if (existingUser) {
                                console.log('post(/auth/github) returning existing github account');
                                return res.send({token: createJWT(existingUser)});
                            }
                            var user = {
                                github: profile.id,
                                picture: profile.avatar_url,
                                displayName: profile.name,
                                activities: []
                            };
                            users.insertOne(user, function (err) {
                                if (err) {
                                    console.log('post(/auth/github) error: collection.insertOne()');
                                    return res.status(500).send({message: err.message});
                                }
                                var token = createJWT(user);
                                return res.send({token: token});
                            });
                        });
                    }
                });
            });
        });
    });
});

/*
|--------------------------------------------------------------------------
| Login with Instagram
|--------------------------------------------------------------------------
*/
app.post('/auth/instagram', function (req, res) {
    var accessTokenUrl = 'https://api.instagram.com/oauth/access_token';

    var params = {
        client_id: req.body.clientId,
        redirect_uri: req.body.redirectUri,
        client_secret: config.INSTAGRAM_SECRET,
        code: req.body.code,
        grant_type: 'authorization_code'
    };

    // Step 1. Exchange authorization code for access token.
    request.post({url: accessTokenUrl, form: params, json: true}, function (error, response, body) {
        MongoPool.getInstance(function (db) {
            db.collection('users', function (err, users) {
                if (err != null) {
                    console.log('post(/auth/instagram) error: db.collection()');
                    return res.status(500).send({message: err.message});
                }
                // Step 2a. Link user accounts.
                if (req.header('Authorization')) {
                    users.findOne({instagram: body.user.id}, function (err, existingUser) {
                        if (existingUser) {
                            console.log('post(/auth/instagram) error: existing instagram account');
                            return res.status(409).send({message: 'There is already an Instagram account that belongs to you'});
                        }
                        var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');
                        var payload = jwt.decode(token, config.TOKEN_SECRET);
                        users.findOne({"_id": new ObjectId(payload.sub)}, function (err, user) {
                            if (!user) {
                                console.log('post(/auth/instagram) error: User not found');
                                return res.status(400).send({message: 'User not found'});
                            }
                            user.instagram = body.user.id;
                            user.picture = user.picture || body.user.profile_picture;
                            user.displayName = user.displayName || body.user.username;
                            users.save(user, function (err) {
                                if (err) {
                                    console.log('post(/auth/instagram) error: collection.save()');
                                    return res.status(500).send({message: err.message});
                                }
                                var token = createJWT(user);
                                return res.send({token: token});
                            });
                        });
                    });
                } else {
                    // Step 2b. Create a new user account or return an existing one.
                    users.findOne({instagram: body.user.id}, function (err, existingUser) {
                        if (existingUser) {
                            console.log('post(/auth/instagram) returning existing instagram account');
                            return res.send({token: createJWT(existingUser)});
                        }
                        var user = {
                            instagram: body.user.id,
                            picture: body.user.profile_picture,
                            displayName: body.user.username,
                            activities: []
                        }
                        users.insertOne(user, function (err) {
                            if (err) {
                                console.log('post(/auth/instagram) error: collection.insertOne()');
                                return res.status(500).send({message: err.message});
                            }
                            var token = createJWT(user);
                            return res.send({token: token});
                        });
                    });
                }
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Login with LinkedIn
 |--------------------------------------------------------------------------
 */
app.post('/auth/linkedin', function (req, res) {
    var accessTokenUrl = 'https://www.linkedin.com/uas/oauth2/accessToken';
    var peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url)';
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: config.LINKEDIN_SECRET,
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
    };

    // Step 1. Exchange authorization code for access token.
    request.post(accessTokenUrl, {form: params, json: true}, function (err, response, body) {
        if (response.statusCode !== 200) {
            return res.status(response.statusCode).send({message: body.error_description});
        }
        var params = {
            oauth2_access_token: body.access_token,
            format: 'json'
        };

        // Step 2. Retrieve profile information about the current user.
        request.get({url: peopleApiUrl, qs: params, json: true}, function (err, response, profile) {
            MongoPool.getInstance(function (db) {
                db.collection('users', function (err, users) {
                    if (err != null) {
                        console.log('post(/auth/linkedin) error: db.collection()');
                        return res.status(500).send({message: err.message});
                    }
                    // Step 3a. Link user accounts.
                    if (req.header('Authorization')) {
                        users.findOne({linkedin: profile.id}, function (err, existingUser) {
                            if (existingUser) {
                                console.log('post(/auth/linkedin) error: existing linkedin account');
                                return res.status(409).send({message: 'There is already a Linkedin account that belongs to you'});
                            }
                            var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');
                            var payload = jwt.decode(token, config.TOKEN_SECRET);
                            users.findOne({"_id": new ObjectId(payload.sub)}, function (err, user) {
                                if (!user) {
                                    console.log('post(/auth/linkedin) error: User not found');
                                    return res.status(400).send({message: 'User not found'});
                                }
                                user.linkedin = profile.id;
                                user.picture = user.picture || profile.pictureUrl;
                                user.displayName = user.displayName || profile.firstName + ' ' + profile.lastName;
                                users.save(user, function (err) {
                                    if (err) {
                                        console.log('post(/auth/linkedin) error: collection.save()');
                                        return res.status(500).send({message: err.message});
                                    }
                                    var token = createJWT(user);
                                    return res.send({token: token});
                                });
                            });
                        });
                    } else {
                        // Step 3b. Create a new user account or return an existing one.
                        users.findOne({linkedin: profile.id}, function (err, existingUser) {
                            if (existingUser) {
                                console.log('post(/auth/linkedin) returning existing linkedin account');
                                return res.send({token: createJWT(existingUser)});
                            }
                            var user = {
                                linkedin: profile.id,
                                picture: profile.pictureUrl,
                                displayName: profile.firstName + ' ' + profile.lastName,
                                activities: []
                            }
                            users.insertOne(user, function (err) {
                                if (err) {
                                    console.log('post(/auth/linkedin) error: collection.insertOne()');
                                    return res.status(500).send({message: err.message});
                                }
                                var token = createJWT(user);
                                return res.send({token: token});
                            });
                        });
                    }
                });
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Login with Windows Live
 |--------------------------------------------------------------------------
 */
app.post('/auth/live', function (req, res) {
    async.waterfall([
        // Step 1. Exchange authorization code for access token.
        function (done) {
            var accessTokenUrl = 'https://login.live.com/oauth20_token.srf';
            var params = {
                code: req.body.code,
                client_id: req.body.clientId,
                client_secret: config.WINDOWS_LIVE_SECRET,
                redirect_uri: req.body.redirectUri,
                grant_type: 'authorization_code'
            };
            request.post(accessTokenUrl, {form: params, json: true}, function (err, response, accessToken) {
                done(null, accessToken);
            });
        },
        // Step 2. Retrieve profile information about the current user.
        function (accessToken, done) {
            var profileUrl = 'https://apis.live.net/v5.0/me?access_token=' + accessToken.access_token;
            request.get({url: profileUrl, json: true}, function (err, response, profile) {
                done(err, profile);
            });
        },
        function (profile) {
            MongoPool.getInstance(function (db) {
                db.collection('users', function (err, users) {
                    if (err != null) {
                        console.log('post(/auth/linkedin) error: db.collection()');
                        return res.status(500).send({message: err.message});
                    }
                    // Step 3a. Link user accounts.
                    if (req.header('Authorization')) {
                        users.findOne({live: profile.id}, function (err, existingUser) {
                            if (existingUser) {
                                console.log('post(/auth/live) error: existing live account');
                                return res.status(409).send({message: 'There is already a Live account that belongs to you'});
                            }
                            var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');
                            var payload = jwt.decode(token, config.TOKEN_SECRET);
                            users.findOne({"_id": new ObjectId(payload.sub)}, function (err, user) {
                                if (!user) {
                                    console.log('post(/auth/live) error: User not found');
                                    return res.status(400).send({message: 'User not found'});
                                }
                                user.live = profile.id;
                                user.displayName = user.displayName || profile.name;
                                users.save(user, function (err) {
                                    if (err) {
                                        console.log('post(/auth/live) error: collection.save()');
                                        return res.status(500).send({message: err.message});
                                    }
                                    var token = createJWT(user);
                                    return res.send({token: token});
                                });
                            });
                        });
                    } else {
                        // Step 3b. Create a new user account or return an existing one.
                        users.findOne({live: profile.id}, function (err, existingUser) {
                            if (existingUser) {
                                console.log('post(/auth/live) returning existing live account');
                                return res.send({token: createJWT(existingUser)});
                            }
                            var user = {
                                live: profile.id,
                                displayName: profile.name,
                                activities: []
                            }
                            users.insertOne(user, function (err) {
                                if (err) {
                                    console.log('post(/auth/live) error: collection.insertOne()');
                                    return res.status(500).send({message: err.message});
                                }
                                var token = createJWT(user);
                                return res.send({token: token});
                            });
                        });
                    }
                });
            });
        }
    ]);
});

/*
 |--------------------------------------------------------------------------
 | Login with Facebook
 |--------------------------------------------------------------------------
 */
app.post('/auth/facebook', function (req, res) {
    var fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name'];
    var accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
    var graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: config.FACEBOOK_SECRET,
        redirect_uri: req.body.redirectUri
    };

    if (req.body.accessToken) {
        retrieveProfileInformation(req.body.accessToken);
    }
    else {
        //Step 1. Exchange authorization code for access token.
        request.get({url: accessTokenUrl, qs: params, json: true}, function (err, response, accessToken) {
            if (response.statusCode !== 200) {
                return res.status(500).send({message: accessToken.error.message});
            }
            retrieveProfileInformation(accessToken);
        });
    }


    function retrieveProfileInformation(accessToken) {
        // Step 2. Retrieve profile information about the current user.
        request.get({url: graphApiUrl, qs: accessToken, json: true}, function (err, response, profile) {
            if (response.statusCode !== 200) {
                return res.status(500).send({message: profile.error.message});
            }
            MongoPool.getInstance(function (db) {
                db.collection('users', function (err, users) {
                    if (err != null) {
                        console.log('post(/auth/facebook) error: db.collection()');
                        return res.status(500).send({message: err.message});
                    }
                    // Step 3a. Link user accounts.
                    if (req.header('Authorization')) {
                        users.findOne({facebook: profile.id}, function (err, existingUser) {
                            if (existingUser) {
                                console.log('post(/auth/facebook) error: existing facebook account');
                                return res.status(409).send({message: 'There is already a Facebook account that belongs to you'});
                            }
                            var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');
                            var payload = jwt.decode(token, config.TOKEN_SECRET);
                            users.findOne({"_id": new ObjectId(payload.sub)}, function (err, user) {
                                if (!user) {
                                    console.log('post(/auth/facebook) error: User not found');
                                    return res.status(400).send({message: 'User not found'});
                                }
                                user.facebook = profile.id;
                                user.picture = user.picture || 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
                                user.displayName = user.displayName || profile.name;
                                users.save(user, function (err) {
                                    if (err) {
                                        console.log('post(/auth/facebook) error: collection.save()');
                                        return res.status(500).send({message: err.message});
                                    }
                                    var token = createJWT(user);
                                    return res.send({token: token});
                                });
                            });
                        });
                    } else {
                        // Step 3b. Create a new user account or return an existing one.
                        users.findOne({facebook: profile.id}, function (err, existingUser) {
                            if (existingUser) {
                                console.log('post(/auth/facebook) returning existing facebook account');
                                return res.send({token: createJWT(existingUser)});
                            }
                            var user = {
                                facebook: profile.id,
                                picture: 'https://graph.facebook.com/' + profile.id + '/picture?type=large',
                                displayName: profile.name,
                                activities: []
                            };
                            users.insertOne(user, function (err) {
                                if (err) {
                                    console.log('post(/auth/facebook) error: collection.insertOne()');
                                    return res.status(500).send({message: err.message});
                                }
                                var token = createJWT(user);
                                return res.send({token: token});
                            });
                        });
                    }
                });
            });

        });
    }
});

/*
 |--------------------------------------------------------------------------
 | Login with Yahoo
 |--------------------------------------------------------------------------
 */
app.post('/auth/yahoo', function (req, res) {
    var accessTokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';
    var clientId = req.body.clientId;
    var clientSecret = config.YAHOO_SECRET;
    var formData = {
        code: req.body.code,
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
    };
    var headers = {Authorization: 'Basic ' + new Buffer(clientId + ':' + clientSecret).toString('base64')};

    // Step 1. Exchange authorization code for access token.
    request.post({url: accessTokenUrl, form: formData, headers: headers, json: true}, function (err, response, body) {
        var socialApiUrl = 'https://social.yahooapis.com/v1/user/' + body.xoauth_yahoo_guid + '/profile?format=json';
        var headers = {Authorization: 'Bearer ' + body.access_token};

        // Step 2. Retrieve profile information about the current user.
        request.get({url: socialApiUrl, headers: headers, json: true}, function (err, response, body) {

            // Step 3a. Link user accounts.
            if (req.header('Authorization')) {
                users.findOne({yahoo: body.profile.guid}, function (err, existingUser) {
                    if (existingUser) {
                        console.log('post(/auth/yahoo) error: existing yahoo account');
                        return res.status(409).send({message: 'There is already a Yahoo account that belongs to you'});
                    }
                    var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');
                    var payload = jwt.decode(token, config.TOKEN_SECRET);
                    users.findOne({"_id": new ObjectId(payload.sub)}, function (err, user) {
                        if (!user) {
                            console.log('post(/auth/yahoo) error: User not found');
                            return res.status(400).send({message: 'User not found'});
                        }
                        user.yahoo = body.profile.guid;
                        user.displayName = user.displayName || body.profile.nickname;
                        users.save(user, function (err) {
                            if (err) {
                                console.log('post(/auth/yahoo) error: collection.save()');
                                return res.status(500).send({message: err.message});
                            }
                            var token = createJWT(user);
                            return res.send({token: token});
                        });
                    });
                });
            } else {
                // Step 3b. Create a new user account or return an existing one.
                users.findOne({yahoo: body.profile.guid}, function (err, existingUser) {
                    if (existingUser) {
                        console.log('post(/auth/yahoo) returning existing yahoo account');
                        return res.send({token: createJWT(existingUser)});
                    }
                    var user = {
                        yahoo: body.profile.guid,
                        displayName: body.profile.nickname,
                        activities: []
                    }
                    users.insertOne(user, function (err) {
                        if (err) {
                            console.log('post(/auth/yahoo) error: collection.insertOne()');
                            return res.status(500).send({message: err.message});
                        }
                        var token = createJWT(user);
                        return res.send({token: token});
                    });
                });
            }
        });
    });
});

// /*
//  |--------------------------------------------------------------------------
//  | Login with Twitter
//  | Note: Make sure "Request email addresses from users" is enabled
//  | under Permissions tab in your Twitter app. (https://apps.twitter.com)
//  |--------------------------------------------------------------------------
//  */
// app.post('/auth/twitter', function(req, res) {
//   var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
//   var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
//   var profileUrl = 'https://api.twitter.com/1.1/account/verify_credentials.json';

//   // Part 1 of 2: Initial request from Satellizer.
//   if (!req.body.oauth_token || !req.body.oauth_verifier) {
//     var requestTokenOauth = {
//       consumer_key: config.TWITTER_KEY,
//       consumer_secret: config.TWITTER_SECRET,
//       callback: req.body.redirectUri
//     };

//     // Step 1. Obtain request token for the authorization popup.
//     request.post({ url: requestTokenUrl, oauth: requestTokenOauth }, function(err, response, body) {
//       var oauthToken = qs.parse(body);

//       // Step 2. Send OAuth token back to open the authorization screen.
//       res.send(oauthToken);
//     });
//   } else {
//     // Part 2 of 2: Second request after Authorize app is clicked.
//     var accessTokenOauth = {
//       consumer_key: config.TWITTER_KEY,
//       consumer_secret: config.TWITTER_SECRET,
//       token: req.body.oauth_token,
//       verifier: req.body.oauth_verifier
//     };

//     // Step 3. Exchange oauth token and oauth verifier for access token.
//     request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function(err, response, accessToken) {

//       accessToken = qs.parse(accessToken);

//       var profileOauth = {
//         consumer_key: config.TWITTER_KEY,
//         consumer_secret: config.TWITTER_SECRET,
//         token: accessToken.oauth_token,
//         token_secret: accessToken.oauth_token_secret,
//       };

//       // Step 4. Retrieve user's profile information and email address.
//       request.get({
//         url: profileUrl,
//         qs: { include_email: true },
//         oauth: profileOauth,
//         json: true
//       }, function(err, response, profile) {

//         // Step 5a. Link user accounts.
//         if (req.header('Authorization')) {
//           User.findOne({ twitter: profile.id }, function(err, existingUser) {
//             if (existingUser) {
//               return res.status(409).send({ message: 'There is already a Twitter account that belongs to you' });
//             }

//             var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');
//             var payload = jwt.decode(token, config.TOKEN_SECRET);

//             User.findById(payload.sub, function(err, user) {
//               if (!user) {
//                 return res.status(400).send({ message: 'User not found' });
//               }

//               user.twitter = profile.id;
//               user.email = profile.email;
//               user.displayName = user.displayName || profile.name;
//               user.picture = user.picture || profile.profile_image_url_https.replace('_normal', '');
//               user.save(function(err) {
//                 res.send({ token: createJWT(user) });
//               });
//             });
//           });
//         } else {
//           // Step 5b. Create a new user account or return an existing one.
//           User.findOne({ twitter: profile.id }, function(err, existingUser) {
//             if (existingUser) {
//               return res.send({ token: createJWT(existingUser) });
//             }

//             var user = new User();
//             user.twitter = profile.id;
//             user.email = profile.email;
//             user.displayName = profile.name;
//             user.picture = profile.profile_image_url_https.replace('_normal', '');
//             user.save(function() {
//               res.send({ token: createJWT(user) });
//             });
//           });
//         }
//       });
//     });
//   }
// });

// /*
//  |--------------------------------------------------------------------------
//  | Login with Foursquare
//  |--------------------------------------------------------------------------
//  */
// app.post('/auth/foursquare', function(req, res) {
//   var accessTokenUrl = 'https://foursquare.com/oauth2/access_token';
//   var profileUrl = 'https://api.foursquare.com/v2/users/self';
//   var formData = {
//     code: req.body.code,
//     client_id: req.body.clientId,
//     client_secret: config.FOURSQUARE_SECRET,
//     redirect_uri: req.body.redirectUri,
//     grant_type: 'authorization_code'
//   };

//   // Step 1. Exchange authorization code for access token.
//   request.post({ url: accessTokenUrl, form: formData, json: true }, function(err, response, body) {
//     var params = {
//       v: '20140806',
//       oauth_token: body.access_token
//     };

//     // Step 2. Retrieve information about the current user.
//     request.get({ url: profileUrl, qs: params, json: true }, function(err, response, profile) {
//       profile = profile.response.user;

//       // Step 3a. Link user accounts.
//       if (req.header('Authorization')) {
//         User.findOne({ foursquare: profile.id }, function(err, existingUser) {
//           if (existingUser) {
//             return res.status(409).send({ message: 'There is already a Foursquare account that belongs to you' });
//           }
//           var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');
//           var payload = jwt.decode(token, config.TOKEN_SECRET);
//           User.findById(payload.sub, function(err, user) {
//             if (!user) {
//               return res.status(400).send({ message: 'User not found' });
//             }
//             user.foursquare = profile.id;
//             user.picture = user.picture || profile.photo.prefix + '300x300' + profile.photo.suffix;
//             user.displayName = user.displayName || profile.firstName + ' ' + profile.lastName;
//             user.save(function() {
//               var token = createJWT(user);
//               res.send({ token: token });
//             });
//           });
//         });
//       } else {
//         // Step 3b. Create a new user account or return an existing one.
//         User.findOne({ foursquare: profile.id }, function(err, existingUser) {
//           if (existingUser) {
//             var token = createJWT(existingUser);
//             return res.send({ token: token });
//           }
//           var user = new User();
//           user.foursquare = profile.id;
//           user.picture = profile.photo.prefix + '300x300' + profile.photo.suffix;
//           user.displayName = profile.firstName + ' ' + profile.lastName;
//           user.save(function() {
//             var token = createJWT(user);
//             res.send({ token: token });
//           });
//         });
//       }
//     });
//   });
// });

// /*
//  |--------------------------------------------------------------------------
//  | Login with Twitch
//  |--------------------------------------------------------------------------
//  */
// app.post('/auth/twitch', function(req, res) {
//   var accessTokenUrl = 'https://api.twitch.tv/kraken/oauth2/token';
//   var profileUrl = 'https://api.twitch.tv/kraken/user';
//   var formData = {
//     code: req.body.code,
//     client_id: req.body.clientId,
//     client_secret: config.TWITCH_SECRET,
//     redirect_uri: req.body.redirectUri,
//     grant_type: 'authorization_code'
//   };

//   // Step 1. Exchange authorization code for access token.
//   request.post({ url: accessTokenUrl, form: formData, json: true }, function(err, response, accessToken) {
//    var params = {
//      oauth_token: accessToken.access_token
//    };

//     // Step 2. Retrieve information about the current user.
//     request.get({ url: profileUrl, qs: params, json: true }, function(err, response, profile) {
//       // Step 3a. Link user accounts.
//       if (req.header('Authorization')) {
//         User.findOne({ twitch: profile._id }, function(err, existingUser) {
//           if (existingUser) {
//             return res.status(409).send({ message: 'There is already a Twitch account that belongs to you' });
//           }
//           var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');
//           var payload = jwt.decode(token, config.TOKEN_SECRET);
//           User.findById(payload.sub, function(err, user) {
//             if (!user) {
//               return res.status(400).send({ message: 'User not found' });
//             }
//             user.twitch = profile._id;
//             user.picture = user.picture || profile.logo;
//             user.displayName = user.name || profile.name;
//             user.email = user.email || profile.email;
//             user.save(function() {
//               var token = createJWT(user);
//               res.send({ token: token });
//             });
//           });
//         });
//       } else {
//         // Step 3b. Create a new user account or return an existing one.
//         User.findOne({ twitch: profile._id }, function(err, existingUser) {
//           if (existingUser) {
//             var token = createJWT(existingUser);
//             return res.send({ token: token });
//           }
//           var user = new User();
//           user.twitch = profile._id;
//           user.picture = profile.logo;
//           user.displayName = profile.name;
//           user.email = profile.email;
//           user.save(function() {
//             var token = createJWT(user);
//             res.send({ token: token });
//           });
//         });
//       }
//     });
//   });
// });

// /*
//  |--------------------------------------------------------------------------
//  | Login with Bitbucket
//  |--------------------------------------------------------------------------
//  */
// app.post('/auth/bitbucket', function(req, res) {
//   var accessTokenUrl = 'https://bitbucket.org/site/oauth2/access_token';
//   var userApiUrl = 'https://bitbucket.org/api/2.0/user';
//   var emailApiUrl = 'https://bitbucket.org/api/2.0/user/emails';

//   var headers = {
//     Authorization: 'Basic ' + new Buffer(req.body.clientId + ':' + config.BITBUCKET_SECRET).toString('base64')
//   };

//   var formData = {
//     code: req.body.code,
//     redirect_uri: req.body.redirectUri,
//     grant_type: 'authorization_code'
//   };

//   // Step 1. Exchange authorization code for access token.
//   request.post({ url: accessTokenUrl, form: formData, headers: headers, json: true }, function(err, response, body) {
//     if (body.error) {
//       return res.status(400).send({ message: body.error_description });
//     }

//     var params = {
//       access_token: body.access_token
//     };

//     // Step 2. Retrieve information about the current user.
//     request.get({ url: userApiUrl, qs: params, json: true }, function(err, response, profile) {

//       // Step 2.5. Retrieve current user's email.
//       request.get({ url: emailApiUrl, qs: params, json: true }, function(err, response, emails) {
//         var email = emails.values[0].email;

//         // Step 3a. Link user accounts.
//         if (req.header('Authorization')) {
//           User.findOne({ bitbucket: profile.uuid }, function(err, existingUser) {
//             if (existingUser) {
//               return res.status(409).send({ message: 'There is already a Bitbucket account that belongs to you' });
//             }
//             var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');
//             var payload = jwt.decode(token, config.TOKEN_SECRET);
//             User.findById(payload.sub, function(err, user) {
//               if (!user) {
//                 return res.status(400).send({ message: 'User not found' });
//               }
//               user.bitbucket = profile.uuid;
//               user.email = user.email || email;
//               user.picture = user.picture || profile.links.avatar.href;
//               user.displayName = user.displayName || profile.display_name;
//               user.save(function() {
//                 var token = createJWT(user);
//                 res.send({ token: token });
//               });
//             });
//           });
//         } else {
//           // Step 3b. Create a new user account or return an existing one.
//           User.findOne({ bitbucket: profile.id }, function(err, existingUser) {
//             if (existingUser) {
//               var token = createJWT(existingUser);
//               return res.send({ token: token });
//             }
//             var user = new User();
//             user.bitbucket = profile.uuid;
//             user.email = email;
//             user.picture = profile.links.avatar.href;
//             user.displayName = profile.display_name;
//             user.save(function() {
//               var token = createJWT(user);
//               res.send({ token: token });
//             });
//           });
//         }
//       });
//     });
//   });
// });

// /*
//  |--------------------------------------------------------------------------
//  | Login with Spotify
//  |--------------------------------------------------------------------------
//  */

//  app.post('/auth/spotify', function(req, res) {
//    var tokenUrl = 'https://accounts.spotify.com/api/token';
//    var userUrl = 'https://api.spotify.com/v1/me';

//    var params = {
//      grant_type: 'authorization_code',
//      code: req.body.code,
//      redirect_uri: req.body.redirectUri
//    };

//    var headers = {
//      Authorization: 'Basic ' + new Buffer(req.body.clientId + ':' + config.SPOTIFY_SECRET).toString('base64')
//    };

//    request.post(tokenUrl, { json: true, form: params, headers: headers }, function(err, response, body) {
//      if (body.error) {
//        return res.status(400).send({ message: body.error_description });
//      }

//      request.get(userUrl, {json: true, headers: {Authorization: 'Bearer ' + body.access_token} }, function(err, response, profile){
//        // Step 3a. Link user accounts.
//        if (req.header('Authorization')) {
//          User.findOne({ spotify: profile.id }, function(err, existingUser) {
//            if (existingUser) {
//              return res.status(409).send({ message: 'There is already a Spotify account that belongs to you' });
//            }
//            var token = req.header('Authorization').split(' ')[1].replace("\"", '').replace("\"", '');
//            var payload = jwt.decode(token, config.TOKEN_SECRET);
//            User.findById(payload.sub, function(err, user) {
//              if (!user) {
//                return res.status(400).send({ message: 'User not found' });
//              }
//              user.spotify = profile.id;
//              user.email = user.email || profile.email;
//              user.picture = profile.images.length > 0 ? profile.images[0].url : '';
//              user.displayName = user.displayName || profile.displayName || profile.id;

//              user.save(function() {
//                var token = createJWT(user);
//                res.send({ token: token });
//              });
//            });
//          });
//        } else {
//          // Step 3b. Create a new user account or return an existing one.
//          User.findOne({ spotify: profile.id }, function(err, existingUser) {
//            if (existingUser) {
//              return res.send({ token: createJWT(existingUser) });
//            }
//            var user = new User();
//            user.spotify = profile.id;
//            user.email = profile.email;
//            user.picture = profile.images.length > 0 ? profile.images[0].url : '';
//            user.displayName = profile.displayName || profile.id;

//            user.save(function(err) {
//              var token = createJWT(user);
//              res.send({ token: token });
//            });
//          });
//        }
//      });
//    });
//  });

/*
 |--------------------------------------------------------------------------
 | Unlink Provider
 |--------------------------------------------------------------------------
 */
app.post('/auth/unlink', ensureAuthenticated, function (req, res) {
    var provider = req.body.provider;
    var providers = ['facebook', 'foursquare', 'google', 'github', 'instagram',
        'linkedin', 'live', 'twitter', 'twitch', 'yahoo', 'bitbucket', 'spotify'];

    if (providers.indexOf(provider) === -1) {
        return res.status(400).send({message: 'Unknown OAuth Provider'});
    }

    MongoPool.getInstance(function (db) {
        db.collection('users', function (err, users) {
            if (err != null) {
                console.log('post(/auth/unlink) error: db.collection()');
                return res.status(500).send({message: err.message});
            }
            users.findOne({"_id": new ObjectId(req.user)}, function (err, user) {
                if (!user) {
                    console.log('post(/auth/unlink) error: User Not Found');
                    return res.status(400).send({message: 'User Not Found'});
                }
                user[provider] = undefined;
                users.save(user, function (err) {
                    if (err) {
                        console.log('post(/auth/unlink) error: collection.save()');
                        return res.status(500).send({message: err.message});
                    }
                    console.log('post(/auth/unlink) success: user = ' + user);
                    res.status(200).end();
                });
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | GET /activity/all - Get all existing activities
 |--------------------------------------------------------------------------
 */
app.get('/activity/all', ensureAuthenticated, function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('activities', function (err, activities) {
            if (err != null) {
                console.log('get(/activity/all) error: db.collection(activities)');
                return res.status(500).send({message: err.message});
            }
            var nowMS = (new Date()).getTime();
            activities.find({datetimeMS: {$gte: nowMS}}).toArray(function (err, activityArr) {
                if (err != null) {
                    console.log('get(/activity/all) error: collection.find(activities)');
                    return res.status(500).send({message: err.message});
                }
                if (activityArr.length == 0) {
                    return res.send(activityArr);
                }
                activityArr.sort(function (a1, a2) {
                    return a1.datetimeMS - a2.datetimeMS;
                });
                db.collection('users', function (err, users) {
                    if (err != null) {
                        console.log('get(/activity/all) error: db.collection(users)');
                        return res.status(500).send({message: err.message});
                    }
                    var organizerIDs = activityArr.map(function(activity) {
                        return new ObjectId(activity.organizer);
                    });
                    users.find({_id: {$in: organizerIDs}}, {
                        fields: {
                            displayName: 1
                        }
                    }).toArray(function (err, organizerArr) {
                        if (err != null) {
                            console.log('get(/activity/all) error: collection.find(activities.organizers)');
                            return res.status(500).send({message: err.message});
                        }
                        organizerIDs = organizerArr.map(function(organizer) {
                            return organizer._id.toString();
                        });
                        var i;
                        activityArr.forEach(function (activity, index, arr) {
                            delete arr[index].extraDetails;
                            arr[index].organizerName = "";
                            i = organizerIDs.indexOf(arr[index].organizer);
                            if (i != -1) {
                                arr[index].organizerName = organizerArr[i].displayName;
                            }
                            delete arr[index].organizer;
                            arr[index].nParticipants = activity.users.length;
                        });
                        res.send(activityArr);
                    });
                });
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | GET /guest/activity/all - Get all existing activities For Non-Registered user
 |--------------------------------------------------------------------------
 */
app.get('/guest/activity/all', function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('activities', function (err, activities) {
            if (err != null) {
                console.log('get(/guest/activity/all) error: db.collection(activities)');
                return res.status(500).send({message: err.message});
            }
            var nowMS = (new Date()).getTime();
            activities.find({datetimeMS: {$gte: nowMS}}).toArray(function (err, activityArr) {
                if (err != null) {
                    console.log('get(/guest/activity/all) error: collection.find(activities)');
                    return res.status(500).send({message: err.message});
                }
                if (activityArr.length == 0) {
                    return res.send(activityArr);
                }
                activityArr.sort(function (a1, a2) {
                    return a1.datetimeMS - a2.datetimeMS;
                });
                db.collection('users', function (err, users) {
                    if (err != null) {
                        console.log('get(/guest/activity/all) error: db.collection(users)');
                        return res.status(500).send({message: err.message});
                    }
                    var organizerIDs = activityArr.map(function(activity) {
                        return new ObjectId(activity.organizer);
                    });
                    users.find({_id: {$in: organizerIDs}}, {
                        fields: {
                            displayName: 1
                        }
                    }).toArray(function (err, organizerArr) {
                        if (err != null) {
                            console.log('get(/guest/activity/all) error: collection.find(activities.organizers)');
                            return res.status(500).send({message: err.message});
                        }
                        organizerIDs = organizerArr.map(function(organizer) {
                            return organizer._id.toString();
                        });
                        var i;
                        activityArr.forEach(function (activity, index, arr) {
                            delete arr[index].extraDetails;
                            arr[index].organizerName = "";
                            i = organizerIDs.indexOf(arr[index].organizer);
                            if (i != -1) {
                                arr[index].organizerName = organizerArr[i].displayName;
                            }
                            delete arr[index].organizer;
                            arr[index].nParticipants = activity.users.length;
                            delete arr[index].users; // only for non-registered guests
                        });
                        res.send(activityArr);
                    });
                });
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | GET /activity/single - Get Data of a Single Activity
 |--------------------------------------------------------------------------
 */
app.get('/activity/single/:id', ensureAuthenticated, function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('activities', function (err, activities) {
            if (err != null) {
                console.log('get(/activity/single) error: db.collection(activities)');
                return res.status(500).send({message: err.message});
            }
            activities.findOne({"_id": new ObjectId(req.params.id)}, function (err, activity) {
                if (err != null) {
                    console.log('get(/activity/single) error: collection.findOne(activityId)');
                    return res.status(500).send({message: err.message});
                }
                activity.nParticipants = activity.users.length;
                db.collection('users', function (err, users) {
                    if (err != null) {
                        console.log('get(/activity/single/user) error: db.collection(users)');
                        return res.status(500).send({message: err.message});
                    }
                    users.findOne({"_id": new ObjectId(activity.organizer)}, function (err, user) {
                        activity.organizerName = user.displayName;
                        activity.organizerPhone = user.phone;
                        var userIDs = activity.users.map(function (userId) {
                            return new ObjectId(userId);
                        });
                        users.find({_id: {$in: userIDs}}, {
                            fields: {
                                _id: 1,
                                displayName: 1
                            }
                        }).toArray(function (err, userArr) {
                            if (err != null) {
                                console.log('get(/activity/single/user) error: collection.find(activity.users)');
                                return res.status(500).send({message: err.message});
                            }
                            activity.participants = userArr;
                            activity.participants.sort(function (p1, p2) {
                                if (p1.displayName < p2.displayName) {return -1;}
                                if (p1.displayName > p2.displayName) {return 1;}
                                return 0;
                            });
                            delete activity.users; // create users list in client using participants list
                            res.send(activity);
                        });
                    });
                });
            });
        });
    });
});
/*
 |--------------------------------------------------------------------------
 | GET /guest/activity/single - Get Data of a Single Activity For Non-Registered user
 |--------------------------------------------------------------------------
 */
app.get('/guest/activity/single/:id', function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('activities', function (err, activities) {
            if (err != null) {
                console.log('get(/guest/activity/single/) error: db.collection(activities)');
                return res.status(500).send({message: err.message});
            }
            activities.findOne({"_id": new ObjectId(req.params.id)}, function (err, activity) {
                if (err != null) {
                    console.log('get(/guest/activity/single/) error: collection.findOne(activityId)');
                    return res.status(500).send({message: err.message});
                }
                activity.nParticipants = activity.users.length;
                db.collection('users', function (err, users) {
                    if (err != null) {
                        console.log('get(/guest/activity/single/) error: db.collection(users)');
                        return res.status(500).send({message: err.message});
                    }
                    users.findOne({"_id": new ObjectId(activity.organizer)}, function (err, user) {
                        if (err != null) {
                            console.log('get(/guest/activity/single/) error: db.collection(users)');
                            return res.status(500).send({message: err.message});
                        }
                        activity.organizerName = user.displayName;
                        delete activity.organizer;
                        delete activity.users;
                        res.send(activity);
                    });

                });
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | POST /activity/create - Create Activity (Group / User) & Add First User
 |--------------------------------------------------------------------------
 */
app.post('/activity/create', ensureAuthenticated, single, function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('users', function (err, users) {
            if (err != null) {
                console.log('post(/activity/create) error: db.collection(users)');
                return res.status(500).send({message: err.message});
            }
            users.findOne({"_id": new ObjectId(req.user)}, function (err, user) {
                if (err != null) {
                    console.log('post(/activity/create) error: collection.findOne(userId)');
                    return res.status(500).send({message: err.message});
                }
                if (!user) {
                    console.log('post(/activity/create) error: No such user');
                    return res.status(409).send({message: 'No such user'});
                }
                db.collection('activities', function (err, activities) {
                    if (err != null) {
                        console.log('post(/activity/create) error: db.collection(activity)');
                        return res.status(500).send({message: err.message});
                    }
                    var activity = {
                        type: req.body.title, // TODO type->title in DB
                        location: req.body.location,
                        extraDetails: req.body.extraDetails,
                        datetimeMS: req.body.datetimeMS,
                        organizer: user._id.toString(),
                        users: [user._id.toString()]
                    };
                    if (req.file) {
                        activity.imgName = req.file.filename;
                    }
                    activities.insertOne(activity, function (err) {
                        if (err) {
                            console.log('post(/activity/create) error: activities.insertOne(newActivity)');
                            return res.status(500).send({message: err.message});
                        }
                        activity.nParticipants = 1;
                        delete activity.users;
                        user.activities.push(activity._id.toString());
                        users.updateOne({_id: new ObjectId(user._id)}, {
                            $set: {
                                activities: user.activities
                            }
                        }, function (err) {
                            if (err) {
                                console.log('post(/activity/create) error: users.updateOne(user.activities)');
                                return res.status(500).send({message: err.message});
                            }
                            if (req.file) {
                                var bodyStream = fs.createReadStream(req.file.path);
                                var params = {
                                    Body: bodyStream,
                                    Bucket: config.S3_BUCKET,
                                    Key: activity._id + '/' + req.file.filename
                                };
                                s3.putObject(params, function (err, data) {
                                    if (err) {
                                        console.log(err, err.stack); // an error occurred
                                        res.status(500).send({message: err.message});
                                    } else {
                                        console.log(data); // successful response
                                        res.send(activity);
                                    }
                                });
                            } else {
                                res.send(activity);
                            }
                        });
                    });
                });
            });
        });
    });
});


/*
 |--------------------------------------------------------------------------
 | POST /activity/update - Update Activity (Group / User)
 |--------------------------------------------------------------------------
 */
app.post('/activity/update', ensureAuthenticated, single, function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('users', function (err, users) {
            if (err) {
                console.log('post(/activity/update) error: db.collection(users)');
                return res.status(500).send({message: err.message});
            }
            users.findOne({"_id": new ObjectId(req.user)}, function (err, user) {
                if (err) {
                    console.log('post(/activity/update) error: collection.findOne(userId)');
                    return res.status(500).send({message: err.message});
                }
                if (!user) {
                    console.log('post(/activity/update) error: No such user');
                    return res.status(409).send({message: 'No such user'});
                }
                db.collection('activities', function (err, activities) {
                    activities.findOne({"_id": new ObjectId(req.body.activityId)}, function (err, activity) {
                        if (err) {
                            console.log('post(/activity/update) error: db.collection(activity)');
                            return res.status(500).send({message: err.message});
                        }
                        if(activity && activity.organizer !== user._id.toString()){
                            console.log('post(/activity/update) error: db.collection(activity)');
                            return res.status(500).send({message: 'Activity Does Not Belong to User'});
                        }
                        if (req.body.imgChange) { // Added / removed / changed / removed and re-added
                            if (req.file) { // Handle add / update / remove and re-add image
                                activities.updateOne({"_id": new ObjectId(activity._id.toString())}, {
                                    $set: {
                                        type: req.body.title,
                                        location: req.body.location,
                                        extraDetails: req.body.extraDetails,
                                        datetimeMS: req.body.datetimeMS,
                                        imgName: req.file.filename // Update image name even if remained the same
                                    }
                                }, function(err){
                                    if (err) {
                                        console.log('post(/activity/update) error: activities.updateOne(newActivity) - image change');
                                        return res.status(500).send({message: err.message});
                                    }
                                    var bodyStream = fs.createReadStream(req.file.path);
                                    var params = {
                                        Body: bodyStream,
                                        Bucket: config.S3_BUCKET,
                                        Key: activity._id + '/' + req.file.filename
                                    };
                                    s3.putObject(params, function (err, data) { // Same S3 SDK call for both adding / updating an image (no error if existed)
                                        if (err) {
                                            console.log(err, err.stack); // an error occurred
                                            return res.status(500).send({message: err.message});
                                        }
                                        console.log(data); // successful response
                                        return res.send(activity);
                                    });
                                });
                            } else { // Handle remove image
                                activities.updateOne({"_id": new ObjectId(activity._id.toString())}, {
                                    $set: {
                                        type: req.body.title,
                                        location: req.body.location,
                                        extraDetails: req.body.extraDetails,
                                        datetimeMS: req.body.datetimeMS
                                    }, 
                                    $unset: {
                                        imgName: "" // Remove imgName field
                                    }
                                }, function(err){
                                    if (err) {
                                        console.log('post(/activity/update) error: activities.updateOne(newActivity) - image change');
                                        return res.status(500).send({message: err.message});
                                    }
                                    var params = {
                                        Bucket: config.S3_BUCKET, 
                                        Key: activity._id + '/' + req.file.filename
                                    };
                                    s3.deleteObject(params, function(err, data) {
                                        if (err) {
                                            console.log(err, err.stack); // an error occurred
                                            res.status(500).send({message: err.message});
                                        }
                                        console.log(data); // successful response
                                        return res.send(activity);
                                     });
                                });
                            }
                        } else { // Image remained the same (not added / removed / changed / removed and re-added), no S3 calls required
                            activities.updateOne({"_id": new ObjectId(activity._id.toString())}, {
                                $set: {
                                    type: req.body.title,
                                    location: req.body.location,
                                    extraDetails: req.body.extraDetails,
                                    datetimeMS: req.body.datetimeMS
                                }
                            }, function(err){
                                if (err) {
                                    console.log('post(/activity/update) error: activities.updateOne(newActivity) - no image change');
                                    return res.status(500).send({message: err.message});
                                }
                                res.send(activity);
                            });
                        }
                    });
                });
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | POST /activity/join - Add User to Existing Activity
 |--------------------------------------------------------------------------
 */
app.post('/activity/join', ensureAuthenticated, function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('users', function (err, users) {
            if (err != null) {
                console.log('post(/activity/join) error: db.collection(users)');
                return res.status(500).send({message: err.message});
            }
            users.findOne({"_id": new ObjectId(req.user)}, function (err, user) {
                if (err != null) {
                    console.log('post(/activity/join) error: collection.findOne(userId)');
                    return res.status(500).send({message: err.message});
                }
                if (!user) {
                    console.log('post(/activity/join) error: No such user');
                    return res.status(409).send({message: 'No such user'});
                }
                db.collection('activities', function (err, activities) {
                    if (err) {
                        console.log('post(/activity/join) error: db.collection(activities)');
                        return res.status(500).send({message: err.message});
                    }
                    activities.findOne({"_id": new ObjectId(req.body.activityId)}, function (err, activity) {
                        if (err) {
                            console.log('post(/activity/join) error: collection.findOne(activityId)');
                            return res.status(500).send({message: err.message});
                        }
                        if (!activity) {
                            console.log('post(/activity/join) error: No such activity');
                            return res.status(409).send({message: 'No such activity'});
                        }
                        if (activity.users.some(function (userId) {
                                return userId.toString() == user._id.toString();
                            })) {
                            console.log('post(/activity/join) error: User is already a participant');
                            return res.status(408).send({message: 'User is already a participant'});
                        }
                        if (user.activities.some(function (activityId) {
                                return activityId.toString() == activity._id.toString();
                            })) {
                            console.log('post(/activity/join) error: User already marked RSVP');
                            return res.status(406).send({message: 'User already marked RSVP'});
                        }
                        activity.users.push(user._id.toString());
                        activities.updateOne({"_id": new ObjectId(activity._id.toString())}, {
                            $set: {
                                users: activity.users
                            }
                        }, function (err) {
                            if (err) {
                                console.log('post(/activity/join) error: collection.updateOne(activities)');
                                return res.status(500).send({message: err.message});
                            }
                            user.activities.push(activity._id.toString());
                            users.updateOne({_id: new ObjectId(user._id)}, {
                                $set: {
                                    activities: user.activities
                                }
                            }, function (err) {
                                if (err) {
                                    console.log('post(/activity/join) error: users.updateOne(user.activities)');
                                    return res.status(500).send({message: err.message});
                                }
                                return res.status(200).send(user);
                            });
                        });
                    });
                });
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | POST /activity/leave - Remove User from Existing Activity
 |--------------------------------------------------------------------------
 */
app.post('/activity/leave', ensureAuthenticated, function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('users', function (err, users) {
            if (err !== null) {
                console.log('post(/activity/leave) error: db.collection(users)');
                return res.status(500).send({message: err.message});
            }
            users.findOne({"_id": new ObjectId(req.user)}, function (err, user) {
                if (err !== null) {
                    console.log('post(/activity/leave) error: collection.findOne(userId)');
                    return res.status(500).send({message: err.message});
                }
                if (!user) {
                    console.log('post(/activity/leave) error: No such user');
                    return res.status(409).send({message: 'No such user'});
                }
                db.collection('activities', function (err, activities) {
                    if (err !== null) {
                        console.log('post(/activity/leave) error: db.collection(activities)');
                        return res.status(500).send({message: err.message});
                    }
                    activities.findOne({"_id": new ObjectId(req.body.activityId)}, function (err, activity) {
                        if (err !== null) {
                            console.log('post(/activity/leave) error: collection.findOne(activityId)');
                            return res.status(500).send({message: err.message});
                        }
                        if (!activity) {
                            console.log('post(/activity/leave) error: No such activity');
                            return res.status(409).send({message: 'No such activity'});
                        }
                        var activityIndex = user.activities.findIndex(function(userActId) { 
                            return (userActId == activity._id.toString());
                        });
                        if (activityIndex == -1) {
                            console.log('post(/activity/leave) error: User does not contain activity');
                            return res.status(406).send({message: 'User does not contain activity'});
                        }
                        var userIndex = activity.users.findIndex(function(actUserId) { 
                            return (actUserId == user._id.toString());
                        });
                        if (userIndex == -1) {
                            console.log('post(/activity/leave) error: activity does not contain user');
                            return res.status(407).send({message: 'activity does not contain user'});;
                        }
                        user.activities.splice(activityIndex, 1);
                        users.updateOne({_id: new ObjectId(user._id)}, {
                            $set: {
                                activities: user.activities
                            }
                        }, function (err) {
                            if (err) {
                                console.log('post(/activity/leave) error: users.updateOne(user.activities)');
                                return res.status(500).send({message: err.message});
                            }
                            activity.users.splice(userIndex, 1);
                            activities.updateOne({"_id": new ObjectId(activity._id.toString())}, {
                                $set: {
                                    users: activity.users
                                }
                            }, function (err) {
                                if (err) {
                                    console.log('post(/activities/leave) error: collection.updateOne(activities)');
                                    return res.status(500).send({message: err.message});
                                }
                                return res.status(200).send(activity._id);
                            });
                        });
                    });
                });
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | POST /remark - Append remark to remarks collection
 |--------------------------------------------------------------------------
 */
app.post('/api/remarks',ensureAuthenticated, function (req, res) {
    MongoPool.getInstance(function (db) {
        db.collection('users', function (err, users) {
            if (err !== null) {
                console.log('post(/api/remarks) error: db.collection(users)');
                return res.status(500).send({message: err.message});
            }
            users.findOne({"_id": new ObjectId(req.user)}, function (err, user) {
                if (err !== null) {
                    console.log('post(/api/remarks) error: collection.findOne(userId)');
                    return res.status(500).send({message: err.message});
                }
                db.collection('remarks', function (err, remarks) {
                    var remark = {
                        text: req.body.remark,
                        userId: user._id.toString()
                    };
                    remarks.insertOne(remark, function (err) {
                        if (err) {
                            console.log('post(/api/remarks) error: collection.insertOne()');
                            return res.status(500).send({message: err.message});
                        }
                        else{
                            return res.status(200).end();
                        }
                    });
                });

            })
        })

    });
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
