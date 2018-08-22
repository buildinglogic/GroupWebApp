var express = require("express");
var router  = express.Router();
var User = require("../models/user");
var Publication = require("../models/publication");
var Biography = require("../models/biography");
var middleware = require("../middleware");

var passport = require("passport");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var request = require("request");

var NodeGeocoder = require('node-geocoder');
var multer = require('multer');
var cloudinary = require('cloudinary');
var async = require("async");



	// <!--  *****************  -->
	// <!-- GOOGLE MAP & IMAGE UPLOADING -->
	// <!--  *****************  -->
	
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



	// <!--  *****************  -->
	// <!-- REGISTER AND LOGIN -->
	// <!--  *****************  -->


// INDEX - REGISTER ROUTE
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

// INDEX - LOGIN 
router.get("/login", function(req, res) {
	res.render("users/login", {page:"login"});
});

// CREATE - LOGIN 
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
	res.redirect("back");
});



	// <!--  *****************  -->
	// <!-- USER INFO & PROFILE-->
	// <!--  *****************  -->


// INDEX - SHOW ALL USERS
router.get("/", function(req, res) {
	User.find({ joinYear: { $lt: Date.now() }, graduateYear: { $gt: Date.now() }}, function(err, currentGroupMembers) {
		// error handle find for current members
		if(err){
			console.log(err);
		} else {
			User.find({graduateYear: { $lt: Date.now() }}, function(err, formerGroupMembers) {
				if(err) {
					console.log(err);
				} else {
					// error handle for find former group members
					res.render("users/index", {currentGroupMembers : currentGroupMembers, formerGroupMembers: formerGroupMembers});
				}   
			});
		}
	});
});


// SHOW - USER PROFILE 
router.get("/:id", function(req, res) {
	User.findById(req.params.id).populate("bio").exec(function(err, foundUser) {
		if(err || !foundUser) {
			req.flash("error", "User not found");
			// eva(require("locus"));
			res.redirect("/");
		}  else {
			// should not be createdauthor, shoud be something like publicated author
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


 // CREATE - BIO 
 router.post("/:id/biography", middleware.isLoggedIn, function(req, res) {
 	User.findById(req.params.id, function(err, user) {
 		if(err || !user) {
 			req.flash("error", "user not found");
 			res.redirect("back");
 		} else {
 			Biography.create(req.body.biography, function(err, biography) {
 				if(err) {
 					req.flash("error", "Creation failed");
 					res.redirect("/publications/" + req.params.id);
 				} else {
 					biography.createdAuthor.id = req.user._id;
 					biography.createdAuthor.username = req.user.username;
 					biography.save();
 					user.bio = biography;
 					user.save();
 					req.flash("success", "Successfully created a biography");
 					res.redirect("/users/" + user._id);
 				}
 			});
 		}
 	});
 });


// EDIT - BIO 


// UPDATE - BIO
router.put("/:id/biography/:bio_id", middleware.isLoggedIn, function(req, res) {
	Biography.findByIdAndUpdate(req.params.bio_id, req.body.bio, function(err, updatedBio) {
		if(err) {
			res.redirect("back");
		} else {
			req.flash("success", "Successfully updated a biography");
			res.redirect("/users/" + req.params.id);
		}
	});
});



// DESTROY - USER
router.delete("/:id", middleware.isAdmin, function(req, res){
	User.findByIdAndRemove(req.params.id, function(err){
		if(err){
			req.flash("error", err.message);
			res.redirect("/publications");
		} else {
			res.redirect("/users");
		}
	});
});



function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;