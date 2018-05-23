var mongoose = require("mongoose");

var biographySchema = new mongoose.Schema({
   
   text:String,
   
   createdAuthor:{
      id:{
         type:mongoose.Schema.Types.ObjectId,
         ref:"User"
      },
      username:String
   },

});

module.exports = mongoose.model("Biography", biographySchema);