var express = require("express");
var router = express.Router();


router.get("/circles", function(req, res) {
   res.render(__dirname + "funnyGames/circles/index");
});


module.exports = router;