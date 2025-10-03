import dotenv from 'dotenv';
import connectDB from './db/index.js';
import app from './app.js';
import cookieParser from 'cookie-parser';
import cors from "cors";
import express, { urlencoded } from 'express';

dotenv.config({path: './.env'});
//preparing backend to collect data 
app.use(cors({
    origin: process.env.CORS_ORIGIN, //for cross origin request handling 
    credentials: true,
}));
app.use(express.json({
    limit:"20kb",
}));
app.use(urlencoded({
    extended: true,
    limit: "16kb",
}));
app.use(express.static("public"));
app.use(cookieParser());

//connecting db
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERROR: ",error);
        throw error;  
    })

    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log(`DB connection failed: `,err);
});



















































// //ifee
// //database connection
// //always use async await
// (
//   async ()=>{
//     try{
//       const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

//       console.log(`MongoDB conected! DB HOST: ${connectionInstance.connection.host}`);

//       app.on("error",(error)=>{
//           console.log("ERROR: ",error);
//           throw error;  
//       })

//       app.listen(process.env.PORT,()=>{
//           console.log(`app is listening on port ${process.env.PORT}`);
//       })

//     }
//     catch(error){
//       console.log("ERROR: MONGO DB conncetion failed : ",error);
//       throw error;
//     }
//   }
// )()