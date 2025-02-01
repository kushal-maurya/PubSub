import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import { validatePayload } from "./utils/validation.js";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"; // AWS SDK v3

dotenv.config({ path: "../../.env" });

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const QUEUE_URL = process.env.SQS_QUEUE_URL;

// POST /receiver endpoint
app.post("/receiver", async (req, res) => {
  try {
    const { user, class: userClass, age, email } = req.body;

    // Validate the payload
    const validationError = validatePayload({ user, userClass, age, email });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Save to MongoDB
    const id = uuidv4();
    const inserted_at = new Date();
    const userData = { id, user, class: userClass, age, email, inserted_at };
    const newUser = new User(userData);
    await newUser.save();

    // Publish to SQS
    const sqsParams = {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(userData),
    };
    const command = new SendMessageCommand(sqsParams);
    await sqsClient.send(command);

    // Respond with success
    res
      .status(201)
      .json({ message: "Data saved and event published", data: userData });
  } catch (error) {
    console.error("Error in /receiver endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Receiver Service running on port ${PORT}`));
