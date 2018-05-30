var mongoose = require("mongoose");

var journalSchema = new mongoose.Schema({
    
    title:String,
    journalLink:String,
    coverLink: String
});


module.exports = mongoose.model("Journal", journalSchema);