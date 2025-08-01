import { Teacher } from "../teacher_module/teacher.module.js";
import mongoose from "mongoose";
import { createChannel, EXCHANGE_NAME } from '../rabbitmq/index.js';
import { RETRY_LIST_TEACHERLIST } from "../../redissetup/redis.js";
export const push_classid_in_teacher_id = async () => {

  const ch = await createChannel();
  await ch.assertExchange(EXCHANGE_NAME.CLASS , 'topic', { durable: true });
  await ch.assertQueue('teacher.push.q', { durable: true });
  await ch.bindQueue('teacher.push.q', EXCHANGE_NAME.CLASS , 'teacher.puch.id');

  ch.prefetch(5);

  ch.consume('teacher.push.q', async (msg) => {
    if (!msg) {
      console.log('🔄 consumer cancelled by broker – restarting soon');
      return;
    }


    try {
      const { subjects = [], labs = [], classid } = JSON.parse(msg.content.toString());
      const classObjectId = classid;

      for (const { teacherId } of subjects) {
        await Teacher.updateOne(
          { teacherid: teacherId, classid: { $ne: classObjectId } },
          { $push: { classid: classObjectId } }
        );
      }

      for (const { teacherId } of labs) {
        await Teacher.updateOne(
          { teacherid: teacherId, labs: { $ne: classObjectId } },
          { $push: { labs: classObjectId } }
        );
      }

      if (msg.properties.replyTo) {
        ch.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify({ status: 200, message: 'success' })),
          { correlationId: msg.properties.correlationId }
        );
      }

      ch.ack(msg);
    } catch (err) {

      console.error('❌ consumer error', err);
      await redis.rpush(RETRY_LIST_TEACHERLIST, msg.content.toString());
        ch.ack(msg);     
    }
  });

  console.log('✅ teacher-consumer is up and listening');
};





// await ch.assertQueue('class.rpc.q', { durable: true }); // 👈 Single queue
// await ch.bindQueue('class.rpc.q', 'class_exchange', 'class.getById');
// await ch.bindQueue('class.rpc.q', 'class_exchange', 'class.getByBranch');
// await ch.bindQueue('class.rpc.q', 'class_exchange', 'class.getAll');


// ch.consume('class.rpc.q', async (msg) => {
//   const routingKey = msg.fields.routingKey;

//   if (routingKey === 'class.getById') {
//     // do getById logic
//   } else if (routingKey === 'class.getByBranch') {
//     // do getByBranch logic
//   } else if (routingKey === 'class.getAll') {
//     // do getAll logic
//   }
// });
