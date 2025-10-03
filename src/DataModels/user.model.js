import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; //jwt is a bearer token ---key
import { use } from "react";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true},
    email: { type: String, required: true, unique: true, lowercase: true, unique: true },
    password: { type: String, required:[true,"Password is Required"]},
    timezone: { type: String, default: "UTC" },
    reminderType: { type: String, enum: ["email", "browser"], default: "email" },
    preferences: { type: Object, default: {} },
    refreshToken: {type: String},
  },
  { timestamps: true }
);

userSchema.pre("save", async function(next) {  //before doing some action pre does processing based on given function
  if(this.isModified("password")) return next();

  this.password = bcrypt.hash(this.password,10); //10 hashes rounds
  next(); // calling next to give update to next method
})
// before exporting check if pass is correct
userSchema.methods.isPassCorrect = async function(password) {
  return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessTokens = function (){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        name: this.name
    },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
      }
    )
}
userSchema.methods.generateRefereshTokens = function (){
    return jwt.sign({
        _id: this._id,
    },
      process.env.REFERESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFERESH_TOKEN_EXPIRY
      }
    ) 
}

export default mongoose.model("User", userSchema);
