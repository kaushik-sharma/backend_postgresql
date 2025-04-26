import Redis from "ioredis";
import RedisStore from "rate-limit-redis";

export default class RedisService {
  static #client: Redis;

  static get client(): Redis {
    if (!this.#client) {
      throw new Error("Redis client not initialized. Call initClient() first.");
    }
    return this.#client;
  }

  static readonly initClient = async (): Promise<void> => {
    if (!this.#client) {
      this.#client = new Redis({
        host: process.env.REDIS_HOST!,
        port: Number(process.env.REDIS_PORT!),
        username: process.env.REDIS_USERNAME!,
        password: process.env.REDIS_PASSWORD!,
        lazyConnect: true,
      });
      await this.#client.connect();
    }
  };

  static readonly hitCountStore = (): RedisStore => {
    return new RedisStore({
      // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
      sendCommand: (...args: string[]) => this.#client.call(...args),
    });
  };
}
