// =========================
//      middleware
// =========================


var middlewareObj = {};
var Campground = require("../models/campground");
var Comment = require("../models/comment");

middlewareObj.checkCampgroundOwnership = function(req, res, next) {
    if(req.isAuthenticated()) { // if login or not
        Campground.findById(req.params.id, function(err, foundCampground) {
           if(err || !foundCampground) { // if not found, foundCampground is null, which equals false
               req.flash("error", "Campground not found");
               res.redirect("back");
           } else {
               // if user owns this campground; // If the upper condition is true this will break out of the middleware and prevent the code below to crash our application
               if(foundCampground.author.id.equals(req.user._id)) {
                    next();
               } else {
                   req.flash("error", "You don't have the permission");
                   res.redirect("back");
               }
           }
        });
    } else {
        req.flash("error", "You need to login");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
    if(req.isAuthenticated()) { // if login or not
        Comment.findById(req.params.comment_id, function(err, foundComment) {
           if(err || !foundComment) {
               req.flash("error", "Comment not found");
               res.redirect("back"); // not logged in
           } else {
               // if user owns this campground
               if(foundComment.author.id.equals(req.user._id)) {
                    next();
               } else {
                   req.flash("error", "You don't have the permission");
                   res.redirect("back"); // not own this comment
               }
           }
        });
    } else {
        req.flash("error", "You need to login");
        res.redirect("back");
    }
}

middlewareObj.isLoggedIn =  function(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to login"); 
    res.redirect("/login");
}


module.exports = middlewareObj;