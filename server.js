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
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

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

//establish connection to mongo database
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
              if (!bcrypt.compareSync(password, user.password)) { console.log('password does not match!'); return done(null, false); }
              return done(null, user);
            });
          }
        ));
        //serialize credentials using id
        passport.serializeUser((user, done) => {
          console.log('serializing user: ');
          console.log(user);  
          console.log('with id: ' + user._id );  
          done(null, user._id);
        }); 
        //deserialize credentials
        passport.deserializeUser((id, done) => {
                console.log('deserializing user id: ' + id );
                db.collection('users').findOne(
                    {_id: new ObjectID(id)},     
                    (err, doc) => {
                        done(null, doc);
                    }
                );
            }); 
        //handle basic route get request     
        app.route('/')
        .get((req, res) => {
          //res.sendFile(process.cwd() + '/views/index.html');
          res.render('pug/index.pug', {title: 'Hello', message: "Please login", showRegistration: true});
        });
        //handel /register route
        app.route('/register')
          .post((req, res, next) => {
              db.collection('users').findOne({ username: req.body.username }, function (err, user) {
                  if(err) {
                      next(err);
                  } else if (user) {
                      res.redirect('/');
                  } else {
                      var hash = bcrypt.hashSync(req.body.password, 8);
                      db.collection('users').insertOne(
                        {username: req.body.username,
                        password: hash},
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
        //handle /profile route so that user must authenticate in order to view
        app.route('/profile')
          .get(ensureAuthenticated, (req,res) => {
            console.log('going to profile!');
            res.render('pug/profile', {username: req.user.username});                  
          });
        //handle logout route to end session  
        app.route('/logout')
          .get((req, res) => {
              req.logout();
              res.redirect('/');
          });  
        //handle unhandled route requests  
        app.use((req, res, next) => {
          res.status(404)
            .type('text')
            .send('Not Found');
        });      
        //start server
        app.listen(PORT, () => {
          console.log("Listening on port " + PORT);
        });

        //authentification function
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




