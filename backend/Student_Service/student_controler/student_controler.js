import clint from "../../redissetup/redis.js";
import { Student } from "../module/student_module.js";
import { createChannel, EXCHANGE_NAME, rpcRequest } from "../rabitmq/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

 const registerstudent = async (req, res) => {

  const ch = await createChannel();
  await ch.assertExchange(EXCHANGE_NAME.STUDENT , "topic", { durable: true });

  try {
    const {
      name,
      phoneno,
      pass,
      email,
      fatherno,
      motherno,
      registration,
      hosteller,
      hostelno,
      roomno,
      batchname,
      section,
      sem
    } = req.body;

    if (!name || !phoneno || !pass || !email || !fatherno || !motherno || !registration || !hosteller || !hostelno || !roomno || !batchname || !section || !sem) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const find = await Student.findOne({ phoneno, email });
    if (find) {
      return res.status(409).json({ message: "Student with this phone or email already exists" });
    }

    let classes = null ;
      const branch = batchname;
     const clintkey = `class:${sem}:${section}:${branch}:classdata`;
     const cash = await clint.get(clintkey);
     classes = cash ? JSON.parse(cash) : null;
     if(!cash){
    classes = await rpcRequest( EXCHANGE_NAME.STUDENT , 'class.data.check', {
      sem, section, branch: batchname
    });
      await clint.set(clintkey ,  JSON.stringify(classes) , "EX" , 18000 )
     }

    if (!classes || classes == null) {
      return res.status(404).json({ message: "No class found for this student" });
    }
     
    const hashedPassword = await bcrypt.hash(pass, 10);

    const registerstudent = await Student.create({
      name,
      phoneno,
      pass: hashedPassword,
      email,
      fatherno,
      motherno,
      registration,
      hosteller,
      hostelno,
      roomno,
      batchname,
      section,
      sem,
      classid : classes._id
    });


    const  findstudent = await Student.findOne({phoneno});
    if(!findstudent){
      return res.status(400).json({message : "student was not found"});
    }
 

 await Promise.all([
ch.publish(
  EXCHANGE_NAME.STUDENT,               
  "pushstudent.id",          
    Buffer.from(JSON.stringify({
      sem, section, branch: batchname , studentid:findstudent._id
    })),
    { persistent: true }         
)

,



ch.publish(
  EXCHANGE_NAME.STUDENT ,               
  'create.attendance',          
  Buffer.from(JSON.stringify({
    studentId: findstudent._id,
      classId: classes._id,
      subjects: classes.subjects,
      labs: classes.labs
  })),
  { persistent: true }          
)
 
]);



    return res.status(200).json({ message: '✅ Student registered and attendance created' });

  } catch (error) {
    console.error("❌ Error on student register:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { phoneno, password } = req.body;

    if (!phoneno || !password) {
      return res.status(200).json({ message: "All fields are required" });
    }

    const user = await Student.findOne({ phoneno });

    if (!user) {
      return res.status(200).json({ message: "Password or phone number is wrong" });
    }

    const passwords = await bcrypt.compare(password, user.pass);

    if (!passwords) {
      return res.status(200).json({ message: "Password or phone number is wrong" });
    }

    const token = jwt.sign(
      { _id: user._id, phoneno: user.phoneno, name: user.name },
      process.env.JWT_KEY
    );
    const option = {
      httpOnly: true,
      sameSite: "none",
      maxAge: 10 * 24 * 60 * 60 * 1000,
      secure: true,
    };

    res.cookie("Student", token, option);

    return res.status(200).json({ message: "student successfully login : " , status : 2000});
  } catch (error) {
    console.log("error on login in server ::>", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
  
const calculateattendance = async (req, res) => {

  try {
    const { day, month } = req.body;
    const studentId = req.Student?._id;

    if(!day || ! month || ! studentId){
      return res.status(404).json({message :"all field are required"});
    }


const key  = `attendance:${studentId}:claculate`;
let data;
let attend = await clint.get(key);
data = JSON.parse(attend);
console.log(data , "form redis");
if(!data){
  
  data = await rpcRequest(EXCHANGE_NAME.STUDENT , "claculate.attendance.student" , {studentId}); 
 
  if(!data){
    return res.status(404).json({message : "no attendance found"});
  }
  await clint.set(key  , JSON.stringify(data) , "EX" ,  43200  );
}



    if (!data) {
      return res.status(200).json({ message: "Attendance not found" });
    }

    const {attendance} = data ;
  console.log(attendance.subjects , "attendance subject")
    let result = [];

    for (const [subjectName, subjectData] of Object.entries(attendance.subjects)) {
      let totalClass = 0;
      let totalPresent = 0;
      let statusOnSelectedDate = null;

      for (let m = 1; m <= parseInt(month); m++) {
        const monthString = m.toString();
        const monthArray = subjectData[monthString] || [];

        const loopTill = (m === parseInt(month)) ? day : monthArray.length;

        for (let i = 0; i < loopTill; i++) {
          const status = monthArray[i];

          if (status !== null && status !== "H" && status !== "S" && status !== undefined) {
            totalClass++;
            if (status === 1) totalPresent++;
          }

          if (m === parseInt(month) && i === day - 1) {
            statusOnSelectedDate = status ?? "N/A";
          }
        }
      }

      const percentage = totalClass > 0
        ? ((totalPresent / totalClass) * 100).toFixed(2)
        : "0.00";

      result.push({
        subject: subjectName,
        totalClass,
        totalPresent,
        attendancePercentage: `${percentage}%`,
        statusOnSelectedDate
      });
    }

    return res.status(200).json({ message: "Attendance Calculated", result });

  } catch (error) {
    console.log("Error during calculating attendance:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const findingnotes = async (req ,res) =>{


  try {

   const studentId = req.Student?._id;

if(!studentId){
  return res.status(200).json({message : "student id not found"});
}

const user = await Student.findById(studentId).select("-pass");

if(!user){
   return res.status(200).json({message : "user not found "});
}

const classid = user.classid;
if(!classid){
   return res.status(200).json({message : "no class was found "});
}

const key = `class:${classid}:notes`
let findnotes ;

const data = await clint.lRange(key, 0, -1);

findnotes = data.map(item => JSON.parse(item));

if(!findnotes){

  findnotes = rpcRequest(EXCHANGE_NAME.STUDENT , "class.note.data" , {classid})

  if(!findnotes.status == 404){
    return res.status(404).json({message : "class id required"});
  }

    if(!findnotes.status == 400){
    return res.status(400).json({message : "notes not found"});
  }



}


return res.status(200).json({message : "notes found" , findnotes});


  } catch (error) {
    console.log("error on finding notes " , error)
  }


}

export {registerstudent , calculateattendance , findingnotes , login}




