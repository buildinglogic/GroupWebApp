var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
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


//INDEX - show all campgrounds
router.get("/", function(req, res){
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;

    if (req.query.search) {
       const regex = new RegExp(escapeRegex(req.query.search), 'gi');
       Campground.find({ "name": regex }).skip((perPage * pageQuery) - perPage).limit(perPage).exec(function(err, foundCampgrounds) {
           Campground.count().exec(function(err, count) {
               if(err) {
                   console.log(err);
               } else {
                   var error;
                   if(foundCampgrounds.length < 1) {
                       error = "no matched results found";
                   }
                  res.render("campgrounds/index", { 
                      campgrounds: foundCampgrounds, 
                      error:error, 
                      current:pageNumber,
                      pages:Math.ceil(count / perPage)
                  });
               }
           });
       }); 
    } else {
        // Get all campgrounds from DB
        Campground.find({}).skip((perPage * pageQuery) - perPage).limit(perPage).exec(function(err, foundCampgrounds) {
           Campground.count().exec(function(err, count) {
               if(err){
                   console.log(err);
               } else {
                   res.render("campgrounds/index", { 
                      campgrounds: foundCampgrounds, 
                      current:pageNumber,
                      pages:Math.ceil(count / perPage)
                  });
               }
           });
        });
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.campground.name;
  var price = req.body.campground.price;
//   var image = req.body.image;
  var desc = req.body.campground.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.campground.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    
        // get the uploading image url
    cloudinary.uploader.upload(req.file.path, function(result) {
        // add cloudinary url for the image to the campground object under image property
        req.body.campground.image = result.secure_url;
        req.body.campground.imageId = result.public_id;
        var image = req.body.campground.image;
        var imageId = req.body.campground.imageId;
        var newCampground = {name: name, price: price, image: image, imageId: imageId, description: desc, author:author, location: location, lat: lat, lng: lng};
        // Create a new campground and save to DB
        Campground.create(newCampground, function(err, newlyCreated){
            if(err){
                console.log(err);
            } else {
                //redirect back to campgrounds page
                console.log(newlyCreated);
                res.redirect("/campgrounds");
            }
        });
    });
  });
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            console.log(err);
            req.flash("error", "Campground not found");
            res.redirect("/campgrounds");
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err) {
            console.log(err);
            req.flash("error", err.message);
            res.redirect("/campgrounds/" + req.params.id);
        }
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), function(req, res, next){
    async.waterfall([
        function(done) {
            geocoder.geocode(req.body.campground.location, function (err, geoData) {
                if (err || !geoData.length) {
                  req.flash('error', 'Invalid address');
                  return res.redirect('back');
                }
                done(null, geoData);
            });
        },
        function(geoData, done) {
            // handle image uploading
            Campground.findById(req.params.id, function(err, foundCampground) {
                if(err) {
                     req.flash("error", err.message);
                     return res.redirect("back");
                }  else {
                    done(null, foundCampground, geoData);
                }
            });
        },
        function(foundCampground, geoData, done) {
            if(req.file) { 
                cloudinary.v2.uploader.destroy(foundCampground.imageId, function(err, result) {
                    if(err) {
                        req.flash("error", err.message);
                        return res.redirect("back");
                    } else {
                        done(null, foundCampground, geoData);
                    }
                });
            } else {
                done(null, foundCampground, geoData);
            }
        },
        function(foundCampground, geoData, done) {
            // if new image uploaded, destroy the old one
            if(req.file) { 
                cloudinary.uploader.upload(req.file.path, function(result) {
                    req.body.campground.imageId = result.public_id;
                    req.body.campground.image = result.secure_url;
                    done(null, foundCampground, geoData);
                });
            } else {
                done(null, foundCampground, geoData);
            }
        },
        function(foundCampground, geoData) {
            // update 
            // var newCampground = {name: req.name, price: price, image: image, imageId: imageId, description: desc, author:author, location: location, lat: lat, lng: lng};
            req.body.campground.lat = geoData[0].latitude;
            req.body.campground.lng = geoData[0].longitude;
            req.body.campground.location = geoData[0].formattedAddress;
            Campground.findByIdAndUpdate(req.params.id, {$set: req.body.campground}, function(err, campground){
                if(err){
                    req.flash("error", err.message);
                    res.redirect("back");
                } else {
                    req.flash("success","Successfully Updated!");
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect('/campgrounds');
    });
});
    

// DESTROY CAMPGROUND ROUTE
router.delete("/:id",middleware.checkCampgroundOwnership, function(req, res){
   Campground.findByIdAndRemove(req.params.id, function(err){
      if(err){
          req.flash("error", err.message);
          res.redirect("/campgrounds");
      } else {
          res.redirect("/campgrounds");
      }
   });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;