const { MongoClient } = require("mongodb");

async function createTestContact() {
  const client = new MongoClient("mongodb://localhost:27017");

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("real-estate");
    const contacts = db.collection("contacts");

    // Create test contact for user2
    const testContact = {
      senderId: "test-sender-id",
      receiverId: "68808802d25e70f9a13f80b6", // user2 ID from logs
      fullName: "Test Contact for Dashboard",
      email: "test@example.com",
      phone: "0123456789",
      message: "This is a test contact to verify dashboard functionality",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await contacts.insertOne(testContact);
    console.log("✅ Test contact created:", result.insertedId);

    // Check total contacts
    const count = await contacts.countDocuments();
    console.log("📊 Total contacts in DB:", count);

    // Check contacts for user2
    const user2Contacts = await contacts.countDocuments({
      receiverId: "68808802d25e70f9a13f80b6",
    });
    console.log("📞 Contacts for user2:", user2Contacts);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

createTestContact();
