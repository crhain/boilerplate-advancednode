'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');

const app = express();
const PORT = process.env.PORT || 3000;
const session = require('express-session');
const passport = require('passport');
const mongo = require('mongodb').MongoClient;

app.set('view engine', 'pug');

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUnitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.route('/')
  .get((req, res) => {
    //res.sendFile(process.cwd() + '/views/index.html');
    res.render('pug/index.pug', {title: 'Hello', message: "Please login"});
  });

mongo.connect(process.env.DATABASE, (err, db) => {
    if(err) {
        console.log('Database error: ' + err);
    } else {
        console.log('Successful database connection');

        //serialization and app.listen
        passport.serializeUser((user, done) => {
          done(null, user._id);
        }); 

        passport.deserializeUser((id, done) => {
                db.collection('users').findOne(
                    {_id: new ObjectID(id)},
                    (err, doc) => {
                        done(null, doc);
                    }
                );
            }); 

        app.listen(PORT, () => {
          console.log("Listening on port " + PORT);
        });
}});

