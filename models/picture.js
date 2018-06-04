var mongoose = require("mongoose");

var pictureSchema = new mongoose.Schema({
    
    belongsToType:String,
    whoOwns:String,
    title:String,
    description:String,
    image:String,
    imageId:String,

    createdAuthor:{
      id:{
         type:mongoose.Schema.Types.ObjectId,
         ref:"User"
      },
      username:String
    },

    location:String,
    lat:Number,
    lng:Number,
});


module.exports = mongoose.model("Picture", pictureSchema);