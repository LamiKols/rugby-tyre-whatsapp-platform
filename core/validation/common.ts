import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().min(1)
});

export const paginationQuerySchema = z.object({
  search: z.string().trim().optional()
});

