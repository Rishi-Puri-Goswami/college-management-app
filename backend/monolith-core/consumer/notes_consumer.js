import mongoose from "mongoose";
import clint from "../../redissetup/redis.js";
import { Note } from "../module/notes_module.js";
import { createChannel, EXCHANGE_NAME } from "../rabbitmq/index.js"

const uploadnotesque = async () =>{


const ch = await createChannel();

  await ch.assertExchange(EXCHANGE_NAME.TEACHER , 'topic' , { durable: true } );
  await ch.assertQueue('upload.notes.q' , {durable : true});
  await ch.bindQueue( 'upload.notes.q' , EXCHANGE_NAME.TEACHER , 'upload.notes');
  await ch.bindQueue( 'upload.notes.q' , EXCHANGE_NAME.TEACHER , 'delete.notes');

ch.prefetch(5);

ch.consume('upload.notes.q', async (msg)=>{

    if(!msg){
        return console.log("no msg here");

    }

    const routingKey = msg.fields.routingKey;

    if(routingKey == 'upload.notes'){

        try {
            
            const {message , pdfurl , name , phoneno , classid} = JSON.parse(msg.content);

console.log(message , pdfurl , name , phoneno , classid , "notes dataaaaaaaaaaaaaa");

            if(!message || !pdfurl ||! name || !phoneno || !classid ){

//  ch.ack(msg);

                return console.log("all field are required");
            }



console.log(classid , "class idddddddd")
if(!mongoose.isValidObjectId(classid)){
  return console.log("invalid object id");
}

            const teacher = {
                name ,
              phonoNo:phoneno ,
              // image 
            }


            const createnotes = await Note.create({
           classid ,
            pdfurl ,
           teacher ,
              message
            
            })


            if(!createnotes){
                return console.log("notes not create");
            }


            const key = `class:${classid}:notes`

          await clint.rpush(key , JSON.stringify(createnotes));


             ch.sendToQueue (
        msg.properties.replyTo,
        Buffer.from(JSON.stringify({
          status : 200,
          message : "notes create"
        })),
        { correlationId: msg.properties.correlationId }
      );

      
       ch.ack(msg);
       return;

        } catch (error) {
            console.log("error on upload notes" , error);

        }


    }




    if(routingKey ==  "delete.notes" ){

      try {

            const {classid , notesid} = JSON.parse(msg.content);

if(!classid || !notesid){
  return console.log("all  field are required");
}

const findnotes = await Note.findByIdAndDelete(notesid);

  ch.sendToQueue (
        msg.properties.replyTo,
        Buffer.from(JSON.stringify({
          status : 200,
          message : "notes delete"
        })),
        { correlationId: msg.properties.correlationId }
      );

      
       ch.ack(msg);
       return;



        
      } catch (error) {
        console.log("error on delete notes from db " , error)
      }

    }



})



}


export default uploadnotesque ;