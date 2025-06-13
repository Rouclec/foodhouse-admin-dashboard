"use client";

import type React from "react";
import { useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { updateAuthHeader } from "@/utils";
import { Context, type ContextType } from "../contexts/QueryProvider";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  usersGetUserByIdOptions,
  usersRefreshAccessTokenMutation,
  usersRevokeRefreshTokenMutation,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { useLoadingState } from "@/hooks/use-with-loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser } = useContext(Context) as ContextType;
  const [refetchUser, setRefetchUser] = useState(false);
  const { withLoading } = useLoadingState();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { mutate: revokeToken } = useMutation(
    usersRevokeRefreshTokenMutation()
  );

  const handleSignOut = async () => {
    try {
      const refreshToken = localStorage.getItem("@refreshToken");

      if (refreshToken) {
        revokeToken({
          body: {
            refreshToken: refreshToken,
          },
        });
      }

      localStorage.removeItem("@refreshToken");
      localStorage.removeItem("@userId");

      router.push("/auth/login");
    } catch (error) {
      console.error("Error during sign out:", error);
      router.push("/auth/login");
    }
  };

  const { mutateAsync: refreshAccessToken } = useMutation({
    ...usersRefreshAccessTokenMutation(),
    onSuccess: (data) => {
      updateAuthHeader(data?.accessToken ?? "");
    },
    onError: () => {
      handleSignOut();
    },
  });

  const { data: fetchedUserData } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: user?.userId ?? "",
      },
    }),
    enabled: !!user?.userId && refetchUser,
  });

  useEffect(() => {
    if (fetchedUserData?.user?.email) {
      setUser(fetchedUserData.user);
      setIsAuthenticated(true);
    }
  }, [fetchedUserData]);

  useEffect(() => {
    const checkAuthentication = async () => {
      await withLoading(
        async () => {
          // 1. Check if the refreshToken and userId exist in the local storage
          const refreshToken = localStorage.getItem("@refreshToken");
          const userId = localStorage.getItem("@userId");

          // 2. If the refresh token or the userId doesn't exist, log the user out
          if (!refreshToken || !userId) {
            throw new Error("Missing authentication tokens");
          }

          // 3. Check if the accessToken exists
          const accessToken = localStorage.getItem("@accessToken");

          // If no accessToken, get a new one using the refreshToken
          if (!accessToken) {
            const result = await refreshAccessToken({
              body: {
                refreshToken: refreshToken as string,
              },
            });

            if (!result?.accessToken) {
              throw new Error("Failed to refresh access token");
            }
          } else {
            // Update auth header with existing accessToken
            updateAuthHeader(accessToken);
          }

          // 4. If the user doesn't exist in context, fetch user data
          if (!user?.email) {
            setUser({
              ...user,
              userId: userId as string,
            });
            setRefetchUser(true);
          } else {
            // User already exists in context, mark as authenticated
            setIsAuthenticated(true);
          }

          // Clean up accessToken from localStorage after it's been used
          localStorage.removeItem("@accessToken");
        },
        {
          // loadingMessage: "Verifying your session...",
          onError: (error) => {
            console.error("Authentication error:", error);
            handleSignOut();
            return false;
          },
        }
      );
    };

    checkAuthentication();
  }, []);

  // Don't render anything until authentication check is complete
  if (!isAuthenticated) {
    return null; // The loading spinner will be shown by the LoadingProvider
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-4 sm:p-6 bg-gray-50 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
