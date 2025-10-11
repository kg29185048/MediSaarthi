import asyncCreator from "../utils/aysncCreator.js";
import errorHandler from "../utils/errorHandler.js";
import jwt from "jsonwebtoken"
import User from "../DataModels/user.model.js"

const verifyJWT = asyncCreator(async (req,res,next)=>{
    try {
            const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        
            if(!token) throw new errorHandler(401,"unauthorised access request");
        
            const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
            if(!user) throw new errorHandler(401,"invalid access Token");
        
            req.user = user;
            next();
    } catch (error) {
        throw new errorHandler(401,error?.message || "invalid access token")
    }

})

export default verifyJWT;