import { Teacher } from "../teacher_module/teacher.module.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import clint from "../../redissetup/redis.js"
import { createChannel, EXCHANGE_NAME } from "../rabbitmq/index.js"


const registerteacher = async (req , res )=>{

try {
    
    const {name , pass , phoneno , email , subject , role  , teacherid} = req.body ;
    
    if(!name || !pass || !phoneno || !email || !subject || !role || !teacherid){
        return res.status(200).json({message : "all field are require"});
    }    
 
    const findteacher = await Teacher.findOne({phoneno});
    if(findteacher){
        return res.status(200).json({message : "teacher already created with this phone  number "});
    }

const salt = await bcrypt.genSalt(10);
const harsh = await bcrypt.hash(pass , salt);

    const createteacher = await Teacher.create({
        name,
        pass:harsh ,
        phoneno,
        email,
        subject,
        role,
        teacherid
    })

    const teacher = await Teacher.findOne({teacherid})
    if(teacher){
        return res.status(200).json({message : "teacher successfully register " , teacher});  
    }




} catch (error) {
   console.log("error in during register teacher" , error) 
}    



}

const loginTeacher = async (req , res) =>{

    try {
        const {phoneno , pass } = req.body;
        if(!phoneno || !pass){
            return res.status(200).json({message : "all field are require "});
        }


        const finduser = await Teacher.findOne({phoneno});

        if(!finduser){
            return res.status(200).json({message : "password or phoneno are wrong : "});
        }

        const passwords = await bcrypt.compare(pass , finduser.pass)
        
        if(!passwords){
            return res.status(200).json({message : "password or phoneno are wrong :"});
        }


        const token =  jwt.sign({id:finduser._id  ,  phoneno:finduser.phoneno
        } , process.env.JWT_KEY)

const Option = {

    httpOnly: true,
    secure: true,
      sameSite: "none",
      maxAge: 10 * 24 * 60 * 60 * 1000,
}
        res.cookie("Teacher" ,token , Option );

        const teacher = await Teacher.findById(finduser._id).select("-pass");

if(!teacher){
    return res.status(200).json({message : "teacher loging error"});
}

return res.status(200).json({message : "tecaher login successfully " , status : 2000 , teacher});




    } catch (error) {
        console.log("error during login teacher from server  :" , error)
    }

}

const show_perticular_class = async ( req ,res )=>{

try {

    const teacherid = req.Teacher?._id;

    if(!teacherid){
        return res.status(400).json({message : "invalide user no teacher id found"})
    }

    const findteacher = await Teacher.findById(teacherid).select("-password");
    if(!findteacher){
      return res.status(404).json({message : "teacher not found"})
    }

    const classid = findteacher.classid;
const classdata = [];
    for(let i = 0 ; i < classid.length ; i++){

    const key  = `class:${classid[i]}:classdata`;
    const a = await clint.get(key);
    
  classdata.push(a);

    }

res.status(200).json({message : "all class was find" , classdata });

} catch (error) {
   console.log("error on find class in teacher controler " , error) 
}


}

