"use client";

import type React from "react";

import { useState, useEffect, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { delay } from "@/utils/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  usersAuthenticateMutation,
  usersGetUserByIdOptions,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { updateAuthHeader } from "@/utils";
import { Context, ContextType } from "@/app/contexts/QueryProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userIdState, setUserIdState] = useState<string>();
  const { setUser } = useContext(Context) as ContextType;
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Get the redirect path from the URL if it exists
  const from = (searchParams.get("from") ||
    "/dashboard") as __next_route_internal_types__.RouteImpl<string>;

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    try {
      setIsLoading(true);
      await mutateAsync({
        body: {
          factors: [
            {
              type: "FACTOR_TYPE_EMAIL_PASSWORD",
              id: email,
              secretValue: password,
            },
          ],
        },
      });
    } catch (error) {
      console.error("error siging in");
    }
  };

  const { mutateAsync } = useMutation({
    ...usersAuthenticateMutation(),
    onSuccess: (data) => {
      localStorage.setItem("@refreshToken", data?.tokens?.refreshToken ?? "");
      localStorage.setItem("@userId", data?.userId ?? "");
      localStorage.setItem("@accessToken", data?.tokens?.accessToken ?? "");
      updateAuthHeader(data?.tokens?.accessToken ?? "");
      console.log({ data });
      setUserIdState(data?.userId ?? "");
    },
    onError: async (error) => {
      setIsLoading(false);
      setError(
        error?.response?.data?.message ??
          "Sign-in failed. Please check your credentials"
      );
      await delay(5000);
      setError("");
    },
  });

  console.log({ userIdState });

  const { data: userData } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: userIdState ?? "",
      },
    }),
    enabled: !!userIdState,
  });

  useEffect(() => {
    if (userData?.user) {
      if (userData?.user?.role != "USER_ROLE_ADMIN") {
        localStorage.removeItem("@refreshToken");
        localStorage.removeItem("@userId");
        localStorage.removeItem("@accessToken");
        return router.push("/forbidden");
      }
      setUser(userData?.user);
      setIsLoading(false);
      toast({
        title: "Login successful",
        description: `Welcome back to FoodHouse ${
          userData?.user?.firstName ?? "Admin"
        }!`,
      });
      return router.push(from);
    }
  }, [userData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F6F6F6] to-[#F3F3F3] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-full">
              <Leaf className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">FoodHouse Admin</CardTitle>
          <CardDescription>
            Sign in to your admin account to manage the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@foodhouse.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>

            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          {/* <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2 font-medium">
              Demo credentials:
            </p>
            <p className="text-xs text-gray-500">
              📧 Email: admin@foodhouse.com
            </p>
            <p className="text-xs text-gray-500">🔑 Password: admin123</p>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
