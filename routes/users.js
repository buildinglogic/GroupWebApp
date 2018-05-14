var express = require("express");
var router  = express.Router();
var Publication = require("../models/publication");
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


//INDEX - show all publications
router.get("/", function(req, res){
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;

    if (req.query.search) {
       const regex = new RegExp(escapeRegex(req.query.search), 'gi');
       Publication.find({ "name": regex }).skip((perPage * pageQuery) - perPage).limit(perPage).exec(function(err, foundPublications) {
           Publication.count().exec(function(err, count) {
               if(err) {
                   console.log(err);
               } else {
                   var error;
                   if(foundPublications.length < 1) {
                       error = "no matched results found";
                   }
                  res.render("publications/index", { 
                      publications: foundPublications, 
                      error:error, 
                      current:pageNumber,
                      pages:Math.ceil(count / perPage)
                  });
               }
           });
       }); 
    } else {
        // Get all publications from DB
        Publication.find({}).skip((perPage * pageQuery) - perPage).limit(perPage).exec(function(err, foundPublications) {
           Publication.count().exec(function(err, count) {
               if(err){
                   console.log(err);
               } else {
                   res.render("publications/index", { 
                      publications: foundPublications, 
                      current:pageNumber,
                      pages:Math.ceil(count / perPage)
                  });
               }
           });
        });
    }
});

//CREATE - add new publication to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
  // get data from form and add to publications array
  var name = req.body.publication.name;
  var price = req.body.publication.price;
//   var image = req.body.image;
  var desc = req.body.publication.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.publication.location, function (err, data) {
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
        req.body.publication.image = result.secure_url;
        req.body.publication.imageId = result.public_id;
        var image = req.body.publication.image;
        var imageId = req.body.publication.imageId;
        var url = req.body.publication.url;
        var newPublication = {name: name, price: price, image: image, imageId: imageId, description: desc, author:author, location: location, lat: lat, lng: lng, url: url};
        // Create a new publication and save to DB
        Publication.create(newPublication, function(err, newlyCreated){
            if(err){
                console.log(err);
            } else {
                //redirect back to publications page
                console.log(newlyCreated);
                res.redirect("/publications");
            }
        });
    });
  });
});

//NEW - show form to create new publication
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("publications/new"); 
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