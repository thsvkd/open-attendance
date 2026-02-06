"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useTranslations } from "next-intl";

const formSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

interface AuthFormProps {
  variant: "register" | "setup";
}

export function AuthForm({ variant }: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const t = useTranslations("auth");

  const uiConfig = {
    register: {
      title: t("register.title"),
      description: t("createAccount"),
      emailPlaceholder: "user@example.com",
      submitLabel: t("register.submit"),
      loadingLabel: t("register.submitting"),
      successMessage: t("register.success"),
      width: "w-[350px]",
      showFooter: true,
    },
    setup: {
      title: t("setup.title"),
      description: t("setup.description"),
      emailPlaceholder: "admin@example.com",
      submitLabel: t("setup.submit"),
      loadingLabel: t("setup.submitting"),
      successMessage: t("setup.success"),
      width: "w-[400px]",
      showFooter: false,
    },
  }[variant];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = values;
      await axios.post("/api/register", registerData);
      toast.success(uiConfig.successMessage);
      router.push("/login");
    } catch {
      toast.error(t("somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className={uiConfig.width}>
      <CardHeader>
        <CardTitle>{uiConfig.title}</CardTitle>
        <CardDescription>{uiConfig.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input placeholder={uiConfig.emailPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("confirmPassword")}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? uiConfig.loadingLabel : uiConfig.submitLabel}
            </Button>
          </form>
        </Form>
      </CardContent>
      {uiConfig.showFooter && (
        <CardFooter>
          <Button variant="link" className="w-full" asChild>
            <Link href="/login">{t("alreadyHaveAccount")}</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
