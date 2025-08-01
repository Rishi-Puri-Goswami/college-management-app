import app from "./app.js";
import { createServer } from "http";

const server = createServer(app);

server.listen(3003 , ()=>{
    console.log("server was listning on port 3003");
});

