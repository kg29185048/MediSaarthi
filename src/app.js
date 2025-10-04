import cookieParser from 'cookie-parser';
import cors from "cors";
import express, { urlencoded } from 'express';

const app = express();

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

//importing routes
import userRouter from "./routes/user.routes.js"
//decalring routes
app.use("/api/v1/users",userRouter);


export default app;