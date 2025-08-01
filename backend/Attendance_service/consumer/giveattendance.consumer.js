import clint, { RETRY_LIST_ATTENDANCE, RETRY_LIST_GIVE_ATTENDANCE } from "../../redissetup/redis.js";
import { Attendance } from "../module/attendance.module.js";
import { createChannel , EXCHANGE_NAME} from "../rabbitmq/index.js"

const give_attendance_student = async () =>{ 
const ch = await createChannel();

  await ch.assertExchange(EXCHANGE_NAME.TEACHER, 'topic', { durable: true });
  await ch.assertQueue('give.attendance.lookup.q', { durable: true });
  await ch.bindQueue( 'give.attendance.lookup.q' , EXCHANGE_NAME.TEACHER , 'attendance.data');
  await ch.bindQueue( 'give.attendance.lookup.q' , EXCHANGE_NAME.TEACHER , 'lab.data');

  ch.consume('give.attendance.lookup.q', async(msg)=>{
      
      const routingKey = msg.fields.routingKey;

      if(routingKey == "attendance.data"){
        
        console.log("inside the iffffffffffffffff")
      
   try {
         const {
       subjectname,
      studentids,
      day,
      month
     } = JSON.parse(msg.content.toString());
  
        console.log("inside ");
  
     for (let i = 0; i < studentids?.length; i++) {
        console.log("inside the forrrrrrrrrrrr")
 
       const { id , status } = studentids[i];
 
       const attendance = await Attendance.findOne({ studentId: id });
 
       if (!attendance) {
         console.log(`Attendance not found for student ${id}`);
         continue;
       }
 
 
       let subjectData = attendance.subjects.get(subjectname);
 
 
       if (!subjectData) {
        return console.log(`Subject '${subjectname}' not found for student ${id}`);
        
       }
       if (!subjectData[month]) {
         subjectData[month] = [];
       }
 
       subjectData[month][day - 1] = status;
 
   
       attendance.subjects.set(subjectname, subjectData);
 
       await attendance.save();


       const att = await Attendance.findOne({ studentId: id });

if(!att){
  return console.log("attendnace not found for this student");
}

console.log(att , "skdskdm");

const key  = `attendance:${id}:claculate`;
await clint.set(key , JSON.stringify({attendance:att}) , "EX" ,   43200   )

     }

           ch.sendToQueue (
         msg.properties.replyTo,
         Buffer.from(JSON.stringify({
           status : 200,
           message : "attendance give successfully"
         })),
         { correlationId: msg.properties.correlationId }
       );
        ch.ack(msg);
        return;


   } catch (error) {
    console.log("error on give subject attendance" , error)
   }
    }


if(routingKey == 'lab.data'){

try {

      const {
            subjectname ,
            studentids ,
            day ,
            month
        } = JSON.parse(msg.content.toString());


        
        for(let i = 0 ; i < studentids.length ; i++){

            let {id  , status } = studentids[i];

           const findattendance = await Attendance.findOne({studentId : id});

           if(!findattendance){
             return res.status(200).json({message : "attendance was not found :"});
           }

           let labdata = findattendance.labs.get(subjectname);

            if (!labdata) {
       return console.log(`Subject '${subjectname}' not found for student ${id}`);
      }

       if (!labdata[month]) {
        subjectData[month] = [];
      }


      labdata[month][day- 1] = status;

      findattendance.labs.set( subjectname, labdata);
       
      await findattendance.save();

      
    }
    

       ch.sendToQueue (
         msg.properties.replyTo,
         Buffer.from(JSON.stringify({
           status : 200,
           message : "attendance give successfully"
         })),
         { correlationId: msg.properties.correlationId }
       );
        ch.ack(msg);
        return;



    
} catch (error) {
    console.log("error on give attendance  in lab " , error)
}

}

      }


  )

}

export {give_attendance_student};

