import jwt from "jsonwebtoken"
import { Teacher } from "../teacher_module/teacher.module.js";

const verifyteacher = async (req , res ,next )=>{

    try {
        
     const token = req.cookies?.Teacher;
console.log(token);
      if(!token){
        return res.status(200).json({message:"Unauthorized no token" , status : 401});
      }

      const decoded = jwt.verify(token , process.env.JWT_KEY);

      if(!decoded){
        return res.status(200).json({message : "error in decoded token"});
      }

      const findTeacher  = await Teacher.findById(decoded.id).select("-pass");
if(!findTeacher){
    return res.status(200).json({message : "teacher not found "});
}

req.Teacher = findTeacher;
next();


    } catch (error) {
        console.log("error in virefying teacher in middleware ::>" , error);
        
    }


}

export {verifyteacher};

