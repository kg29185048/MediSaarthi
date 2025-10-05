import asyncCreator from "../utils/aysncCreator.js"
import errorHandler from "../utils/errorHandler.js"
import User from "../DataModels/user.model.js";
import { resHandler } from "../utils/resHandler.js";

const generateAccessAndRefereshTokens = async (userid)=>{
    try {
        const user = await User.findById(userid)
        const accessToken = user.generateAccessTokens()
        const refereshtoken = user.generateRefereshTokens()
        user.refreshToken = refereshtoken;
        await user.save({validateBeforeSave:false})

        return {accessToken,refereshtoken};
    } catch (error) {
        throw new errorHandler(500,"Something went wrong while generating referesh and access tokens")
    }
}

const registerUser = asyncCreator(async (req,res)=>{
    //get data from frontend
    // validating -- not empty
    // check if user already exist --- email
    // check for images -- send them to cloudinary
    // create user object -- create entry in db
    // remove pasword and refresh token field from response
    // check for user creation - return response

    const {name,email,password} = req.body;

    if (!name) throw new errorHandler(400, "Name is required");
    if (!email) throw new errorHandler(400, "Email is required");
    if (!password) throw new errorHandler(400, "Password is required");

    const existedUser = await User.findOne({email});
    if(existedUser) throw new errorHandler(409,"User already exists...Please Log In");

    // let coverImage = { url: "" };
    // if (req.files?.coverImage?.[0]?.path) {
    //     coverImage = await uploadOnCloudinary(req.files.coverImage[0].path);
    // }

    const user  = await User.create({
        name,
        email,
        password,
        // coverImage: coverImage?.url || "",
        // timezone,
        // remainderType
    })
    const isCreated = await User.findById(user._id).select("-password -refreshToken");
    if(!isCreated) throw new errorHandler(500,"something went wrong while creating user");

    return res.status(201).json( new resHandler(201 , isCreated , "User registered successfully"));

})


const loginUser = asyncCreator(async (req,res)=>{
    //get data from frontend
    //check if anything is empty 
    //validate the data  with database using email
    // password check
    //access and referesh token
    //send cookies
    //send response or redirect

    const {email,password} = req.body;
    if(!email){
        throw new errorHandler(400,"enter your email id")
    }
    const ifUser = await User.findOne({email})
    if(!ifUser) throw new errorHandler(400,"user does not exists! please register")
    
    const isValid  = await ifUser.isPassCorrect(password)
    if(!isValid) throw new errorHandler(400,"Please enter correct password")
    
    const {accessToken, refereshtoken} = generateAccessAndRefereshTokens(ifUser._id);

    const loggedInUser = await User.findById(ifUser._id).select("-password -refreshToken");
    const option = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refereshtoken,option)
    .json(
        new resHandler(200,
            {
                user: loggedInUser,refereshtoken,accessToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncCreator(async (req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken: undefined,
            }
        },
        {
            new:true
        }
    ) 
    const option = {
        httpOnly: true,
        secure: true,
    }
    res.status(200)
    .clearCookie('accessToken',option)
    .clearCookie("refreshToken")
    .json(new resHandler(200,{},"User logged out successfully"));
})

export { registerUser , loginUser , logoutUser};