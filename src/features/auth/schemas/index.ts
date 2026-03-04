import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Please enter a valid email address" }),
  password: z.string().min(1, { error: "Password is required" }),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, { error: "Name must be at least 2 characters" }),
    email: z.email({ error: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .check((ctx) => {
    if (ctx.value.password !== ctx.value.confirmPassword) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const profileSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
