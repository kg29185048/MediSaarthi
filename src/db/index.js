import mongoose from "mongoose";
import {DB_NAME} from "../constant.js";

import express from "express";
const app = express();

const connectDB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

        console.log(`MongoDB conected! DB HOST: ${connectionInstance.connection.host}`);

        app.on("error",(error)=>{
            console.log("ERROR: ",error);
            throw error;  
        })

        app.listen(process.env.PORT,()=>{
            console.log(`app is listening on port ${process.env.PORT}`);
        })
    }
    catch(error){
      console.log("ERROR: MONGO DB conncetion failed : ",error);
      process.exit(1);
    }
}
export default connectDB;