/*========================
    HIGHLIGHTS ROUTES
========================*/

var express = require("express");
var router = express.Router({mergeParams:true}); // mergeParams will enable req.params.id to find the id
var Publication = require("../models/publication");
var Highlight = require("../models/highlight");
var middleware = require("../middleware");


// NEW - HIGHLIGHT included in publication show.ejs


// CREATE - HIGHLIGHT 
router.post("/", middleware.isLoggedIn, function(req, res) {
    Publication.findById(req.params.id, function(err, publication) {
        if(err || !publication) {
            req.flash("error", "publication not found");
            res.redirect("/publications");
        } else {
            Highlight.create(req.body.highlight, function(err, highlight) {
               if(err) {
                   req.flash("error", "Highlight creation failed");
                   res.redirect("/publications/" + req.params.id);
               } else {
                   publication.highlights.push(highlight);
                   publication.save();
                   req.flash("success", "Successfully adding a new highlight to the publication");
                   res.redirect("/publications/" + publication._id);
               }
            });
        }
    });
});
 

// SHOW - HIGHLIGHT  included in publication show.ejs


// EDIT - disabled

// UPDATE - disabled
 

// DESTROY - HIGHLIGHT 
router.delete("/:highlight_id", middleware.isLoggedIn, function(req, res) {
  Highlight.findByIdAndRemove(req.params.highlight_id, function(err) {
      if(err) {
          res.redirect("back");
      } else {
          res.redirect("/publications/" + req.params.id);
      }
  }); 
});


module.exports = router;