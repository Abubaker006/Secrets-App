const mongoose=require("mongoose");
const encrypt=require("mongoose-encryption");

const userSchema= new mongoose.Schema({
  email:String,
  password:String
});  

const secret=process.env.SECRET;   //this is fetched from .env File
userSchema.plugin(encrypt,{secret:secret, encryptedFields:["password"]});  //this has to be added before the Model

const User= module.exports = new mongoose.model("User",userSchema);

