import express from "express";
import * as jose from "jose";
import crypto from "node:crypto";
import dotenv from "dotenv";
import amqp from "amqplib";

dotenv.config();

export const app = express();
/** @type {amqp.Connection} */
let MQConnection;
const queueName = "matchmaking-queue";
(async () => {
  MQConnection = await amqp.connect({
    hostname: process.env.RABBITMQ_HOST,
    port: process.env.RABBITMQ_PORT,
    username: process.env.RABBITMQ_USERNAME,
    password: process.env.RABBITMQ_PASSWORD,
  });
  console.log("connected to rabbitmq");
})();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("x-powered-by", false);
app.set("etag", false);

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const middleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { payload } = await jose.jwtVerify(token, secret);
    req.userId = payload.userId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Handle authorization token
 */
app.post("/login", async (req, res, next) => {
  try {
    const userId = crypto.randomUUID();
    const token = await new jose.SignJWT({
      userId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(secret);
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
});

/**
 * Handle matchmaking
 */
app.post("/join", middleware, async (req, res, next) => {
  try {
    const userId = req.userId;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const correlationId = crypto.randomUUID();

    const channel = await MQConnection.createChannel();
    const { queue } = await channel.assertQueue("", {
      exclusive: true,
    });
    channel.consume(
      queue,
      (msg) => {
        if (msg.properties.correlationId === correlationId) {
          setTimeout(() => {
            res.status(200).json({
              message: "Match found",
              me: userId,
              data: JSON.parse(msg.content.toString()),
            });
          }, 500);
        }
      },
      {
        noAck: true,
      }
    );
    channel.sendToQueue(
      queueName,
      Buffer.from(
        JSON.stringify({
          userId,
        })
      ),
      {
        correlationId,
        replyTo: queue,
      }
    );

    let counter = 0;
    const intervalCounter = setInterval(() => {
      counter++;
      return res.write(counter.toString());
    }, 1000);

    req.on("close", () => {
      clearInterval(intervalCounter);
      res.end();
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Handle error and default route
 */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "something went wrong" });
});
app.use((_req, res) => {
  res.status(404).json({ message: "not found" });
});
