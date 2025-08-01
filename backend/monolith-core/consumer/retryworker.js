import { RETRY_LIST_PUSHSTUDENT } from "../../redissetup/redis.js";
import { createChannel, EXCHANGE_NAME } from "../rabbitmq/index.js";

const ch = await createChannel();
  await ch.assertExchange(EXCHANGE_NAME.STUDENT , "topic", { durable: true });
setInterval(async () => {
  try {
   
    const job = await redis.lpop(RETRY_LIST_PUSHSTUDENT);
    if (!job) return;
    const data = JSON.parse(job);
    console.log('♻️ retrying attendance for', data);
   ch.publish(
      EXCHANGE_NAME.STUDENT,
      'pushstudent.id',
      Buffer.from(job),
      { persistent: true }
    );

  } catch (err) {
    console.error('Retry worker error:', err);
  }
}, 30000 );














