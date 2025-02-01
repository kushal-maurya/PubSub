import {
    SQSClient,
    ReceiveMessageCommand,
    DeleteMessageCommand,
  } from "@aws-sdk/client-sqs";
  import mongoose from "mongoose";
  import ProcessedUser from "../receiver/models/ProcessedUser.js";
  import dotenv from "dotenv";
  
  dotenv.config({ path: "../../.env" });
  
  // MongoDB connection
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      process.exit(1);
    });
  
  console.log("Listener file");
  
  // SQS Client setup
  const sqsClient = new SQSClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
  });
  
  const processMessage = async (message) => {
    try {
      const userData = JSON.parse(message.Body);
  
      // Add modified_at timestamp
      const modified_at = new Date();
      const updatedUserData = { ...userData, modified_at };
  
      // Save to the second table
      const processedUser = new ProcessedUser(updatedUserData);
      await processedUser.save(); // Save the data to the second table
      console.log("Saved to second table:", updatedUserData);
  
      // Removing the message from the queue after successful processing
      const deleteParams = {
        QueueUrl: process.env.SQS_QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle,
      };
      await sqsClient.send(new DeleteMessageCommand(deleteParams));
      console.log("Message deleted from queue:", message.MessageId);
    } catch (error) {
      console.error("Error processing message:", error.message);
    }
  };
  
  const listenToQueue = async () => {
    const params = {
      QueueUrl: process.env.SQS_QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    };
  
    try {
      const data = await sqsClient.send(new ReceiveMessageCommand(params));
      if (data.Messages && data.Messages.length > 0) {
        console.log(`Received ${data.Messages.length} messages from the queue`);
  
        // Process all messages concurrently
        await Promise.all(data.Messages.map(processMessage));
  
        // Continue listening
        listenToQueue();
      } else {
        console.log("No messages in the queue. Waiting...");
        setTimeout(listenToQueue, 3000); // Wait for 3 seconds before polling again
      }
    } catch (error) {
      console.error("Error receiving messages from queue:", error.message);
      // Retry after a delay in case of transient issues
      setTimeout(listenToQueue, 3000);
    }
  };
  
  listenToQueue();
  