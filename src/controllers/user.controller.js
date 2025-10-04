import asyncCreator from "../utils/aysncCreator.js"

const registerUser = asyncCreator(async (req,res)=>{
    res.status(200).json({
        message: "OK",
    })
})

export {registerUser};