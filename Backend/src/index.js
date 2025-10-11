import dotenv from 'dotenv';
import connectDB from './db/index.js';
import app from './app.js';
import { startMedicationReminderScheduler } from "./utils/notificationScheduler.js";

dotenv.config({path: './.env'});

//connecting db
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERROR: ",error);
        throw error;  
    })

    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
        startMedicationReminderScheduler();
    })
})
.catch((err)=>{
    console.log(`DB connection failed: `,err);
});



















































