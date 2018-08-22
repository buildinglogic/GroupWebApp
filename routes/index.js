// ========================
// AUTH ROUTE
// ========================
 
var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Publication = require("../models/publication");
var middleware = require("../middleware");
var passport = require("passport");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var request = require("request");
var NodeGeocoder = require('node-geocoder');
var multer = require('multer');
var cloudinary = require('cloudinary');
var async = require("async");



// ROOT ROUTE
router.get("/", function(req, res) {
    res.render("landing", {page:"landing"}); 
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

// DEVELOPMENT NOTES ROUTE
router.get("/developmentnotes", function(req, res) {
    res.render("developmentnotes"); 
});


module.exports = router;