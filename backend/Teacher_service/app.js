import express from "express";
import dotenv   from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import dbconnect from "./db_connect/dbconnect.js";
import teacherroutes from "./routes/teacher_route.js";
import { connectRabbitMQ, EXCHANGE_NAME } from "./rabbitmq/index.js";
import { push_classid_in_teacher_id } from "./teacherconsumer/teacher.consumer.js";



const app = express();
dotenv.config({
    path :".env"
})

app.use(cors({
  origin: '*',    
  credentials: true                
}));

await connectRabbitMQ(EXCHANGE_NAME.TEACHER);
await push_classid_in_teacher_id();

app.use(cookieParser());  
  
app.use(express.json());

dbconnect().then(()=>{

 app.on("error", (error) => {
            console.log(`Server is not talking: ${error}`);
            throw error;
        });

})
app.use("/" , teacherroutes );
export default app;


