require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const redis = require("./src/config/redis");

const PORT = Number(process.env.PORT || 5000);

async function start() {
  try {
    await connectDB();
    await redis.ping();
    console.log("Redis connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

start();
