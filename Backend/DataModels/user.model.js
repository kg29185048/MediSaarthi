import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; //jwt is a bearer token ---key

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true},
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required:[true,"Password is Required"]},
    coverImage: {type: String},
    timezone: { type: String, default: "UTC" },
    reminderType: { type: String, enum: ["email", "browser"], default: "email" },
    preferences: { type: Object, default: {} },
    refreshToken: {type: String},
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
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
userSchema.methods.generateRefreshTokens = function (){
    return jwt.sign({
        _id: this._id,
    },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
      }
    ) 
}

export default mongoose.model("User", userSchema);
