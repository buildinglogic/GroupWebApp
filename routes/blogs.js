var express = require("express");
var router  = express.Router();
var Publication = require("../models/blog");
var middleware = require("../middleware");


//INDEX - SHOW ALL PUBLICATIONS
router.get("/", function(req, res){
    res.render("blogs/index");
});


module.exports = router; 