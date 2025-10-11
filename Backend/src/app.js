import cookieParser from 'cookie-parser';
import cors from "cors";
import express, { urlencoded } from 'express';

const app = express();

//preparing backend to collect data 
app.use(cors({
    origin: "http://localhost:5173", //for cross origin request handling 
    credentials: true,
}));
app.use(express.json());
app.use(urlencoded({
    limit: "16kb",
}));
app.use(express.static("public"));
app.use(cookieParser());

//importing routes
import userRouter from "./routes/user.routes.js"
//decalring routes
app.use("/api/v1/users",userRouter);


export default app;