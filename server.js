'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const path        = require('path');
//const fccTesting  = require('./freeCodeCamp/fcctesting.js');

const app = express();
const PORT = process.env.PORT || 3000;
const session = require('express-session');
const passport = require('passport');
const mongo = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID
const LocalStrategy = require('passport-local');

app.set('view engine', 'pug');

//fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUnitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());



mongo.connect(process.env.DATABASE, (err, db) => {
    if(err) {
        console.log('Database error: ' + err);
    } else {
        console.log('Successful database connection');        
        //setup passport stategy for local authentification
        passport.use(new LocalStrategy(
          function(username, password, done) {
            db.collection('users').findOne({ username: username }, function (err, user) {
              console.log('User '+ username +' attempted to log in.');
              if (err) { return done(err); }
              if (!user) { console.log('No user!'); return done(null, false); }
              if (password !== user.password) { console.log('password does not match!'); return done(null, false); }
              return done(null, user);
            });
          }
        ));
        //serialization and app.listen
        passport.serializeUser((user, done) => {
          console.log('serializing user: ');
          console.log(user);  
          console.log('with id: ' + user._id );  
          done(null, user._id);
        }); 

        passport.deserializeUser((id, done) => {
                console.log('deserializing user id: ' + id );
                db.collection('users').findOne(
                    {_id: new ObjectID(id)},     
                    (err, doc) => {
                        done(null, doc);
                    }
                );
            }); 
        app.route('/')
        .get((req, res) => {
          //res.sendFile(process.cwd() + '/views/index.html');
          res.render('pug/index.pug', {title: 'Hello', message: "Please login", showRegistration: true});
        });

        app.route('/register')
          .post((req, res, next) => {
              db.collection('users').findOne({ username: req.body.username }, function (err, user) {
                  if(err) {
                      next(err);
                  } else if (user) {
                      res.redirect('/');
                  } else {
                      db.collection('users').insertOne(
                        {username: req.body.username,
                        password: req.body.password},
                        (err, doc) => {
                            if(err) {
                                console.log('rerouting because of ERROR!');
                                res.redirect('/');
                            } else {
                                console.log('succesfully added user to db');
                                next(null, user);
                            }
                        }
                      )
                  }
              })},
            passport.authenticate('local', { failureRedirect: '/' }),
            (req, res, next) => {
                console.log('redirecting to profile');
                res.redirect('/profile');
            }
        );

        app.route('/profile')
          .get(ensureAuthenticated, (req,res) => {
            console.log('going to profile!');
            res.render('pug/profile', {username: req.user.username});                  
          });

        app.route('/logout')
          .get((req, res) => {
              req.logout();
              res.redirect('/');
          });  

        app.use((req, res, next) => {
          res.status(404)
            .type('text')
            .send('Not Found');
        });      
        app.listen(PORT, () => {
          console.log("Listening on port " + PORT);
        });

        //function defenitions
        function ensureAuthenticated(req, res, next) {
          console.log("is Authenticated: " + req.isAuthenticated());
          if (req.isAuthenticated()) {
              return next();
          } else{
            console.log('something is wrong!');
            res.redirect('/');              
          }
          
        };
       
}});




