import express from "express";
import dotenv   from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import dbconnect from "../Attendance_service/dbconnection/dbconnection.js";
import attendancerouter from "./route/attendance.route.js";
import { connectRabbitMQ, EXCHANGE_NAME } from "../Attendance_service/rabbitmq/index.js";
import { create_attendance_for_student } from "./consumer/attendance.consume.js";
import { give_attendance_student } from "./consumer/giveattendance.consumer.js";

const app = express();
dotenv.config({
    path :".env"
})

app.use(cors({
  origin: '*',  
  credentials: true                
}));

app.use(cookieParser());

app.use(express.json());

await connectRabbitMQ(EXCHANGE_NAME.ATTENDANCE);
await create_attendance_for_student();
await give_attendance_student();

app.use("/" , attendancerouter);

dbconnect().then(()=>{

 app.on("error", (error) => {
            console.log(`Server is not talking: ${error}`);
            throw error;
        });


})

export default app;


