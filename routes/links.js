/*========================
    LINKS ROUTES
========================*/

var express = require("express");
var router  = express.Router();
var Publication = require("../models/publication");
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



// INDEX - LINK 
router.get("/", function(req, res) {
  Journal.find({}, function(err, allJournals) {
    // error handle find for current members
    if(err){
      console.log(err);
    } else {
      res.render("links/index", {allJournals : allJournals});
    }
  });
});


// NEW - LINK
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("links/new"); 
});


// CREATE - LINK
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){

  var title = req.body.journal.title;
  var journalLink = req.body.journal.journalLink;
  var coverLink = req.body.journal.coverLink;
  //   var image = req.body.image;

    var newJournal = new Journal (
    {
        title: title,
        journalLink: journalLink,
        coverLink: coverLink,
    });

    Journal.create(newJournal, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to pictures page
            console.log(newlyCreated);
            res.redirect("/links");
        }
    });

});
  


// SHOW - COMMENT  included in publication show.ejs


// EDIT - COMMENT  included in publication show.ejs


// UPDATE - COMMENT 

// DESTROY - COMMENT 


module.exports = router;