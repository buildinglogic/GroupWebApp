var mongoose = require("mongoose");

// schema setup
var publicationSchema = new mongoose.Schema({

    seriesNumber:Number,
    title:String,
    description:String,
    image:String,
    imageId:String,
    
    citation: String,
    url:String,

    publicatedDate: {
        type:Date, 
        default:Date.now()
    },
    createdAt: {
        type:Date,
        default:Date.now()
    },
 
    pulicatedAuthors: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    createdAuthor: {
        id: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String
    },

    highlights: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Highlight"
        }
    ],

    comments:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Comment"
        }
    ]
});

var Publication = mongoose.model("Publication", publicationSchema);

module.exports = Publication;