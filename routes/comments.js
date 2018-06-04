/*========================
    COMMENTS ROUTES
========================*/

var express = require("express");
var router = express.Router({mergeParams:true}); // mergeParams will enable req.params.id to find the id
var Publication = require("../models/publication");
var Comment = require("../models/comment");
var middleware = require("../middleware");


// NEW - COMMENT included in publication show.ejs

 
// CREATE - COMMENT 
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


// SHOW - COMMENT  included in publication show.ejs


// EDIT - COMMENT  included in publication show.ejs


// UPDATE - COMMENT 
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment) {
        if(err) {
            res.redirect("back");
        } else {
            res.redirect("/publications/" + req.params.id);
        }
    });
});
 

// DESTROY - COMMENT 
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