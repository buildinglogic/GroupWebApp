/*========================
    LINKS ROUTES
========================*/

var express = require("express");
var router  = express.Router();
var Publication = require("../models/publication");
var Picture = require("../models/picture");
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
  res.render("links/index");
});


// NEW - LINK
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("links/new"); 
});


// CREATE - LINK
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){

  var title = req.body.picture.title;
  var desc = req.body.picture.description;
  //   var image = req.body.image;
  
  var createdAuthor = {
      id: req.user._id,
      username: req.user.username
  }

  geocoder.geocode(req.body.picture.location, function (err, data) {
      if (err) {
        req.flash('error', 'Invalid address');
        return res.redirect('back');
      }
      var lat;
      var lng;
      var location;
      if(data.length) {
        lat = data[0].latitude;
        lng = data[0].longitude;
        location = data[0].formattedAddress;
      }
      
      // get the uploading image url
      cloudinary.uploader.upload(req.file.path, function(result) {
          // add cloudinary url for the image to the publication object under image property
          var image = result.secure_url;
          var imageId = result.public_id;

          var newPicture = new Picture (
          {
              title: title,
              description: desc,
              image: image,
              imageId: imageId,
              createdAuthor: createdAuthor,
              location: location,
              lat: lat,
              lng: lng,
          });

          Picture.create(newPicture, function(err, newlyCreated){
              if(err){
                  console.log(err);
              } else {
                  //redirect back to pictures page
                  console.log(newlyCreated);
                  res.redirect("/links");
              }
          });
      });
  });

});
  








// SHOW - COMMENT  included in publication show.ejs


// EDIT - COMMENT  included in publication show.ejs


// UPDATE - COMMENT 

// DESTROY - COMMENT 


module.exports = router;