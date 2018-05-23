var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    
    username:String,
    password:String,
    prefix:String,
    firstName:String,
    lastName:String,
    
    email:{type:String, unique:true, required:true},
    isAdmin:{type:Boolean, default:false},

    selfie:String,
    selfieId:String,

    bio: {
    	type:mongoose.Schema.Types.ObjectId,
    	ref:"Biography"
    },

    pictures:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Picture"
        }
    ],

    resetPasswordToken:String,
    resetPasswordExpire:Date,

    joinYear:{type:Date, default:Date.now()},
    graduateYear:{type:Date, default:Date.now()},

    location:String,
    lat:Number,
    lng:Number,
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);