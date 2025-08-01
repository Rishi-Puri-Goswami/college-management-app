import jwt from "jsonwebtoken"
import { Student } from "../module/student_module.js";

const verifystudent = async (req , res ,next )=>{

    try {
        
      const token = req.cookies?.Student;
        if(!token){
            return res.status(200).json({message : "Unauthorized: no token" , status : 401});
        }

        const decoded = jwt.verify(token , process.env.JWT_KEY);

        if(!decoded){
            return res.status(200).json({message : "problem in decoded token :"})
        }

        const findStudent = await Student.findById(decoded._id).select("-pass -email");
if(!findStudent){
    return res.status(200).json({message : "Student not found  "});
}

req.Student = findStudent ;

next();


    } catch (error) {
        console.log("error during verifyStudent in middleware" , error);
    }


}


export {verifystudent};