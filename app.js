require('dotenv').config();

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var flash = require("connect-flash"); // needs to before passport configuration
var passport = require("passport");
var localStrategy = require("passport-local");
var methodOverride = require("method-override");
var Campground = require("./models/campground");
var Comment = require("./models/comment");
var User = require("./models/user");
var seedDB = require("./seeds");
var moment = require("moment");

// require routes
var campgroundRoutes = require("./routes/campgrounds");   
var commentRoutes = require("./routes/comments");
var indexRoutes = require("./routes/index");
var contactRoutes = require("./routes/contact");

// seedDB(); // seed the database
// mongoose.connect("mongodb://localhost/yelp_camp");
mongoose.connect("mongodb://kangnan:625605657@ds119800.mlab.com:19800/yelpcamp_kangnan");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = moment;

// PASSPORT CONFIGURATION
app.use(require("express-session")( {
    secret:"once again, rusty is cutest dog",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// call this function in evry route
app.use(function(req, res, next) {
   res.locals.currentUser = req.user; // req.user will empty if no signed up
   res.locals.error = req.flash("error"); // pass this message variable to each route
   res.locals.success = req.flash("success");
   next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes); // take each route, and append "/campgrounds at the start"
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/contact", contactRoutes);

app.listen(process.env.PORT, process.env.IP, function() {
   console.log("YelpCamp has started"); 
});
