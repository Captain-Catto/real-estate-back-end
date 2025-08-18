import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { setRoutes } from "./routes/index";
import { requestLogger } from "./middleware/index";
import { paymentScheduler } from "./services/paymentScheduler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/real-estate")
  .then(() => {
    console.log("Connected to MongoDB");

    // Import project price ranges
    import("./models/Price").then(({ importProjectPriceRanges }) => {
      importProjectPriceRanges();
    });

    // Bắt đầu payment scheduler để tự động hủy giao dịch pending quá hạn
    paymentScheduler.start();
    console.log("Payment scheduler started");
  })
  .catch((error) => console.error("MongoDB connection error:", error));

// Middleware setup
app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")
      : ["http://localhost:3000", "http://127.0.0.1:3000"], // Frontend origins
    credentials: true, // Cho phép gửi cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

// Static files for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Initialize routes
setRoutes(app);

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  paymentScheduler.stop();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  paymentScheduler.stop();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
