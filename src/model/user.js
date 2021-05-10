const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//create schema
const userModel = new Schema({
  name: {
    type: String,
    required: true
  },

    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true
    },
    confirmpassword: {
      type: String,
      required: true
    },
    role:{
        type: String,
        required: true
       
    },
    
    // resetLink: {
    //   data: String,
    //   default: ''
    resetPasswordToken: String,

    resetPasswordExpires: Date ,
    
    tokens:[{
      token:{
        type: String,
        required: true
      }
    }]

    
   }, {timestamps: true}
   ) 

//generating token

userModel.methods.generateAuthToken = async function(){
  try{
    console.log(this_id);
    const token = jwt.sign({ _id:this_id.toString()}, "thisisherdinternationalregisterpage");
    this.tokens = this.tokens.concat({token:token});
    await this.save();
    return token;

  }catch(error){
    res.send("the error part" + error);
    console.log("the error part" + error);
  }
}

//converting password into hash

userModel.pre("save", async function(next){
  if(this.isModified("password")){
    this.password = await bcrypt.hash(this.password, 10);
    this.confirmpassword = await bcrypt.hash(this.confirmpassword, 10);
  }
  next();
})

//create model
const Register = new mongoose.model('Register', userModel);


//export the model
module.exports = Register;
