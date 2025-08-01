import {createServer} from "http";
import app from "./app.js";

const serves = createServer(app);

serves.listen(3001,()=>{
    console.log("teacher server was listning on port 3001");
})

