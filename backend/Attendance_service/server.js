import http, { createServer } from "http";
import app from "./app.js";
const server = createServer(app);

server.listen(3005 , ()=>{
    console.log("serrver wsa listning on port 3005");
})
