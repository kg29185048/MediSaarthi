import mongoose from "mongoose";
import {DB_NAME} from "./constant";

import express from "express";
const app = express();

//ifee
//database connection
//always use async await
(
  async ()=>{
    try{
      await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
      
      app.on("error",(error)=>{
          console.log("ERROR: ",error);
          throw error;  
      })

      app.listen(process.env.PORT,()=>{
          console.log(`app is listening on port ${process.env.PORT}`);
      })

    }
    catch(error){
      console.log("ERROR: ",error);
      throw error;
    }
  }
)()