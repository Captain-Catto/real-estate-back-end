const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/realestate");
    console.log("Connected to database");

    // Check user with exact ID
    const { User } = require("./src/models");
    const exactUser = await User.findById("68983bbbca6c4849877f7873");
    console.log("\n🔍 User with ID 68983bbbca6c4849877f7873:");
    console.log(
      exactUser
        ? {
            id: exactUser._id,
            email: exactUser.email,
            name: exactUser.name,
            role: exactUser.role,
          }
        : "User not found"
    );

    // Check user with notifications
    const userWithNotifications = await User.findById(
      "686cc6b72e3ab0fe8c6fcc25"
    );
    console.log("\n🔍 User with ID 686cc6b72e3ab0fe8c6fcc25:");
    console.log(
      userWithNotifications
        ? {
            id: userWithNotifications._id,
            email: userWithNotifications.email,
            name: userWithNotifications.name,
            role: userWithNotifications.role,
          }
        : "User not found"
    );

    // Check recent payments for both users
    const { Payment } = require("./src/models");
    const paymentsForExactUser = await Payment.find({
      userId: "68983bbbca6c4849877f7873",
    })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log("\n💳 Recent payments for 68983bbbca6c4849877f7873:");
    paymentsForExactUser.forEach((payment, index) => {
      console.log(
        `${index + 1}. ${payment.amount} VND - ${payment.status} - ${
          payment.createdAt
        } - ID: ${payment._id}`
      );
    });

    const paymentsForUserWithNoti = await Payment.find({
      userId: "686cc6b72e3ab0fe8c6fcc25",
    })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log("\n💳 Recent payments for 686cc6b72e3ab0fe8c6fcc25:");
    paymentsForUserWithNoti.forEach((payment, index) => {
      console.log(
        `${index + 1}. ${payment.amount} VND - ${payment.status} - ${
          payment.createdAt
        } - ID: ${payment._id}`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

connectDB();
