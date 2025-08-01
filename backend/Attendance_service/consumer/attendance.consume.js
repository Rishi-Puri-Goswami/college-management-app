import clint, { RETRY_LIST_ATTENDANCE } from "../../redissetup/redis.js";
import { Attendance } from "../module/attendance.module.js";
import { createChannel, EXCHANGE_NAME} from "../rabbitmq/index.js"

const create_attendance_for_student = async () =>{

  
  const ch = await createChannel();
  
  await ch.assertExchange(EXCHANGE_NAME.STUDENT, 'topic', { durable: true });
  await ch.assertQueue('attendance.lookup.q', { durable: true });
  await ch.bindQueue( 'attendance.lookup.q' , EXCHANGE_NAME.STUDENT , 'create.attendance');
  await ch.bindQueue( 'attendance.lookup.q' , EXCHANGE_NAME.STUDENT , 'claculate.attendance.student');
  
  
  ch.consume('attendance.lookup.q', async(msg)=>{

const routingKey = msg.fields.routingKey;


    if(routingKey == "create.attendance" ){

      try {
        
        
        const { studentId,
          classId,
          subjects,
          labs} = JSON.parse(msg.content.toString());
          
          const attendanceExists = await Attendance.findOne({
            studentId
          });
          
          if (attendanceExists) {
            
            ch.sendToQueue (
              msg.properties.replyTo,
              Buffer.from(JSON.stringify({
                status : 400,
                message : "attendance allready there"
              })),
              { correlationId: msg.properties.correlationId }
            );
            ch.ack(msg);
            return;
          }
          
          const monthname = [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12"
          ];
          
          
          
          const subjectlogic = Object.fromEntries(
            subjects.map(subject => [
              subject.name,
              Object.fromEntries(monthname.map(month => [month, []]))
            ])
          );
          
          
          
          const labslogic  = Object.fromEntries(
            labs.map(lab => [
              lab.name ,
              Object.fromEntries(monthname.map(month => [month, []]))
            ] )
          );
        
          const createattendance = await Attendance.create({
            studentId,
            classId,
            subjects: subjectlogic,
            labs : labslogic
          });
          const attendance = createattendance ;

          const key  = `attendance:${studentId}:claculate`;

          await clint.set(key , JSON.stringify(attendance) , "Ex" , 43200 );
          if(createattendance){
            ch.sendToQueue (
              msg.properties.replyTo,
              Buffer.from(JSON.stringify({
                status : 200,
                message : "attendance create successfully"
              })),
              { correlationId: msg.properties.correlationId }
            );
            ch.ack(msg);
            return;
          }
          
          
          
          
        } catch (error) {
          console.log("error on create attendance in attendance consume" , error )
          await redis.rpush(RETRY_LIST_ATTENDANCE, msg.content.toString() , 'EX', 2 * 24 * 60 * 60 );
          ch.ack(msg);  
        }
      }


      if(routingKey == "claculate.attendance.student"){

    
 try {
  
         const {studentId} = JSON.parse(msg.content.toString());
         
 if(!studentId){
   ch.sendToQueue (
               msg.properties.replyTo,
               Buffer.from(JSON.stringify({
                 status : 400,
                 message : "no student privide"
               })),
               { correlationId: msg.properties.correlationId }
             );
             ch.ack(msg);
             return;
 }
 


 const attendance = await Attendance.findOne({studentId})
 
 if(!attendance){
    ch.sendToQueue (
               msg.properties.replyTo,
               Buffer.from(JSON.stringify({
                 status : 404,
                 message : "no student data found"
               })),
               { correlationId: msg.properties.correlationId }
             );
             ch.ack(msg);
             return;
 }
 
 
  ch.sendToQueue (
               msg.properties.replyTo,
               Buffer.from(JSON.stringify({
                 attendance
               })),
               { correlationId: msg.properties.correlationId }
             );
             ch.ack(msg);
             return;
 
 } catch (error) {
  console.log("error on calculate attendance" , error);
 }

      }

})

}




export {create_attendance_for_student};

