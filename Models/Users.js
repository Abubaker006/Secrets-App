const mongoose=require("mongoose");
const passportLocalMongoose=require("passport-local-mongoose");
const findOrCreate=require("mongoose-findorcreate");
const userSchema= new mongoose.Schema({
  email:String, //it contains email
  password:String, //it contains password
  googleId:String, //it contains googleID
  facebookId:String, //it contains facebookID
  secret:String    //it contains secret
});  
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User= module.exports = new mongoose.model("User",userSchema);

