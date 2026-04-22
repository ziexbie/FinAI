require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./connection");
const authRoutes = require("./routes/authRoutes");
const financeRoutes = require("./routes/financeRoutes");

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and the deployed frontend while keeping other origins blocked.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed."));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Authentication API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/finance", financeRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in the backend environment variables.");
    }

    await connectDB();

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
