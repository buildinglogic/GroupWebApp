// ========================
// AUTH ROUTE
// ========================

var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Publication = require("../models/publication");
var passport = require("passport");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var request = require("request");

// root route
router.get("/", function(req, res) {
    res.render("landing", {page:"landing"}); 
});

// register route
router.get("/register", function(req, res) {
   res.render("register", {page:"register"}); 
});

// handle register logic
router.post("/register", function(req, res) {
    const captcha = req.body["g-recaptcha-response"];
    if (!captcha) {
      console.log(req.body);
      req.flash("error", "Please select captcha");
      return res.redirect("/register");
    }
    // secret key
    var secretKey = process.env.CAPTCHA;
    // Verify URL
    var verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req
      .connection.remoteAddress}`;
    // Make request to Verify URL
    request.get(verifyURL, (err, response, body) => {
        // if not successful
        if (body.success !== undefined && !body.success) {
            req.flash("error", "Captcha Failed");
            return res.redirect("/contact");
        }
    
        var newUser = new User(
            {
                username:req.body.username,
                prefix:req.body.prefix,
                firstName:req.body.firstName,
                lastName:req.body.lastName,
                email:req.body.email
            });
        console.log(newUser);
        // set up amin
        if(req.body.adminCode === process.env.ADMINCODE) {
            newUser.isAdmin = true;
        }

       User.register(newUser, req.body.password, function(err, user) { // provide by passport-local-mongoose
           if(err) {
               req.flash("error", err.message);
               res.redirect("/register");
            //   return res.render("register", {"error": err.message});
           }
           passport.authenticate("local")(req, res, function() {
              req.flash("success", "Welcome to YelpCamp " + user.username);
              res.redirect("/publications"); 
           });
       });
    });
});

// show login form
router.get("/login", function(req, res) {
    res.render("login", {page:"login"});
});

// handle login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect:"/publications",
        failureRedirect:"/login",
        failureFlash: true
    }),function(req, res) {
});

// logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Successfully logged you out");
    res.redirect("/publications");
});

// forgot route
router.get("/forgot", function(req, res) {
    res.render("forgot");
});

// forgot update
router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (err || !user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'conanlee90@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'conanlee90@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

// reset route
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpire: { $gt: Date.now() } }, function(err, user) {
    if (err || !user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

// reset password handling
router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpire: { $gt: Date.now() } }, function(err, user) {
            if (err || !user) {
              req.flash('error', 'Password reset token is invalid or has expired.');
              return res.redirect('back');
            }
            if(req.body.password === req.body.confirm) {
                user.setPassword(req.body.password, function(err) {
                    if(err) {
                        req.flash("error", "setpassword failed");
                        res.redirect("back");
                    } else {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpire = undefined;
                    }
                  
                    user.save(function(err) {
                        if(err) {
                            req.flash("error", "password save failed");
                            res.redirect("back");
                        } else {
                            req.logIn(user, function(err) {
                                done(err, user);
                            });
                        }
                    });
                })
            } else {
                req.flash("error", "Passwords do not match.");
                return res.redirect('back');
            }
        });
    },
    function(user, done) {
        var smtpTransport = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
                user: 'conanlee90@gmail.com',
                pass: process.env.GMAILPW
            }
        });
        var mailOptions = {
            to: user.email,
            from: 'conanlee90@mail.com',
            subject: 'Your password has been changed',
            text: 'Hello,\n\n' +
              'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
            req.flash('success', 'Success! Your password has been changed.');
            done(err);
        });
    }
    ], function(err) {
        if(err) {
            req.flash("error", "change password failed");
        } else {
            res.redirect('/publications');
        }
    });
});

// user profile
router.get("/users/:id", function(req, res) {
   User.findById(req.params.id, function(err, foundUser) {
        if(err || !foundUser) {
            req.flash("error", "User not found");
            // eva(require("locus"));
            res.redirect("/");
        }  else {
            Publication.find().where("author.id").equals(foundUser._id).exec(function(err, publications) {
                if(err) {
                    req.flash("error", "Can't find publications of this user");
                    return res.redirect("back");
                } else {
                    res.render(("users/show"), {user:foundUser, publications:publications});
                }
            });
        }
   });
});

module.exports = router;