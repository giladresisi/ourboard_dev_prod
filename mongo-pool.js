var MongoClient = require('mongodb').MongoClient;
var config = require('./config.js');
var url = config.MONGO_URI;
console.log('MONGO_URI: ' + url);

var option = {
    poolSize : 40,
    connectTimeoutMS: 20000
};

function MongoPool(){}

var p_db;

function initPool(cb){
    MongoClient.connect(url, /*option,*/ function(err, db) {
        if (err) throw err;

        p_db = db.db(config.MONGO_DB_NAME);
        if(cb && typeof(cb) == 'function')
            cb(p_db);
    });
    return MongoPool;
}

MongoPool.initPool = initPool;

function getInstance(cb){
    if(!p_db){
        initPool(cb)
    }
    else{
        if(cb && typeof(cb) == 'function')
            cb(p_db);
    }
}
MongoPool.getInstance = getInstance;

module.exports = MongoPool;