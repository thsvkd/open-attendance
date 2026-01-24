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

const CONFIG = {
  register: {
    title: "Register",
    description: "Create an account to get started.",
    emailPlaceholder: "m@example.com",
    submitLabel: "Register",
    loadingLabel: "Creating account...",
    successMessage: "Account created! Please login.",
    width: "w-[350px]",
    showFooter: true,
  },
  setup: {
    title: "Initial Setup",
    description: "Welcome! Create your administrator account to get started.",
    emailPlaceholder: "admin@example.com",
    submitLabel: "Create Admin Account",
    loadingLabel: "Creating admin account...",
    successMessage: "Admin account created! Please login.",
    width: "w-[400px]",
    showFooter: false,
  },
} as const;

export function AuthForm({ variant }: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const config = CONFIG[variant];

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
      toast.success(config.successMessage);
      router.push("/login");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className={config.width}>
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder={config.emailPlaceholder} {...field} />
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
                  <FormLabel>Password</FormLabel>
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
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? config.loadingLabel : config.submitLabel}
            </Button>
          </form>
        </Form>
      </CardContent>
      {config.showFooter && (
        <CardFooter>
          <Button variant="link" className="w-full" asChild>
            <Link href="/login">Already have an account? Login</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