const giveattendancesub = async (req, res) => {

  try {

const ch = await createChannel();
await ch.assertExchange(EXCHANGE_NAME.TEACHER , "topic" , {durable: true });

    const teacherid = req.Teacher?._id

    const {subjectname ,  studentids} = req.body;

    if (!subjectname || !studentids) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const now = new Date();
    const day = now.getDate(); 
    const month = (now.getMonth() + 1).toString(); 


    const  attendancedata = {
      subjectname,
      studentids,
      day,
      month
    }


    ch.publish(EXCHANGE_NAME.TEACHER , "attendance.data" ,  
 Buffer.from(JSON.stringify(attendancedata)
    ),
  { persistent: true }   )

  return res.status(200).json({message : "attendance  successfully save "  , attendancedata })

  } catch (error) {
    console.error("Error during attendance update:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const give_lab_attendance = async (req  , res)=>{

    try {

        const ch = await createChannel();
await ch.assertExchange(EXCHANGE_NAME.TEACHER , "topic" , {durable: true });

        const {subjectname , studentids} = req.body;

        if(!subjectname || !studentids){
            return res.status(200).json({message : "all field are required :"});
        }

    const now = new Date();
    const day = now.getDate(); 
    const month = (now.getMonth() + 1).toString(); 

        const labdata = {
            subjectname ,
            studentids ,
            day ,
            month
        }

ch.publish(EXCHANGE_NAME.TEACHER , 'lab.data' , Buffer.from(labdata),{persistent : true})

return res.status(200).json({message : "attendance  give successfully"})


    //     for(let i = 0 ; i < studentids.length ; i++){

    //         let {id  , status } = studentids[i];

    //        const findattendance = await Attendance.findOne({studentId : id});

    //        if(!findattendance){
    //          return res.status(200).json({message : "attendance was not found :"});
    //        }

    //        let labdata = findattendance.labs.get(subjectname);

    //         if (!labdata) {
    //    return console.log(`Subject '${subjectname}' not found for student ${id}`);
    //   }

    //    if (!labdata[month]) {
    //     subjectData[month] = [];
    //   }


    //   labdata[month][day- 1] = status;

    //   findattendance.labs.set( subjectname, labdata);
       
    //   await findattendance.save();

      
    // }
    
   

        
    } catch (error) {
        console.log("error on give attendance to student in lab " , error)
    } 


}

const uploadnotes = async (req , res)=>{


    try {

        const ch = await createChannel();
         ch.assertExchange(EXCHANGE_NAME.TEACHER , "topic" , {durable: true } );


        const teacherid = req.Teacher?._id;
        const {classid} = req.params;
if(!teacherid){
return res.status(404).json({message : "teacher id not found"});
}

if(!classid){
    return res.status(404).json({message :"class id is required"});
}


const {message , pdfurl} = req.body ; 

if(!message){
    return res.status(404).json({message : "message is required"})
}

const teacher = await Teacher.findById(teacherid).select("-passwords")

if(!teacher){
return res.status(404).json({message : "teacher not found"});
}


const name  = teacher.name;
const  phoneno = teacher.phoneno;

console.log(message , pdfurl , name , phoneno , classid , "notes data")

 ch.publish(EXCHANGE_NAME.TEACHER , "upload.notes" , Buffer.from(JSON.stringify({message , pdfurl , name , phoneno , classid })) , {persistent : true} )

 return res.status(200).json({message : "notes upload successfully "});


    } catch (error) {
        console.log("error on upload notes" , error)
    }


}


const deleatenotes = async ( req , res )=>{

    try {
  
         const {classid} = req.params;
         const {notesid} = req.params;
         
         if(!notesid){
             return res.status(200).json({message : "pdfuri was not found"});
            }
            
            const key = `class:${classid}:notes`
         
     
        const data = await clint.lrange(key, 0, -1);


        let foundnotes = null;

        for(let notesstring  of data){

const notes = JSON.parse(notesstring);
if(notes._id === notesid){
    foundnotes = notesstring
    break ;
}
        }

        if(!foundnotes){
            return res.status(404).json({message : "notes not found in redis"});
        }

        await clint.lrem(key , 1 , foundnotes);


        const ch = await createChannel();
        ch.assertExchange(EXCHANGE_NAME.TEACHER , 'topic' , {durable : true});

        ch.publish(EXCHANGE_NAME.TEACHER , 'delete.notes' , Buffer.from(JSON.stringify({classid , notesid})) , {persistent : true} )
    

      return res.status(200).json({message : "delete this note successfully "});

    } catch (error) {
       console.log("error on during deleate notes in server " , error) 
    }

}























    // for (let i = 0; i < studentids.length; i++) {
    //   const { id, status } = studentids[i];

    //   const attendance = await Attendance.findOne({ studentId: id });

    //   if (!attendance) {
    //     console.log(`Attendance not found for student ${id}`);
    //     continue;
    //   }


    //   let subjectData = attendance.subjects.get(subjectname);


    //   if (!subjectData) {
    //    return console.log(`Subject '${subjectname}' not found for student ${id}`);
       
    //   }




    //   if (!subjectData[month]) {
    //     subjectData[month] = [];
    //   }

    //   subjectData[month][day - 1] = status;

  
    //   attendance.subjects.set(subjectname, subjectData);

    //   await attendance.save();
    // }








export {registerteacher , loginTeacher , show_perticular_class , giveattendancesub , give_lab_attendance , uploadnotes , deleatenotes}

