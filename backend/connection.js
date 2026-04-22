const mongoose = require("mongoose");

const connectDB = async () => {
  const databaseUrl = process.env.DB_URL;

  if (!databaseUrl) {
    throw new Error("DB_URL is missing in the backend environment variables.");
  }

  await mongoose.connect(databaseUrl);
  console.log("MongoDB connection established.");
};

module.exports = { connectDB, mongoose };
