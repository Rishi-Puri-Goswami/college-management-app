import app from "./app.js";
import { createServer } from "http";

const server = createServer(app);

server.listen(3002 , ()=>{
    console.log("student server listnig on the port 3002")
});


