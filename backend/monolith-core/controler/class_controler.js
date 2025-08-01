import clint from "../../redissetup/redis.js";
import { Class } from "../module/class_module.js";
import {  createChannel, EXCHANGE_NAME,  publishEvent,  rpcRequest } from "../rabbitmq/index.js";

const createclass = async (req  , res)=>{

    try {


        const ch = await createChannel();
        await ch.assertExchange(EXCHANGE_NAME.CLASS , "topic" , {durable : true})
        
        const {sem ,branch , section ,subjects , labs} = req.body;

        
        if(!sem || !branch || !section || !subjects){

            return res.status(200).json({message : "all field are require "});

        }

         const findclass = await Class.findOne({sem,branch,section});

         if(findclass){
    return res.status(200).json({message : "class already created"});
}


const createclasses = await Class.create({
    sem,
    branch,
    section,
    subjects,
    labs
})

const classfind = await Class.findOne({
    sem,branch,section
})

if(!classfind){
    return res.status(400).json({message : "class was not found"});
}



if(classfind){
    

await ch.publishEvent(EXCHANGE_NAME.CLASS ,  'teacher.puch.id' , 
    Buffer.from(JSON.stringify({
  subjects,
  labs,
  classid: classfind._id
  })),
   { persistent: true } 
)

}

const key  = `class:${classfind._id}:classdata`;
await clint.set(key , JSON.stringify(classfind));




return res.status(200).json({message : "class create successfully" , createclass});


    } catch (error) {
        console.log("error during class create in server " , error); 
    }

}



export {createclass}





