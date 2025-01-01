import { beforeAll } from "vitest";
import { describe, it, expect, vi } from "vitest";
import { app } from "./server";
import amqp from "amqplib";
import { beforeEach } from "vitest";

describe("server", () => {
  beforeAll(async () => {
    app.listen(3000);
    await amqp.connect({
      hostname: process.env.RABBITMQ_HOST,
      port: process.env.RABBITMQ_PORT,
      username: process.env.RABBITMQ_USERNAME,
      password: process.env.RABBITMQ_PASSWORD,
    });
  });
  it.concurrent("should return token when hit /login", async () => {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("token");
    expect(typeof data.token).toBe("string");
  });
  it.concurrent(
    "should return unauthorized when hit /join without token",
    async () => {
      const res = await fetch("http://localhost:3000/join", {
        method: "POST",
      });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data).toEqual({ message: "Unauthorized" });
    }
  );
  describe("when hit /join with token", () => {
    const tokenHeader = new Array();

    beforeEach(async () => {
      const { token } = await fetch("http://localhost:3000/login", {
        method: "POST",
      }).then((res) => res.json());
      tokenHeader.push(token);
    });

    it.concurrent(
      "should return welcome when hit /join with token",
      async () => {
        const res = await fetch("http://localhost:3000/join", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenHeader.shift()}`,
            "Content-Type": "application/json",
          },
        });
        const body = res.body.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
          const { value, done } = await body.read();
          if (done) {
            break;
          }
          console.log(JSON.parse(value));
        }
        await vi.waitFor(
          () => {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                resolve();
              }, 1000);
            });
          },
          {
            interval: 1000,
            timeout: 10_000,
          }
        );
      }
    );

    it.concurrent(
      "should return welcome when hit /join with token",
      async () => {
        const res = await fetch("http://localhost:3000/join", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenHeader.shift()}`,
            "Content-Type": "application/json",
          },
        });
        const body = res.body.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
          const { value, done } = await body.read();
          if (done) {
            break;
          }
          console.log(JSON.parse(value));
        }
        await vi.waitFor(
          () => {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                resolve();
              }, 1000);
            });
          },
          {
            interval: 1000,
            timeout: 10_000,
          }
        );
      }
    );

    it.concurrent(
      "should return welcome when hit /join with token",
      async () => {
        const res = await fetch("http://localhost:3000/join", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenHeader.shift()}`,
            "Content-Type": "application/json",
          },
        });
        const body = res.body.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
          const { value, done } = await body.read();
          if (done) {
            break;
          }
          console.log(JSON.parse(value));
        }
        await vi.waitFor(
          () => {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                resolve();
              }, 1000);
            });
          },
          {
            interval: 1000,
            timeout: 10_000,
          }
        );
      }
    );

    it.concurrent(
      "should return welcome when hit /join with token",
      async () => {
        const res = await fetch("http://localhost:3000/join", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenHeader.shift()}`,
            "Content-Type": "application/json",
          },
        });
        const body = res.body.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
          const { value, done } = await body.read();
          if (done) {
            break;
          }
          console.log(JSON.parse(value));
        }
        await vi.waitFor(
          () => {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                resolve();
              }, 1000);
            });
          },
          {
            interval: 1000,
            timeout: 10_000,
          }
        );
      }
    );
  });
});
