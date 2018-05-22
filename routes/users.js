var express = require("express");
var router  = express.Router();
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


 
 // set up google map options
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
var geocoder = NodeGeocoder(options);

// set up image uploading with multer and cloudinary
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

cloudinary.config({ 
  cloud_name: 'kangnan', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// REGISTER ROUTE
router.get("/register", function(req, res) {
   res.render("users/register", {page:"register"}); 
});

   
// NEW - REGISTER
router.post("/register", upload.single('image'), function(req, res) {
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

        geocoder.geocode(req.body.location, function (err, data) {
          if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
          }
          var lat = data[0].latitude;
          var lng = data[0].longitude;
          var location = data[0].formattedAddress;

          // get the uploading image url
          cloudinary.uploader.upload(req.file.path, function(result) {
              // add cloudinary url for the image to the publication object under image property
              var selfie = result.secure_url;
              var selfieId = result.public_id;

              var joinYear = new Date(req.body.joinYear);
              var graduateYear = new Date(req.body.graduateYear);
              var newUser = new User(
                  {
                      username:req.body.username,
                      prefix:req.body.prefix,
                      firstName:req.body.firstName,
                      lastName:req.body.lastName,
                      email:req.body.email,
                      joinYear:joinYear,
                      graduateYear:graduateYear ,
                      selfie:selfie,
                      selfieId:selfieId,
                      lat:lat,
                      lng:lng,
                      location:location
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
    });
});
   
// show login form
router.get("/login", function(req, res) {
    res.render("users/login", {page:"login"});
});

// handle login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect:"/publications",
        failureRedirect:"/users/login",
        failureFlash: true
    }),function(req, res) {
});

// logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Successfully logged you out");
    res.redirect("/publications");
});


// user profile
router.get("/:id", function(req, res) {
   User.findById(req.params.id, function(err, foundUser) {
        if(err || !foundUser) {
            req.flash("error", "User not found");
            // eva(require("locus"));
            res.redirect("/");
        }  else {
            Publication.find().where("createdAuthor.id").equals(foundUser._id).exec(function(err, publications) {
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

 



// SHOW - shows more info about one publication
router.get("/:id", function(req, res){
    //find the publication with provided ID
    Publication.findById(req.params.id).populate("comments").exec(function(err, foundPublication){
        if(err || !foundPublication){
            console.log(err);
            req.flash("error", "Publication not found");
            res.redirect("/publications");
        } else {
            //render show template with that publication
            res.render("publications/show", {publication: foundPublication});
        }
    });
});

// EDIT Publication ROUTE
router.get("/:id/edit", middleware.checkPublicationOwnership, function(req, res){
    Publication.findById(req.params.id, function(err, foundPublication){
        if(err) {
            console.log(err);
            req.flash("error", err.message);
            res.redirect("/publications/" + req.params.id);
        }
        res.render("publications/edit", {publication: foundPublication});
    });
});

// UPDATE Publication ROUTE
router.put("/:id", middleware.checkPublicationOwnership, upload.single('image'), function(req, res, next){
    async.waterfall([
        function(done) {
            geocoder.geocode(req.body.publication.location, function (err, geoData) {
                if (err || !geoData.length) {
                  req.flash('error', 'Invalid address');
                  return res.redirect('back');
                }
                done(null, geoData);
            });
        },
        function(geoData, done) {
            // handle image uploading
            Publication.findById(req.params.id, function(err, foundPublication) {
                if(err) {
                     req.flash("error", err.message);
                     return res.redirect("back");
                }  else {
                    done(null, foundPublication, geoData);
                }
            });
        },
        function(foundPublication, geoData, done) {
            if(req.file) { 
                cloudinary.v2.uploader.destroy(foundPublication.imageId, function(err, result) {
                    if(err) {
                        req.flash("error", err.message);
                        return res.redirect("back");
                    } else {
                        done(null, foundPublication, geoData);
                    }
                });
            } else {
                done(null, foundPublication, geoData);
            }
        },
        function(foundPublication, geoData, done) {
            // if new image uploaded, destroy the old one
            if(req.file) { 
                cloudinary.uploader.upload(req.file.path, function(result) {
                    req.body.publication.imageId = result.public_id;
                    req.body.publication.image = result.secure_url;
                    done(null, foundPublication, geoData);
                });
            } else {
                done(null, foundPublication, geoData);
            }
        },
        function(foundPublication, geoData) {
            // update 
            // var newPublication = {name: req.name, price: price, image: image, imageId: imageId, description: desc, author:author, location: location, lat: lat, lng: lng};
            req.body.publication.lat = geoData[0].latitude;
            req.body.publication.lng = geoData[0].longitude;
            req.body.publication.location = geoData[0].formattedAddress;
            Publication.findByIdAndUpdate(req.params.id, {$set: req.body.publication}, function(err, publication){
                if(err){
                    req.flash("error", err.message);
                    res.redirect("back");
                } else {
                    req.flash("success","Successfully Updated!");
                    res.redirect("/publications/" + publication._id);
                }
            });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect('/publications');
    });
});
    

// DESTROY publication ROUTE
router.delete("/:id",middleware.checkPublicationOwnership, function(req, res){
   Publication.findByIdAndRemove(req.params.id, function(err){
      if(err){
          req.flash("error", err.message);
          res.redirect("/publications");
      } else {
          res.redirect("/publications");
      }
   });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;