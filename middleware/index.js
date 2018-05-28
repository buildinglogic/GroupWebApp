// =========================
//      middleware
// =========================


var middlewareObj = {};
var User = require("../models/user");
var Publication = require("../models/publication");
var Comment = require("../models/comment");
var Highlight = require("../models/highlight");



// ====================================================================
// Check campground owned by user
// ====================================================================

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


// ====================================================================
// Check comment owned by user
// ====================================================================

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


// ====================================================================
// Check that a user is logged in
// ====================================================================

middlewareObj.isLoggedIn =  function(req, res, next) {
    if(req.isAuthenticated()) {
      return next();
    } 
    req.flash("error", "You need to login"); 
    res.redirect("/users/login");
}


// ====================================================================
// Check that a user is admin
// ====================================================================

middlewareObj.isAdmin =  function(req, res, next) {
    if(req.isAuthenticated()) {
        User.findById(req.params.id, function(err, user) {
          if(err || !user.isAdmin) {
            req.flash("error", "You are not admin");
            res.redirect("back"); // not logged in
          } else {
            return next();
          }
        });
    }
    req.flash("error", "You need to login"); 
    res.redirect("/users/login");
}


// ====================================================================
// remove highlights and comments before removing publication (still working on this)
// ====================================================================

middlewareObj.removeHighlightAndComment = function(req, res, next) {
  Publication.findById(req.params.id, function(err, foundPublication) {
    if(err) {
         req.flash("error", err.message);
         return res.redirect("back");
    } else {
      foundPublication.highlights.forEach(function(highlight) {
        Highlight.findByIdAndRemove(highlight, function(err) {
          if(err) {
            res.redirect("back");
          } else {
              res.redirect("/publications/" + req.params.id);
          }
        });
        // Highlight.remove({_id : highlight});
      });
      foundPublication.comments.forEach(function(comment) {
        Comment.remove({_id: comment});
      });
    }
    next();
  });
}


module.exports = middlewareObj;