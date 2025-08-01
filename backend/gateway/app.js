import express from "express";
import expressproxy from "express-http-proxy";

const app = express();

app.use("/teacher" , expressproxy("http://localhost:3001"));
app.use("/student" , expressproxy("http://localhost:3002"));
app.use("/class" , expressproxy("http://localhost:3003"));
app.use("/attendance" , expressproxy("http://localhost:3005"));

app.listen(3000 , ()=>{
    console.log("gateway was listing 3000");
});
