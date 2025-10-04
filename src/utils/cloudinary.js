import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"; //file system from node

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (filepath)=>{
    try {
        if(!filepath) return null;
        const response  = await cloudinary.uploader.upload(filepath,{
            resource_type: "auto",
        })
        
        console.log("File uploaded on cloudinary successfully: ",response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(filepath); //remove locally saved file as operation failed
        return null;
    }
}

export default uploadOnCloudinary;