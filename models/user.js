var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username:String,
    password:String,
    firstName:String,
    lastName:String,
    email:{type:String, unique:true, required:true},
    avatar:String,
    resetPasswordToken:String,
    resetPasswordExpire:Date,
    isAdmin:{type:Boolean, default:false}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);