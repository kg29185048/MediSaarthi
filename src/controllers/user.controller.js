import asyncCreator from "../utils/aysncCreator.js"
import errorHandler from "../utils/errorHandler.js"
import User from "../DataModels/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js"
import { resHandler } from "../utils/resHandler.js";

const registerUser = asyncCreator(async (req,res)=>{
    //get data from frontend
    // validating -- not empty
    // check if user already exist --- email
    // check for images -- send them to cloudinary
    // create user object -- create entry in db
    // remove pasword and refresh token field from response
    // check for user creation - return response

    const {name,email,password,timezone,remainderType} = req.body;

    if (!name) throw new errorHandler(400, "Name is required");
    if (!email) throw new errorHandler(400, "Email is required");
    if (!password) throw new errorHandler(400, "Password is required");

    const existedUser = await User.findOne({email});
    if(existedUser) throw new errorHandler(409,"User already exists...Please Log In");

    let coverImage = { url: "" };
    if (req.files?.coverImage?.[0]?.path) {
        coverImage = await uploadOnCloudinary(req.files.coverImage[0].path);
    }

    const user  = await User.create({
        name,
        email,
        password,
        coverImage: coverImage?.url || "",
        timezone,
        remainderType
    })
    const isCreated = await User.findById(user._id).select("-password -refreshToken");
    if(!isCreated) throw new errorHandler(500,"something went wrong while creating user");

    return res.status(201).json( new resHandler(200 , isCreated , "User registered successfully"));

})

export {registerUser};