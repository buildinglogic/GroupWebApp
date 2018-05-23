var mongoose = require("mongoose");

var highlightSchema = new mongoose.Schema({
   
   journalName: String,
   highlightLink: String
   
});

module.exports = mongoose.model("Highlight", highlightSchema);