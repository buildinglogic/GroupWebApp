require('dotenv').config(); // hide secret files

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var flash = require("connect-flash"); // needs to before passport configuration
var passport = require("passport");
var localStrategy = require("passport-local");
var methodOverride = require("method-override");
var moment = require("moment");

// REQUIRE MODELS
var Publication = require("./models/publication");
var Comment = require("./models/comment");
var Highlight = require("./models/highlight");
var User = require("./models/user");
var Biography = require("./models/biography");
var Picture = require("./models/picture");
var Journal = require("./models/journal");
var Blog = require("./models/blog");

var seedDB = require("./seeds");


// REQUIRE ROUTES
var publicationRoutes = require("./routes/publications");   
var commentRoutes = require("./routes/comments");
var highlightRoutes = require("./routes/highlights");
var indexRoutes = require("./routes/index");
var contactRoutes = require("./routes/contact");
var userRoutes = require("./routes/users");
var pictureRoutes = require("./routes/pictures");
var blogRoutes = require("./routes/blogs");
var linkRoutes = require("./routes/links");
var gameRoutes = require("./routes/games");

// seedDB(); 
// COONNECT DATABASE
mongoose.connect(process.env.DATABASEURL);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = moment;

// PASSPORT CONFIGURATION
app.use(require("express-session")( {
    secret:"thi is research group page",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// SETTING LOCAL VARIABLES
app.use(function(req, res, next) {
   res.locals.currentUser = req.user; // req.user will empty if no signed up
   res.locals.error = req.flash("error"); // pass this message variable to each route
   res.locals.success = req.flash("success");
   next();
});

// COMBINE ROUTES FILES
app.use("/", indexRoutes);
app.use("/publications", publicationRoutes); // take each route, and append "/publications at the start"
app.use("/publications/:id/comments", commentRoutes);
app.use("/publications/:id/highlights", highlightRoutes);
app.use("/contact", contactRoutes);
app.use("/users", userRoutes);
app.use("/pictures", pictureRoutes);
app.use("/blogs", blogRoutes);
app.use("/links", linkRoutes);
app.use("/games", gameRoutes);


// LISTEN TO IP
app.listen(process.env.PORT, process.env.IP, function() {
   console.log("Resarch Page has started" + process.env.PORT + process.env.IP); 
});
