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
var User = require("./models/user");
var Picture = require("./models/picture");

var seedDB = require("./seeds");


// REQUIRE ROUTES
var publicationRoutes = require("./routes/publications");   
var commentRoutes = require("./routes/comments");
var indexRoutes = require("./routes/index");
var contactRoutes = require("./routes/contact");
var userRoutes = require("./routes/users");

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
app.use("/contact", contactRoutes);
app.use("/users", userRoutes);


app.listen(3000, '127.0.0.1', function() {
   console.log("Resarch Page has started"); 
});
