import express from "express";
import dotenv   from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { classroute } from "./routes/class_routes.js";
import dbconnect from "./bdconnect/dbconnect.js";
import { connectRabbitMQ, EXCHANGE_NAME } from "./rabbitmq/index.js"
import { classlookupqueu } from "./consumer/class_consumer.js";
import uploadnotesque from "./consumer/notes_consumer.js";


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


await connectRabbitMQ(EXCHANGE_NAME.CLASS);
await classlookupqueu();
await uploadnotesque();

dbconnect().then(()=>{

 app.on("error", (error) => {
            console.log(`Server is not talking: ${error}`);
            throw error;
        });

})
app.use("/" , classroute );
export default app;


