"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createRegisterSchema,
  type RegisterFormValues,
} from "@/lib/schemas/authSchema";
import { useLocalePrefix, withLocalePath } from "@/lib/locale-path";
import { cn } from "@/lib/utils";

function RegisterForm({ className, ...props }: React.ComponentProps<"div">) {
  const { t } = useTranslation("common");
  const prefix = useLocalePrefix();
  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const notify = (message: string, type: "success" | "error" | "info") => {
    toast[type](message);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitForm = async (data: RegisterFormValues) => {
    const { username, password, confirmPassword } = data;

    if (password !== confirmPassword) {
      notify(t("common.register.messages.passwordsMismatch"), "error");
      return;
    }

    if (!username || !password || !confirmPassword) {
      notify(t("common.register.messages.requiredFields"), "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, confirmPassword }),
      });

      const text = await response.text();
      let body: { message?: string } = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = { message: text };
      }

      if (response.ok) {
        notify(t("common.register.messages.success"), "success");
        reset();
      } else {
        notify(
          typeof body?.message === "string"
            ? body.message
            : t("common.register.messages.failed"),
          "error",
        );
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("common.register.messages.unexpected");
      notify(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {t("common.register.title")}
          </CardTitle>
          <CardDescription>{t("common.register.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleSubmitForm)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">
                  {t("common.register.usernameLabel")}
                </FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("common.register.usernamePlaceholder")}
                  required
                  {...register("username")}
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">
                      {t("common.register.passwordLabel")}
                    </FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      required
                      {...register("password")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      {t("common.register.confirmPasswordLabel")}
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      {...register("confirmPassword")}
                      {...(errors.confirmPassword && {
                        "aria-invalid": "true",
                      })}
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  {t("common.register.passwordHint")}
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? t("common.register.submitting")
                    : t("common.register.submit")}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterForm;
