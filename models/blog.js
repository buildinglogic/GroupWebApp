var mongoose = require("mongoose");

var blogSchema = new mongoose.Schema({
   
   title:String,
   text:String,
   
   createdAt: {
      type:Date,
      default:Date.now()
   },
   createdAuthor:{
      id:{
         type:mongoose.Schema.Types.ObjectId,
         ref:"User"
      },
      username:String
   },

});

module.exports = mongoose.model("Blog", blogSchema);