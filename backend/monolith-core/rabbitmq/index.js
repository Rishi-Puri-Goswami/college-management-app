import amqp from 'amqplib';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();

export const EXCHANGE_NAME = {
  TEACHER: 'teacher.server.exchange',
  STUDENT: 'student.server.exchange',
  ATTENDANCE: 'attendance.server.exchange',
  CLASS: 'class.server.exchange'
};

// const RABBITMQ_URL = process.env.RABBIT_URL || 'amqp://localhost';

let connection = null;
let consumerChannel = null;

// 2. help to connect with server or cloud 
export const connectRabbitMQ = async (exchange) => {
  try {
    if (!connection) {
      connection = await amqp.connect("amqps://cmflcwal:h37XazIm6s4a4kNcMmGOU7eGljZtnZ53@fuji.lmq.cloudamqp.com/cmflcwal");
      console.log('✅ Connected to RabbitMQ');
    }
    if (!consumerChannel) {
      consumerChannel = await connection.createChannel();
      await consumerChannel.assertExchange(exchange, 'topic', { durable: true });
      console.log(`✅ Consumer channel ready with exchange '${exchange}'`);
    }
  } catch (err) {
    console.error('❌ RabbitMQ connection failed:', err);
  }
};

// help to send data from one server to another 
export const publishEvent = async (exchange, routingKey, data) => {
  const pubChannel = await connection.createChannel();
  await pubChannel.assertExchange(exchange, 'topic', { durable: true });

  pubChannel.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );

  console.log(`📤 Published to '${exchange}' with key '${routingKey}'`);
  await pubChannel.close();
};

// 3. Subscribe event (long-lived consumers)
export const subscribeEvent = async (exchange, routingKey, handleFn) => {
  if (!consumerChannel) throw new Error('Consumer channel not ready');

  const { queue } = await consumerChannel.assertQueue('', { exclusive: true });
  await consumerChannel.bindQueue(queue, exchange, routingKey);

  consumerChannel.consume(queue, async (msg) => {
    try {
      if (!msg) return;
      const data = JSON.parse(msg.content.toString());
      await handleFn(data);
      consumerChannel.ack(msg);
    } catch (err) {
      console.error('❌ Error handling message:', err);
      consumerChannel.nack(msg, false, false);
    }
  });

  console.log(`👂 Subscribed to '${exchange}' → '${routingKey}'`);
};

// 4. RPC Request (request-reply)
export const rpcRequest = async (exchange, routingKey, payload, ttl = 5000) => {
  const rpcConn = await amqp.connect("amqps://cmflcwal:h37XazIm6s4a4kNcMmGOU7eGljZtnZ53@fuji.lmq.cloudamqp.com/cmflcwal");
  const rpcChannel = await rpcConn.createChannel();
  await rpcChannel.assertExchange(exchange, 'topic', { durable: true });

  return new Promise(async (resolve, reject) => {
    const correlationId = crypto.randomUUID();
    const { queue } = await rpcChannel.assertQueue('', { exclusive: true });

    const timer = setTimeout(async () => {
      await rpcChannel.deleteQueue(queue).catch(() => {});
      await rpcChannel.close().catch(() => {});
      await rpcConn.close().catch(() => {});
      reject(new Error('RPC timeout'));
    }, ttl);

    await rpcChannel.consume(
      queue,
      async (msg) => {
        if (!msg) return;
        if (msg.properties.correlationId === correlationId) {
          clearTimeout(timer);
          const response = JSON.parse(msg.content.toString());
          await rpcChannel.deleteQueue(queue).catch(() => {});
          await rpcChannel.close().catch(() => {});
          await rpcConn.close().catch(() => {});
          resolve(response);
        }
      },
      { noAck: true }
    );

    rpcChannel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      {
        correlationId,
        replyTo: queue,
        expiration: ttl
      }
    );
  });
};

// 5. Graceful shutdown
export const closeRabbitMQ = async () => {
  try {
    await consumerChannel?.close();
    await connection?.close();
    console.log('🔌 RabbitMQ connection closed');
  } catch (err) {
    console.error('❌ Shutdown error:', err);
  }
};

// 6. Optional: create ad-hoc channel
export const createChannel = async () => {
  if (!connection) {
    connection = await amqp.connect("amqps://cmflcwal:h37XazIm6s4a4kNcMmGOU7eGljZtnZ53@fuji.lmq.cloudamqp.com/cmflcwal");
  }
  return await connection.createChannel();
};

process.on('SIGINT', closeRabbitMQ);
process.on('SIGTERM', closeRabbitMQ);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


