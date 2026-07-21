import type { TFunction } from "i18next";
import * as z from "zod";

/** Server-side / default validation (English). */
export const RegisterSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterSchema = z.infer<typeof RegisterSchema>;

export function createRegisterSchema(t: TFunction<"common", undefined>) {
  return z
    .object({
      username: z.string().min(3, t("common.validation.registerUsernameMin")),
      password: z.string().min(8, t("common.validation.registerPasswordMin")),
      confirmPassword: z.string().min(8, t("common.validation.registerConfirmMin")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("common.validation.passwordsMismatch"),
      path: ["confirmPassword"],
    });
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;

export const LoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export type LoginSchema = z.infer<typeof LoginSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof ChangePasswordSchema>;

/** Client form with translated validation messages. */
export function createChangePasswordFormSchema(t: TFunction<"common", undefined>) {
  return z
    .object({
      currentPassword: z.string().min(1, t("common.validation.changePasswordCurrentRequired")),
      newPassword: z.string().min(8, t("common.validation.changePasswordNewMin")),
      confirmPassword: z.string().min(1, t("common.validation.changePasswordConfirmRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("common.validation.passwordsMismatch"),
      path: ["confirmPassword"],
    });
}

export type ChangePasswordFormValuesI18n = z.infer<
  ReturnType<typeof createChangePasswordFormSchema>
>;