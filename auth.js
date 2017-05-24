const session           = require('express-session');
const passport          = require('passport');
const LocalStrategy     = require('passport-local').Strategy;
const ObjectID          = require('mongodb').ObjectID;
const bcrypt            = require('bcrypt');

module.exports = function (app, db) {    
    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUnitialized: true
    }));
    app.use(passport.initialize());
    app.use(passport.session());
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
}