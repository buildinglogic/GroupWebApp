
// ====================================================================
// PUBLICATION ROUTES
// ====================================================================


//******************************************************************
// REFERENCE
// destroy: https://www.udemy.com/the-web-developer-bootcamp/learn/v4/questions/2959924
// code-refraction: https://github.com/nax3t/yelp-camp-refactored
//******************************************************************


var express = require("express");
var router  = express.Router();
var Publication = require("../models/publication");
var Highlight = require("../models/highlight");
var Comment = require("../models/comment");
var Journal = require("../models/journal");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
var multer = require('multer');
var cloudinary = require('cloudinary');
var async = require("async");


 // GOOGLE MAP API SETTING
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
var geocoder = NodeGeocoder(options);


// IMAGE UPLOADING : MULTER AND CLOUDINARY 
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


//INDEX - SHOW ALL PUBLICATIONS
router.get("/", function(req, res){
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    console.log(req.query);
    if (req.query.search) {
       const regex = new RegExp(escapeRegex(req.query.search), 'gi');
       Publication.find({ "title": regex }).skip((perPage * pageQuery) - perPage).limit(perPage).exec(function(err, foundPublications) {
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


// NEW - RENDER NEW FORM FOR CREATE A NEW PUBLICATION
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("publications/new"); 
});
 

// CREATE - ADD NEW PUBLICATION TO DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
  // get data from form and add to publications array
  console.log(req);
  var seriesNumber = req.body.publication.seriesNumber;
  var title = req.body.publication.title;
  var desc = req.body.publication.description;
  var journal = req.body.publication.journal;
  var citation = req.body.publication.citation;
  var url = req.body.publication.url;
  var publicatedDate = new Date(req.body.publication.publicatedDate);
  //   var image = req.body.image;

  var authors = req.body.publication.publicatedAuthors.split(",");
  
  var createdAuthor = {
      id: req.user._id,
      username: req.user.username
  }

  // get the uploading image url
  cloudinary.uploader.upload(req.file.path, function(result) {
    // add cloudinary url for the image to the publication object under image property
    var image  = result.secure_url;
    var imageId = result.public_id;
    var newPublication = {seriesNumber: seriesNumber, title: title, description: desc, image: image, imageId: imageId, journal: journal,
      citation: citation, url: url, publicatedDate: publicatedDate, createdAuthor:createdAuthor};
    eval(require("locus"));
    // Create a new publication and save to DB
    Publication.create(newPublication, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
          authors.forEach(function(author) {
            newlyCreated.publicatedAuthors.push(author);
          });
            publication.save();
            //redirect back to publications page
            console.log(newlyCreated);
            res.redirect("/publications");
        }
    });
  });
});
 


// SHOW - DISPLAY INFO OF ONE PUBLICATION
router.get("/:id", function(req, res){
    //find the publication with provided ID
    Publication.findById(req.params.id).populate("comments").populate("highlights").exec(function(err, foundPublication){
        if(err || !foundPublication){
            console.log(err);
            req.flash("error", "Publication not found");
            res.redirect("/publications");
        } else {
          console.log(foundPublication);
          Journal.find({title: foundPublication.journal}, function(err, foundJournal) {
            if(err || !foundJournal) {
              console.log(err);
              req.flash("error", "Journal not found");
              res.redirect("/publications");
            } else {
              console.log(foundJournal);
              //render show template with that publication
              res.render("publications/show", {publication: foundPublication, journal: foundJournal[0]});
            }
          });
            
        }
    });
});


// EDIT - EDIT A PUBLICATION
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


// UPDATE - UPADATE A PUBLICATIOIN BACK FROM EDIT
router.put("/:id", middleware.checkPublicationOwnership, upload.single('image'), function(req, res, next){
    async.waterfall([
        function(done) {
            // handle image uploading
            Publication.findById(req.params.id, function(err, foundPublication) {
                if(err) {
                     req.flash("error", err.message);
                     return res.redirect("back");
                }  else {
                    done(null, foundPublication);
                }
            });
        },
        function(foundPublication, done) {
            if(req.file && foundPublication.imageId) { 
                cloudinary.v2.uploader.destroy(foundPublication.imageId, function(err, result) {
                    if(err) {
                        req.flash("error", err.message);
                        return res.redirect("back");
                    } else {
                        done(null, foundPublication);
                    }
                });
            } else {
                done(null, foundPublication);
            }
        },
        function(foundPublication, done) {
            // if new image uploaded, destroy the old one
            if(req.file) { 
                cloudinary.uploader.upload(req.file.path, function(result) {
                    req.body.publication.imageId = result.public_id;
                    req.body.publication.image = result.secure_url;
                    done(null, foundPublication);
                });
            } else {
                done(null, foundPublication);
            }
        },
        function(foundPublication) {
            // update 
            var image; 
            var imageId;
            if(!req.file) {
              image = foundPublication.image;
              imageId = foundPublication.imageId;
            } else {
              image = req.body.publication.image;
              imageId = req.body.publication.imageId;
            }
            var publicatedDate = new Date(req.body.publication.publicatedDate);
            var authors = req.body.publication.publicatedAuthors.split(",");

            var newPublication = {
                                  seriesNumber:req.body.publication.seriesNumber,
                                  title: req.body.publication.title, 
                                  description: req.body.publication.description,
                                  image: image,
                                  imageId: imageId,
                                  journal: req.body.publication.journal,
                                  citation:req.body.publication.citation,
                                  url: req.body.publication.url,
                                  publicatedDate: publicatedDate,
                                };
            console.log(newPublication);

            Publication.findByIdAndUpdate(req.params.id, {$set: newPublication}, function(err, publication){
                if(err){
                    req.flash("error", err.message);
                    res.redirect("back");
                } else {
                  authors.forEach(function(author) {
                    publication.publicatedAuthors.push(author);
                  });
                  publication.save();
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
    
 
// DESTROY - DELETE A PUBLICATOIN  AND COMMENTS & HIGHLIGHTS REFERED BY THIS PUBLIATION
router.delete("/:id", middleware.isLoggedIn, middleware.checkPublicationOwnership, function(req, res){
    Comment.remove({
      _id: {
        $in: req.publication.comments
      }
    }, function(errComment) {
      if(errComment) {
        req.flash('error', errComment.message);
        res.redirect('/');
      } else {
        Highlight.remove({
          _id: {
            $in: req.publication.highlights
          }
        }, function(errHighlight) {
          if(err) {
              req.flash('error', errHighlight.message);
              res.redirect('/');
          } else {
              req.publication.remove(function(errPublication) {
                if(err) {
                    req.flash('error', errPublication.message);
                    return res.redirect('/');
                }
                req.flash('error', 'Publication deleted!');
                res.redirect('/publications');
              });
          }
        });
      }
    });
});

// put second query into the callback of first query, so the second query won't be executed untill the first one finished


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;