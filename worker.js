import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

/** @type {amqp.Connection} */
let MQConnection;
const queueName = "matchmaking-queue";

/**
 * waitingRoom are bunch of players that are waiting for a match
 * if the player is the first player, it will wait until another player join
 * if the player is the second player, it will be matched with the first player
 * @type {Map<string, { userId: string, replyTo: string, correlationId: string }[]>}
 */
const waitingRoom = new Map();

export async function matchmaking() {
  if (!MQConnection) return;
  const channel = await MQConnection.createChannel();
  channel.assertQueue(queueName, {
    durable: false,
  });
  channel.prefetch(1);
  console.log(`[x] Awaiting RPC requests on ${queueName}`);
  channel.consume(queueName, (msg) => {
    if (!msg) return;
    const data = JSON.parse(msg.content.toString());

    /**
     * check if the player is the first player
     */
    if (waitingRoom.size === 0) {
      waitingRoom.set(data.userId, [
        {
          userId: data.userId,
          replyTo: msg.properties.replyTo,
          correlationId: msg.properties.correlationId,
        },
      ]);
    } else {
      /**
       * get the first player in the waitingRoom
       */
      const [player1] = waitingRoom.values().next().value;
      const match = JSON.stringify({
        player1: player1.userId,
        player2: data.userId,
      });
      // send to player 1
      channel.sendToQueue(player1.replyTo, Buffer.from(match), {
        correlationId: player1.correlationId,
      });
      // send to player 2
      channel.sendToQueue(msg.properties.replyTo, Buffer.from(match), {
        correlationId: msg.properties.correlationId,
      });
    }
    channel.ack(msg);
  });
}
(async () => {
  MQConnection = await amqp.connect({
    hostname: process.env.RABBITMQ_HOST,
    port: process.env.RABBITMQ_PORT,
    username: process.env.RABBITMQ_USERNAME,
    password: process.env.RABBITMQ_PASSWORD,
  });
  console.log("WORKER connected to MQ");
  await matchmaking();
})();
