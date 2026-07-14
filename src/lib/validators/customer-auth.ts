import { z } from "zod";

export const customerRegisterSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .max(100),
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
