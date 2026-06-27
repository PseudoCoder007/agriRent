import { z } from "zod";

export const toggleFavoriteSchema = z
  .object({
    equipmentId: z.string().uuid(),
  })
  .strict();

export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;
