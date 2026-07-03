import { z } from "zod";

/**
 * The wire contract: zod schemas + inferred types shared by BOTH the web apps and the
 * APIs, so client and server agree on one source of truth. Domain models (Card, Message,
 * …) are added by the modules that introduce them.
 */
export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).nullable(),
});
export type User = z.infer<typeof UserSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginSchema>;
