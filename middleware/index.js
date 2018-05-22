// =========================
//      middleware
// =========================


var middlewareObj = {};
var Publication = require("../models/publication");
var Comment = require("../models/comment");

middlewareObj.checkPublicationOwnership = function(req, res, next) {
    if(req.isAuthenticated()) { // if login or not
        Publication.findById(req.params.id, function(err, foundPublication) {
           if(err || !foundPublication) { // if not found, foundPublication is null, which equals false
               req.flash("error", "Publication not found");
               res.redirect("back");
           } else {
               // if user owns this Publication; // If the upper condition is true this will break out of the middleware and prevent the code below to crash our application
               if(foundPublication.createdAuthor.id.equals(req.user._id) || req.user.isAdmin) {
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
               // if user owns this Publication
               if(foundComment.createdAuthor.id.equals(req.user._id) || req.user.isAdmin) {
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
    res.redirect("/users/login");
}


module.exports = middlewareObj;