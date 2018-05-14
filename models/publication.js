var mongoose = require("mongoose");

// schema setup
var publicationSchema = new mongoose.Schema({

    title:String,
    image:String,
    imageId:String,
    description:String,
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

    comments:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Comment"
        }
    ]
});

var Publication = mongoose.model("Publication", publicationSchema);

module.exports = Publication;