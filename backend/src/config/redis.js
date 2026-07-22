const Redis = require("ioredis");

const redis = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
    lazyConnect: false,
  }
);

redis.on("error", (error) => {
  console.error("Redis error:", error.message);
});

module.exports = redis;
