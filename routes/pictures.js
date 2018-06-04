 /*========================
    PICTURE ROUTES
    ========================*/

var express = require("express");
var router = express.Router({mergeParams:true}); // mergeParams will enable req.params.id to find the id
var User = require("../models/user");
var Publication = require("../models/publication");
var Picture = require("../models/picture");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
var multer = require('multer');
var cloudinary = require('cloudinary');
var async = require("async");


/*  ********************************************  
 	GOOGLE MAP & IMAGE UPLOADING  SETTING		
 	********************************************* */

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



/*  ********************************************  
 	RESTful ROUTES HANDLING		
 	********************************************* */


// INDEX - PICTURES
router.get("/", function(req, res) {
	Picture.find({"belongsTo": "user"}, function(err, allUserPictures) {
		if(err){
			console.log(err);
		} else {
			Picture.find({"belongsTo": "publication"}, function(err, allPublicationPictures) {
				if(err) {
					console.log(err);
				} else {
					res.render("pictures/index", {allUserPictures: allUserPictures, allPublicationPictures: allPublicationPictures});
				}
			});
		}
	});
});


// NEW - PICTURE
router.get("/new", function(req, res) {
	res.render("pictures/new");
});


// CREATE - ADD A PICTURE
router.post("/", upload.single('image'), function(req, res) {
	var createdAuthor = {
	  	id: req.user._id,
	  	username: req.user.username
	}
	geocoder.geocode(req.body.picture.location, function (err, data) {
		if (err || !data.length) {
			req.flash('error', 'Invalid address');
			return res.redirect('back');
		}
		var lat = data[0].latitude;
		var lng = data[0].longitude;
		var location = data[0].formattedAddress;
 
		cloudinary.uploader.upload(req.file.path, function(result) {
			var image = result.secure_url;
			var imageId = result.public_id;

			var newPicture = new Picture(
			{	
				belongsToType:req.body.picture.belongsToType,
				whoOwns:req.body.picture.whoOwns,
				title:req.body.picture.title,
				description:req.body.picture.description,
				image:image,
				imageId:imageId,
				createdAuthor:createdAuthor,
				lat:lat,
				lng:lng,
				location:location
			});
 
			Picture.create(newPicture, function(err, newlyCreated){
				if(err){
					console.log(err);
				} else {
					if(req.body.picture.belongsToType == "publication") {
						// eval(require("locus"));
						Publication.find({"DOI": req.body.picture.whoOwns}, function(err, foundPublication) {
							if(err || !foundPublication) {
								console.log(err);
							} else {
								eval(require("locus"));
								foundPublication.pictures.push(newlyCreated);
								foundPublication.save();
								console.log(newlyCreated);
								res.redirect("/pictures");
							}
						})
					} else if(req.body.picture.belongsToType == "user") {
						User.find({"username": req.body.picture.whoOwns}, function(err, foundUser) {
							if(err) {
								console.log(err);
							} else {
								foundUser.pictures.push(newlyCreated);
								foundUser.save();
								console.log(newlyCreated);
								res.redirect("/pictures");
							}
						})
					}
				}
			});
		});
	});
});



// EDIT - EDIT A PICTURE
router.get("/:id/edit", function(req, res){
	Picture.findById(req.params.id, function(err, foundPicture){
		if(err) {
			console.log(err);
			req.flash("error", err.message);
			res.redirect("back");
		}
		res.render("pictures/edit", {picture: foundPicture});
	});
});







// SHOW - COMMENT  included in publication show.ejs


// EDIT - COMMENT  included in publication show.ejs




module.exports = router;