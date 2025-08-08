const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const userPermissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  permissions: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserPermission = mongoose.model("UserPermission", userPermissionSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "employee", "user"], default: "user" },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active",
  },
});

const User = mongoose.model("User", userSchema);

async function removeTransactionPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔗 Connected to MongoDB");

    console.log(
      "🔥 Removing view_transactions permission from all employees..."
    );

    // Tìm tất cả employee
    const employees = await User.find({ role: "employee" });
    console.log("👥 Found", employees.length, "employees");

    let updatedCount = 0;

    for (const employee of employees) {
      const result = await UserPermission.updateOne(
        { userId: employee._id },
        {
          $pull: {
            permissions: {
              $in: ["view_transactions", "view_transaction_history"],
            },
          },
        }
      );

      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(
          `✅ Updated ${employee.username}: ${result.modifiedCount} permissions removed`
        );
      } else {
        console.log(
          `ℹ️  ${employee.username}: No transaction permissions found`
        );
      }
    }

    console.log(
      `\n📊 Summary: Updated ${updatedCount} out of ${employees.length} employees`
    );

    // Verify the changes
    console.log("\n🔍 Verification:");
    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });
      const hasTransactionPerms = permissions
        ? permissions.permissions.some((p) => p.includes("transaction"))
        : false;

      console.log(
        `${employee.username}: Has transaction permissions: ${hasTransactionPerms}`
      );
    }

    console.log(
      "\n🎉 Done! All employees should no longer have view_transactions permission."
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.disconnect();
    console.log("👋 Database connection closed");
  }
}

removeTransactionPermissions();
