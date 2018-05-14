var mongoose = require("mongoose");

// schema setup
var publicationSchema = new mongoose.Schema({
    name:String,
    price:String,
    image:String,
    imageId:String,
    description:String,
    location:String,
    lat:Number,
    lng:Number,
    createdAt: {
        type:Date,
        default:Date.now()
    },
    author: {
        id: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String
    },
    comments:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Comment"
        }
    ]
});

var Publication = mongoose.model("Publication", publicationSchema);

module.exports = Publication;