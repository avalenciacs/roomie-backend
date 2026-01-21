const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/roomie";

async function connectDB() {
  if (
    mongoose.connection.readyState === 1 ||
    mongoose.connection.readyState === 2
  ) {
    console.log("MongoDB already connected or connecting");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      dbName: "roomie",                 // 🔑 fuerza la DB correcta
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected to roomie");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err; // importante para que Vercel sepa que falló
  }
}

module.exports = { connectDB };