import dotenv from 'dotenv';
import connectDB from './db/index.js';
import app from './app.js';

dotenv.config({path: './.env'});

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