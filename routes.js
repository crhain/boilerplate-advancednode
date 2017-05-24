const express           = require('express');
const passport          = require('passport');
const bodyParser        = require('body-parser');
const path              = require('path');
const bcrypt            = require('bcrypt');

module.exports = function (app, db) {
    
    app.set('view engine', 'pug');
    app.use('/public', express.static(path.join(__dirname, 'public')));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

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
}