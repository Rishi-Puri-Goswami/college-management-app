
import mongoose from "mongoose";
import { Class } from "../module/class_module.js";
import { createChannel, EXCHANGE_NAME} from "../rabbitmq/index.js";
import clint, { RETRY_LIST_PUSHSTUDENT } from "../../redissetup/redis.js";
import { Note } from "../module/notes_module.js";
const  classlookupqueu = async () => {

  const ch = await createChannel();
  await ch.assertExchange( EXCHANGE_NAME.STUDENT , 'topic', { durable: true });
   await ch.assertQueue('class.lookup.q', { durable: true });
  await ch.bindQueue( 'class.lookup.q' , EXCHANGE_NAME.STUDENT , 'class.data.check');
  await ch.bindQueue( 'class.lookup.q' , EXCHANGE_NAME.STUDENT , 'pushstudent.id');
  await ch.bindQueue( 'class.lookup.q' , EXCHANGE_NAME.STUDENT , 'class.note.data');

ch.prefetch(5);
  
  ch.consume( 'class.lookup.q' , async (msg) => {

    if(!msg){
      return console.log("no msg here");
    }

const routingKey = msg.fields.routingKey;

if(routingKey == 'class.data.check'){

    try {

      const { sem, section, branch } = JSON.parse(msg.content.toString());

      const cls = await Class.findOne({ sem, section, branch }).lean();

             ch.sendToQueue (
        msg.properties.replyTo,
        Buffer.from(JSON.stringify(cls || null)),
        { correlationId: msg.properties.correlationId }
      );
      ch.ack(msg);
    } catch (error) {
      console.error('❌ Error handling message:', error);
      ch.nack(msg, false, false);
    }
  
}

if(routingKey == 'pushstudent.id'){

    try {
      const { sem, section, branch , studentid } = JSON.parse(msg.content.toString());

if (!mongoose.isValidObjectId(studentid)) {
  ch.sendToQueue(
    msg.properties.replyTo,
    Buffer.from(JSON.stringify({ status: 400, message: 'invalid object id' })),
    { correlationId: msg.properties.correlationId }
  );
  ch.ack(msg);
  return;
}

      const cls = await Class.findOneAndUpdate({sem , section , branch } , {$addToSet:{students : studentid}} , {new : true});

  if(!cls){
          ch.sendToQueue (
        msg.properties.replyTo,
        Buffer.from(JSON.stringify({
          status : 400,
          message : "no class found"
        })),
        { correlationId: msg.properties.correlationId }
      );
       ch.ack(msg);
       return;
  }


const key  = `class:${cls._id}:classdata`;
await clint.set(key , JSON.stringify(cls));


  ch.sendToQueue (
        msg.properties.replyTo,
        Buffer.from(JSON.stringify({
          status : 200,
          message : "class update"
        })),
        { correlationId: msg.properties.correlationId }
      );

      
       ch.ack(msg);
       return;
    } catch (error) {
      console.error('❌ Error handling message:', error);

   await redis.rpush( RETRY_LIST_PUSHSTUDENT , msg.content.toString() ,'EX', 2 * 24 * 60 * 60);
     ch.ack(msg); 

    }

}



if(routingKey == 'class.note.data'){

  try {
    const {classid} = JSON.parse(msg.content.toString());

    if(!classid){
    ch.sendToQueue (
        msg.properties.replyTo,
        Buffer.from(JSON.stringify({
          status : 404,
          message : "class id required"
        })),
        { correlationId: msg.properties.correlationId }
      );
 ch.ack(msg);
       return;
    }


    const findnotes = await Note.find({classid});

    if(!findnotes){

          ch.sendToQueue (
        msg.properties.replyTo,
        Buffer.from(JSON.stringify({
          status : 400,
          message : "notes not found"
        })),
        { correlationId: msg.properties.correlationId }
      );
 ch.ack(msg);
       return;
    }


      ch.sendToQueue (
        msg.properties.replyTo,
        Buffer.from(JSON.stringify({
      findnotes
        })),
        { correlationId: msg.properties.correlationId }
      );
 ch.ack(msg);
       return;




  } catch (error) {
    
  }
  





}


  });

  console.log("Class lookup consumer is ready");

};








export {classlookupqueu};


























