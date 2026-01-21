const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/roomie";

mongoose
  .connect(MONGO_URI, {
    dbName: "roomie",                
    serverSelectionTimeoutMS: 10000,
  })
  .then((x) => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
  });