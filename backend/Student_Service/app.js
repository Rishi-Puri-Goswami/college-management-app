import express from "express";
import dotenv   from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import dbconnect from "./db_connect/db_connect.js";
import studentroutes from "./routes/student_routes.js";
import { connectRabbitMQ, EXCHANGE_NAME } from "./rabitmq/index.js";

const app  = express();

dotenv.config({
    path:".env"
});

app.use(cors({
    origin: '*',  
    credentials: true                
}));


app.use(cookieParser());

app.use(express.json());


await connectRabbitMQ(EXCHANGE_NAME.STUDENT)
    
dbconnect().then(()=>{

 app.on("error", (error) => {
            console.log(`Server is not talking: ${error}`);
            throw error; 
        });

              
})
app.use("/" , studentroutes );
      
export default app;    


