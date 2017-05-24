'use strict';
const express           = require('express');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const mongo             = require('mongodb').MongoClient;
const app               = express();
const PORT              = process.env.PORT || 3000;
//require  user modules
const routes            = require('./routes.js');
const auth              = require('./auth.js');
fccTesting(app); //For FCC testing purposes
//establish connection to mongo database
mongo.connect(process.env.DATABASE, (err, db) => {
    if(err) {
        console.log('Database error: ' + err);
    } else {
        console.log('Successful database connection');        
        //setup passport stategy for local authentification
        auth(app, db);
        routes(app, db);              
        //start server
        app.listen(PORT, () => {
          console.log("Listening on port " + PORT);
        });               
}});




