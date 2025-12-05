import { AiModels, providerName } from "@/lib/ai/model";
import { db } from "@/lib/db";
import { type MessagesSelect, messages } from "@/lib/db/schema";
import { createServerFn } from "@tanstack/react-start";

/**
 * Creates a new message with feedback in the database.
 * @param messageData - The data for the new message with Feedback.
 * @returns A Promise that resolves to the added message data.
 * @throws {Error} If there's a database error.
 */
export const addMessage = createServerFn({ method: "POST" })
  .validator((messageData: Partial<MessagesSelect>) => {
    if (!messageData) {
      throw new Error("Invalid message data");
    }

    if (messageData.modelName) {
      if (process.env.MODE === "prod") {
        // drop model if we are in production, setting this is only valid in dev
        // changing to default
        console.warn(
          `Tried to add message with custom model prod mode - Message Data: ${JSON.stringify(messageData)}`,
        );
        messageData.modelName = undefined;
      }
    }

    return messageData;
  })
  .handler(async ({ data }: { data: Partial<MessagesSelect> }) => {
    data.modelName = data.modelName ?? AiModels[providerName][0];

    try {
      const [newMessage] = await db
        .insert(messages)
        .values(data as MessagesSelect)
        .returning();
      return {
        ...newMessage,
        feedback:
          typeof newMessage.feedback === "object" &&
          newMessage.feedback !== null
            ? newMessage.feedback
            : {},
      };
    } catch (error) {
      console.error("Error creating message:", error);
      throw new Error("Failed to create message");
    }
  });

export const getMessages = createServerFn({ method: "POST" })
  .validator((key: string) => {
    if (!key) {
      throw new Error("Key is missing");
    }

    return { key };
  })
  .handler(async ({ data }: { data: { key: string } }) => {
    if (
      !process.env.DATA_EXPORT_KEY ||
      data.key !== process.env.DATA_EXPORT_KEY
    ) {
      throw new Error("Key invalid");
    }

    try {
      const data = await db.select().from(messages);
      const mapped = data.map((msg) => ({
        ...msg,
        feedback:
          typeof msg.feedback === "object" && msg.feedback !== null
            ? msg.feedback
            : {},
      }));
      return mapped;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw new Error("Failed to fetch data");
    }
  });
