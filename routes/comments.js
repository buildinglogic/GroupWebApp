/*========================
    COMMENTS ROUTES
========================*/

var express = require("express");
var router = express.Router({mergeParams:true}); // mergeParams will enable req.params.id to find the id
var Publication = require("../models/publication");
var Comment = require("../models/comment");
var middleware = require("../middleware");

// NEW - comments 
router.get("/new", middleware.isLoggedIn, function(req, res) {
    Publication.findById(req.params.id, function(err, publication) {
        if(err || !publication) {
            req.flash("error", "Publication not found");
            res.redirect("/publications");
        }else {
            res.render("comments/new", {publication:publication}); 
        }
    });
});

// CREATE - comments 
router.post("/", middleware.isLoggedIn, function(req, res) {
    Publication.findById(req.params.id, function(err, publication) {
        if(err || !publication) {
            req.flash("error", "publication not found");
            res.redirect("/publications");
        } else {
            Comment.create(req.body.comment, function(err, comment) {
               if(err) {
                   req.flash("error", "Creation failed");
                   res.redirect("/publications/" + req.params.id);
               } else {
                   // add username and id to comment
                   comment.createdAuthor.id = req.user._id;
                   comment.createdAuthor.username = req.user.username;
                   // save comment
                   comment.save();
                   publication.comments.push(comment);
                   publication.save();
                   req.flash("success", "Successfully created a publication");
                   res.redirect("/publications/" + publication._id);
               }
            });
        }
    });
});

// EDIT route - comment 
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res) {
    Publication.findById(req.params.id, function(err, foundPublication) {
       if(err || !foundPublication) {
           req.flash("error", "publication not found");
           return res.redirect("back");
       } else {
            Comment.findById(req.params.comment_id, function(err, foundComment) {
               if(err || !foundComment) {
                   res.redirect("back");
               } else {
                   res.render("comments/edit", {publication_id: req.params.id, comment: foundComment})
               }
            });
       }
    });

});

// comment update route
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment) {
        if(err) {
            res.redirect("back");
        } else {
            res.redirect("/publications/" + req.params.id);
        }
    });
});

// comment destroy route
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
  Comment.findByIdAndRemove(req.params.comment_id, function(err) {
      if(err) {
          res.redirect("back");
      } else {
          res.redirect("/publications/" + req.params.id);
      }
  }); 
});


module.exports = router;