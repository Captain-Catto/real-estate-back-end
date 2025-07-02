import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { setRoutes } from "./routes/index";
import { requestLogger } from "./middleware/index";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// MongoDB connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/my-backend-app"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Middleware setup
app.use(
  cors({
    origin: "http://localhost:3000", // Chỉ định cụ thể origin
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
