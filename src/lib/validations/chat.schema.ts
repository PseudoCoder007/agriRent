import { z } from "zod";

export const saveChatMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    // .max(2000) cap mirrors createEquipmentSchema's description cap and is
    // the RESEARCH.md Security Domain DoS mitigation -- do not raise without
    // updating that rationale.
    content: z.string().min(1).max(2000),
  })
  .strict();

export type SaveChatMessageInput = z.infer<typeof saveChatMessageSchema>;
