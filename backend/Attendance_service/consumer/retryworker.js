import { RETRY_LIST_ATTENDANCE, RETRY_LIST_GIVE_ATTENDANCE } from "../../redissetup/redis.js";
import { createChannel, EXCHANGE_NAME } from "../rabbitmq/index.js";

const ch = await createChannel();
  await ch.assertExchange(EXCHANGE_NAME.STUDENT , "topic", { durable: true });
  
setInterval(async () => {
  try {
   
    const job = await redis.lpop(RETRY_LIST_ATTENDANCE);
    if (!job) return;

    const data = JSON.parse(job);
    console.log('♻️ retrying attendance for', data.studentId);
ch.publish(
  EXCHANGE_NAME.STUDENT,               
  "create.attendance",          
 Buffer.from(job),
  { persistent: true }         
)
  } catch (err) {
    console.error('Retry worker error:', err);
  }
}, 30_000);


const ch1 = await createChannel();
  await ch1.assertExchange(EXCHANGE_NAME.TEACHER , "topic", { durable: true });

setInterval(async () => {
  try {
   
    const job = await redis.lpop(RETRY_LIST_GIVE_ATTENDANCE);
    if (!job) return;

    const data = JSON.parse(job);
    console.log('♻️ retrying attendance for', data.studentId);
ch.publish(
  EXCHANGE_NAME.STUDENT,               
  "attendance.data",          
 Buffer.from(job),
  { persistent: true }         
)
  } catch (err) {
    console.error('Retry worker error:', err);
  }
}, 30_000);

